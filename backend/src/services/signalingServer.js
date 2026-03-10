const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const consultationService = require("./consultationService");
const videoLogService = require("./videoLogService");

/**
 * WebRTC Signaling Server
 * 
 * Socket.IO server for real-time WebRTC signaling:
 * - JWT-authenticated connections
 * - Room-based video call signaling
 * - SDP offer/answer exchange
 * - ICE candidate forwarding
 * - Call lifecycle events
 * 
 * All connections are authenticated via JWT token in handshake.
 * Doctors automatically join the "doctors" room for broadcast notifications.
 */

let io;

const initSignalingServer = (httpServer, corsOptions) => {
  io = new Server(httpServer, {
    cors: {
      origin: corsOptions.origin,
      credentials: true,
      methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"]
  });

  // ── JWT Authentication Middleware ──────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Invalid or expired token"));
    }
  });

  // ── Connection Handler ────────────────────────────────────────
  io.on("connection", (socket) => {
    const { userId, role } = socket.user;
    console.log(`🔌 Socket connected: ${userId} (${role})`);

    // Join user-specific room for targeted notifications
    socket.join(`user-${userId}`);

    // Doctors join the broadcast room for incoming consultation requests
    if (role === "DOCTOR") {
      socket.join("doctors");
      socket.join(`doctor-${userId}`);
    }

    if (role === "PATIENT") {
      socket.join(`patient-${userId}`);
    }

    // ── JOIN_ROOM ─────────────────────────────────────────────
    // Both doctor and patient join the video room for a session
    socket.on("JOIN_ROOM", async ({ sessionId }) => {
      try {
        const session = await consultationService.getSessionById(sessionId, socket.user);
        if (!session) {
          return socket.emit("ERROR", { message: "Session not found" });
        }

        // Check room hasn't expired
        if (session.roomExpiry && new Date() > new Date(session.roomExpiry)) {
          return socket.emit("ERROR", { message: "Room has expired" });
        }

        const roomName = `room-${sessionId}`;
        socket.join(roomName);

        // Notify others in the room
        socket.to(roomName).emit("PEER_JOINED", {
          userId,
          role,
          sessionId
        });

        const evntType = role === "DOCTOR" ? "DOCTOR_JOINED" : "PATIENT_JOINED";
        await videoLogService.logSystemEvent(sessionId, evntType, { userId });

        socket.emit("ROOM_JOINED", {
          sessionId,
          roomId: session.roomId,
          participants: Array.from(io.sockets.adapter.rooms.get(roomName) || []).length
        });

        // If both parties are in the room, start the session
        const roomSize = io.sockets.adapter.rooms.get(roomName)?.size || 0;
        if (roomSize >= 2 && session.status === "ASSIGNED") {
          await consultationService.startSession(sessionId);
          io.to(roomName).emit("SESSION_STARTED", { sessionId });
        }

        console.log(`📺 ${userId} joined room ${roomName} (${roomSize} participants)`);
      } catch (err) {
        socket.emit("ERROR", { message: err.message });
      }
    });

    // ── OFFER ─────────────────────────────────────────────────
    // Forward WebRTC SDP offer to the other peer
    socket.on("OFFER", ({ sessionId, sdp }) => {
      const roomName = `room-${sessionId}`;
      socket.to(roomName).emit("OFFER", {
        sdp,
        from: userId
      });
    });

    // ── ANSWER ────────────────────────────────────────────────
    // Forward WebRTC SDP answer to the other peer
    socket.on("ANSWER", ({ sessionId, sdp }) => {
      const roomName = `room-${sessionId}`;
      socket.to(roomName).emit("ANSWER", {
        sdp,
        from: userId
      });
    });

    // ── ICE_CANDIDATE ─────────────────────────────────────────
    // Forward ICE candidates for NAT traversal
    socket.on("ICE_CANDIDATE", ({ sessionId, candidate }) => {
      const roomName = `room-${sessionId}`;
      socket.to(roomName).emit("ICE_CANDIDATE", {
        candidate,
        from: userId
      });

      // Quick-fire metric: First ice candidate exchanged marks connection established intent
      videoLogService.logSystemEvent(sessionId, "ICE_EXCHANGE_SUCCESS");
    });

    // ── END_CALL ──────────────────────────────────────────────
    // Notify all peers that the call has ended
    socket.on("END_CALL", async ({ sessionId }) => {
        try {
          const roomName = `room-${sessionId}`;
          socket.to(roomName).emit("CALL_ENDED", { sessionId, endedBy: userId });
          
          // Leave the room
          socket.leave(roomName);

          await videoLogService.logSystemEvent(sessionId, "CALL_TERMINATED_BY_USER", { userId, role });

          console.log(`📴 ${userId} ended call in session ${sessionId}`);
        } catch (err) {
        socket.emit("ERROR", { message: err.message });
      }
    });

    // ── DISCONNECT ────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${userId} (${role})`);
      // Optional: find out which rooms the socket was in before disconnect and log a CONNECTION_DROPPED event
    });
  });

  console.log("✅ WebRTC Signaling Server initialized");
  return io;
};

const getIO = () => io;

module.exports = { initSignalingServer, getIO };
