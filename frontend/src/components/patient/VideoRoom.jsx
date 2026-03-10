import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Clock, Shield, Wifi, Maximize2, Minimize2, Upload, FileText, Activity, User, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import teleconsultationApi from '../../api/teleconsultationApi';

/**
 * VideoRoom Component
 * 
 * WebRTC peer-to-peer video call with Socket.IO signaling.
 * - DTLS + SRTP encryption (automatic with WebRTC)
 * - ICE candidate exchange via Socket.IO
 * - STUN server for NAT traversal
 * - Call controls: mute mic, toggle camera, end call
 * - Session timer
 */

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
    ]
};

const VideoRoom = ({ sessionId, session, onCallEnd }) => {
    const { user, token } = useAuth();
    const [connectionState, setConnectionState] = useState('connecting');
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [remoteConnected, setRemoteConnected] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Advanced Features State
    const [networkQuality, setNetworkQuality] = useState('good');
    const [showSidebar, setShowSidebar] = useState(false);
    const [activeSidebarTab, setActiveSidebarTab] = useState(user.role === 'DOCTOR' ? 'notes' : 'profile');
    const [liveNotes, setLiveNotes] = useState(session?.notes || '');
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [escalating, setEscalating] = useState(false);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const socketRef = useRef(null);
    const localStreamRef = useRef(null);
    const timerRef = useRef(null);
    const networkMonitorRef = useRef(null);
    const containerRef = useRef(null);
    const fileInputRef = useRef(null);
    const metricsHistoryRef = useRef({ packetLoss: [], rtt: [] });

    // Format seconds to MM:SS
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Cleanup function
    const cleanup = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (networkMonitorRef.current) clearInterval(networkMonitorRef.current);
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        if (socketRef.current) {
            socketRef.current.emit("END_CALL", { sessionId });
            socketRef.current.disconnect();
        }
    }, [sessionId]);

    // Initialize WebRTC
    useEffect(() => {
        let mounted = true;

        const loadDocs = async () => {
            try {
                const data = await teleconsultationApi.getDocuments(sessionId);
                if (mounted) setDocuments(data.documents || []);
            } catch(e) { console.error(e) }
        };
        loadDocs();

        const init = async () => {
            try {
                // 1. Get local media stream
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                localStreamRef.current = stream;

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // 2. Connect to signaling server
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
                const serverUrl = apiUrl.replace('/api', '');

                const socket = io(serverUrl, {
                    auth: { token },
                    transports: ['websocket', 'polling']
                });
                socketRef.current = socket;

                socket.on('connect', () => {
                    if (!mounted) return;
                    setConnectionState('connected');
                    console.log('🔌 Connected to signaling server');

                    // Join the video room
                    socket.emit('JOIN_ROOM', { sessionId });
                });

                socket.on('connect_error', (err) => {
                    console.error('Socket connection error:', err.message);
                    setConnectionState('error');
                });

                // 3. Create peer connection
                const pc = new RTCPeerConnection(ICE_SERVERS);
                peerConnectionRef.current = pc;

                // Add local tracks to peer connection
                stream.getTracks().forEach(track => {
                    pc.addTrack(track, stream);
                });

                // Handle incoming remote tracks
                pc.ontrack = (event) => {
                    if (!mounted) return;
                    if (remoteVideoRef.current && event.streams[0]) {
                        remoteVideoRef.current.srcObject = event.streams[0];
                        setRemoteConnected(true);
                    }
                };

                // Send ICE candidates to the other peer
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.emit('ICE_CANDIDATE', {
                            sessionId,
                            candidate: event.candidate
                        });
                    }
                };

                pc.onconnectionstatechange = () => {
                    if (!mounted) return;
                    setConnectionState(pc.connectionState);
                };

                // Start network monitor (F9)
                const monitorNetwork = () => {
                    if (!pc || pc.connectionState !== 'connected') return;
                    pc.getStats().then(stats => {
                        let packetLoss = 0;
                        let rtt = 0;
                        stats.forEach(report => {
                            if (report.type === 'inbound-rtp' && report.kind === 'video') {
                                const packetsLost = report.packetsLost || 0;
                                const packetsReceived = report.packetsReceived || 0;
                                if (packetsReceived > 0) {
                                    packetLoss = (packetsLost / (packetsLost + packetsReceived)) * 100;
                                }
                            }
                            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                                rtt = report.currentRoundTripTime * 1000;
                            }
                        });

                        if (packetLoss > 10 || rtt > 500) {
                            setNetworkQuality('poor');
                        } else if (packetLoss > 2 || rtt > 200) {
                            setNetworkQuality('fair');
                        } else {
                            setNetworkQuality('good');
                        }

                        // Push to history for session averages
                        metricsHistoryRef.current.packetLoss.push(packetLoss);
                        metricsHistoryRef.current.rtt.push(rtt);
                    });
                };
                networkMonitorRef.current = setInterval(monitorNetwork, 2000);

                // ── Socket.IO Signaling Handlers ──────────────────

                // When the other peer joins, create and send an offer
                socket.on('PEER_JOINED', async () => {
                    try {
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        socket.emit('OFFER', { sessionId, sdp: pc.localDescription });
                    } catch (err) {
                        console.error('Error creating offer:', err);
                    }
                });

                // Receive SDP offer from the other peer
                socket.on('OFFER', async ({ sdp }) => {
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        socket.emit('ANSWER', { sessionId, sdp: pc.localDescription });
                    } catch (err) {
                        console.error('Error handling offer:', err);
                    }
                });

                // Receive SDP answer
                socket.on('ANSWER', async ({ sdp }) => {
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                    } catch (err) {
                        console.error('Error handling answer:', err);
                    }
                });

                // Receive ICE candidate
                socket.on('ICE_CANDIDATE', async ({ candidate }) => {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (err) {
                        console.error('Error adding ICE candidate:', err);
                    }
                });

                // Call ended by the other peer
                socket.on('CALL_ENDED', () => {
                    if (!mounted) return;
                    cleanup();
                    if (onCallEnd) onCallEnd();
                });

                // Session started — begin timer
                socket.on('SESSION_STARTED', () => {
                    timerRef.current = setInterval(() => {
                        setCallDuration(prev => prev + 1);
                    }, 1000);
                });

                socket.on('ROOM_JOINED', ({ participants }) => {
                    if (participants >= 2) {
                        timerRef.current = setInterval(() => {
                            setCallDuration(prev => prev + 1);
                        }, 1000);
                    }
                });

                socket.on('ERROR', ({ message }) => {
                    console.error('Signaling error:', message);
                });

                // File Upload Notification (F3)
                socket.on('DOCUMENT_UPLOADED', (doc) => {
                    if (!mounted) return;
                    setDocuments(prev => [doc, ...prev]);
                });

                // Emergency Escalation Notification (F7)
                socket.on('EMERGENCY_ESCALATION', () => {
                    if (!mounted) return;
                    alert('CRITICAL: This session has been escalated as a high-priority emergency!');
                });

            } catch (err) {
                console.error('Failed to initialize video call:', err);
                setConnectionState('error');
            }
        };

        init();

        return () => {
            mounted = false;
            cleanup();
        };
    }, [sessionId, token, cleanup]);

    // Toggle microphone
    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    // Toggle camera
    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    // End the call
    const handleEndCall = async () => {
        try {
            if (user.role === 'DOCTOR') {
                const pLossArr = metricsHistoryRef.current.packetLoss;
                const rttArr = metricsHistoryRef.current.rtt;
                const avgPacketLoss = pLossArr.length ? pLossArr.reduce((a, b) => a + b, 0) / pLossArr.length : 0;
                const avgLatency = rttArr.length ? rttArr.reduce((a, b) => a + b, 0) / rttArr.length : 0;
                
                // Try to glean network type if supported
                const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                const networkType = conn ? (conn.type || conn.effectiveType || 'unknown') : 'unknown';

                const metrics = {
                    averageLatencyMs: avgLatency,
                    packetLossPercentage: avgPacketLoss,
                    networkType,
                    videoEnabled: !isVideoOff,
                    audioEnabled: !isMuted
                };

                await teleconsultationApi.endSession(sessionId, liveNotes, null, metrics);
            }
        } catch (err) {
            console.error('Error ending session:', err);
        }
        cleanup();
        if (onCallEnd) onCallEnd();
    };

    // Toggle fullscreen
    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
        }
    };

    // Listen for fullscreen change (e.g. user presses Esc)
    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // Advanced Telemedicine Functions
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            await teleconsultationApi.uploadDocument(sessionId, file);
        } catch (err) {
            console.error('Upload failed', err);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSaveNotes = async () => {
        try {
            await teleconsultationApi.updateNotes(sessionId, liveNotes);
        } catch (err) { console.error('Save notes failed', err); }
    };

    const handleEscalate = async () => {
        if (!window.confirm('Escalate this to a critical emergency?')) return;
        setEscalating(true);
        try {
            await teleconsultationApi.escalateSession(sessionId);
        } catch (err) {
            console.error('Escalation failed', err);
        } finally {
            setEscalating(false);
        }
    };

    return (
        <div ref={containerRef} className={`flex flex-col bg-slate-950 rounded-2xl overflow-hidden relative ${isFullscreen ? 'h-screen' : 'h-[60vh]'} group`}>
            {/* Connection Status Bar */}
            <div className={`absolute top-4 left-4 z-20 flex items-center gap-3 transition-opacity duration-300 ${!showSidebar ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm ${
                    connectionState === 'connected' 
                        ? (networkQuality === 'poor' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 
                           networkQuality === 'fair' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
                           'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30')
                        : connectionState === 'error' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                    <Wifi className="w-3 h-3" />
                    {connectionState === 'connected' ? `Connected (${networkQuality})` :
                     connectionState === 'error' ? 'Connection Error' : 'Connecting...'}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/60 text-slate-300 text-xs font-mono border border-slate-700/50 backdrop-blur-sm">
                    <Shield className="w-3 h-3 text-teal-400" />
                    E2E Encrypted
                </div>
            </div>

            {/* Timer */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 text-white text-sm font-mono border border-slate-700/50 backdrop-blur-sm">
                <Clock className="w-4 h-4 text-teal-400" />
                {formatTime(callDuration)}
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Video Area Grid */}
                <div className={`flex-1 relative transition-all duration-300 ${showSidebar ? 'mr-0 md:mr-80' : 'mr-0'}`}>
                    {/* Remote Video (Full Screen) */}
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="absolute inset-0 w-full h-full object-contain bg-slate-950"
                    />

                    {/* Waiting overlay when remote peer hasn't connected */}
                    {!remoteConnected && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 z-0">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mb-6 animate-pulse">
                                <Video className="w-10 h-10 text-white" />
                            </div>
                            <p className="text-white text-lg font-bold">Waiting for the other participant...</p>
                            <p className="text-slate-400 text-sm mt-2">The video call will begin when both parties join</p>
                            <div className="mt-6 flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}

                    {/* Local Video (Picture-in-Picture) */}
                    <div className={`absolute transition-all duration-300 ${showSidebar ? 'bottom-4 right-4 w-32 h-24' : 'bottom-4 right-4 w-40 h-28'} rounded-xl overflow-hidden border-2 border-slate-700/50 shadow-2xl z-10`}>
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        {isVideoOff && (
                            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                                <VideoOff className="w-8 h-8 text-slate-500" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar (F11 Profile, F3 Files, F5 Notes) */}
                <div className={`absolute top-0 right-0 h-full w-full md:w-80 bg-slate-900 border-l border-slate-800 transition-transform duration-300 z-20 ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex border-b border-slate-800">
                        {user.role === 'DOCTOR' && (
                            <button onClick={() => setActiveSidebarTab('notes')} className={`flex-1 p-3 text-xs font-bold ${activeSidebarTab === 'notes' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-400'}`}>Clinical Notes</button>
                        )}
                        <button onClick={() => setActiveSidebarTab('files')} className={`flex-1 p-3 text-xs font-bold ${activeSidebarTab === 'files' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-400'}`}>Documents</button>
                        {user.role === 'PATIENT' && (
                            <button onClick={() => setActiveSidebarTab('profile')} className={`flex-1 p-3 text-xs font-bold ${activeSidebarTab === 'profile' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-400'}`}>Doctor Profile</button>
                        )}
                    </div>
                    
                    <div className="p-4 h-[calc(100%-45px)] overflow-y-auto">
                        {activeSidebarTab === 'notes' && user.role === 'DOCTOR' && (
                            <div className="flex flex-col h-full">
                                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-teal-400"/> Live Notes</h3>
                                <p className="text-[10px] text-slate-400 mb-3">These notes drop directly into the AI Summary at the end of the call.</p>
                                <textarea 
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none" 
                                    placeholder="Type clinical findings, symptoms, or thoughts here... (Auto-saves on blur)" 
                                    value={liveNotes} 
                                    onChange={e => setLiveNotes(e.target.value)} 
                                    onBlur={handleSaveNotes} 
                                />
                                <button onClick={handleEscalate} disabled={escalating} className="mt-4 py-3 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg text-sm font-bold hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-2">
                                    <Activity className="w-4 h-4" /> {escalating ? 'Escalating...' : 'Escalate to Emergency Room'}
                                </button>
                            </div>
                        )}
                        
                        {activeSidebarTab === 'files' && (
                            <div>
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
                                    <span className="flex items-center gap-2"><Upload className="w-4 h-4 text-teal-400"/> Session Files</span>
                                    <label className="cursor-pointer text-xs bg-teal-500/10 text-teal-400 border border-teal-500/30 px-3 py-1.5 rounded transition-colors hover:bg-teal-500/20">
                                        Upload File
                                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.png,.jpg,.jpeg" />
                                    </label>
                                </h3>
                                {uploading && (
                                    <div className="text-xs text-teal-400 bg-teal-500/10 p-2 rounded mb-3 animate-pulse text-center border border-teal-500/20">
                                        Uploading document securely...
                                    </div>
                                )}
                                <div className="space-y-2">
                                    {documents.map(doc => (
                                        <div key={doc.documentId} className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex justify-between items-center group">
                                            <div className="overflow-hidden">
                                                <div className="truncate text-xs font-bold text-slate-300 w-36">{doc.filename}</div>
                                                <div className="text-[10px] text-slate-500 uppercase mt-0.5">{doc.uploadedBy} • {new Date(doc.createdAt).toLocaleTimeString()}</div>
                                            </div>
                                            <button onClick={() => teleconsultationApi.downloadDocument(sessionId, doc.documentId, doc.filename)} className="text-teal-400 hover:text-teal-300 text-xs font-bold px-2 py-1 bg-teal-500/10 rounded transition-colors opacity-0 group-hover:opacity-100">
                                                Open
                                            </button>
                                        </div>
                                    ))}
                                    {documents.length === 0 && !uploading && (
                                        <div className="text-xs text-slate-500 text-center py-8 border border-dashed border-slate-800 rounded-lg">
                                            No documents uploaded yet.<br/>Upload lab reports or X-rays here.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeSidebarTab === 'profile' && user.role === 'PATIENT' && (
                            <div>
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><User className="w-4 h-4 text-teal-400"/> Assigned Doctor</h3>
                                {session?.doctor ? (
                                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                                        <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center border-2 border-teal-500/30 mb-3 mx-auto">
                                            <User className="w-8 h-8 text-teal-400" />
                                        </div>
                                        <p className="font-bold text-white text-center text-lg">Dr. {session.doctor.firstName} {session.doctor.lastName}</p>
                                        <p className="text-xs text-teal-400 text-center mb-4 font-bold">{session.doctor.specialty || 'General Practitioner'}</p>
                                        
                                        <div className="space-y-3 pt-3 border-t border-slate-800">
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">License & Verification</p>
                                                <p className="text-xs text-slate-300 flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-400"/> Verified Medical Professional</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Current Role</p>
                                                <p className="text-xs text-amber-400 flex items-center gap-1"><Activity className="w-3 h-3"/> Attending Emergency Request</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 text-center py-8">Doctor details will appear here once assigned.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Call Controls */}
            <div className="flex items-center justify-center gap-4 p-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 z-30">
                <button
                    onClick={toggleMute}
                    className={`p-3.5 rounded-full transition-all duration-200 ${
                        isMuted
                            ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30'
                            : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                    onClick={toggleVideo}
                    className={`p-3.5 rounded-full transition-all duration-200 ${
                        isVideoOff
                            ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30'
                            : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                    }`}
                    title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                >
                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>

                <button
                    onClick={toggleFullscreen}
                    className="p-3.5 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-all duration-200 border border-slate-700"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>

                <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className={`p-3.5 rounded-full transition-all duration-200 ${
                        showSidebar
                            ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 border border-teal-500/30'
                            : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                    }`}
                    title={showSidebar ? 'Hide Sidebar' : 'Show Tools & Info'}
                >
                    <MessageSquare className="w-5 h-5" />
                </button>

                <button
                    onClick={handleEndCall}
                    className="p-3.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-all duration-200 shadow-lg shadow-rose-600/25 border border-rose-500"
                    title="End Call"
                >
                    <PhoneOff className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default VideoRoom;
