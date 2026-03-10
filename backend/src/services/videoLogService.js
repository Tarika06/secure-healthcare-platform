const VideoConsultationLog = require("../models/VideoConsultationLog");
const { logAuditEvent } = require("./auditService");

/**
 * Service to manage video consultation logs securely for the Admin Dashboard.
 */

// Private helper to find or create a log session
const getOrCreateLog = async (sessionId, patientId, type, requestTimestamp) => {
    let log = await VideoConsultationLog.findOne({ sessionId });
    if (!log && patientId) {
        log = new VideoConsultationLog({
            sessionId,
            patientId,
            consultationType: type || "EMERGENCY",
            requestTimestamp: requestTimestamp || new Date()
        });
        await log.save();
    }
    return log;
};

const videoLogService = {
    
    // Lifecycle: Consultation Requested
    logRequestParams: async (sessionId, patientId, type) => {
        try {
            await getOrCreateLog(sessionId, patientId, type, new Date());
        } catch (err) { console.error("VideoLogService - request error:", err); }
    },

    // Lifecycle: Doctor Assigned
    logDoctorAssigned: async (sessionId, doctorId) => {
        try {
            const log = await VideoConsultationLog.findOne({ sessionId });
            if (!log) return;
            log.doctorId = doctorId;
            log.doctorAssignedTimestamp = new Date();
            if (log.requestTimestamp) {
                log.waitingTimeSeconds = Math.floor((log.doctorAssignedTimestamp - log.requestTimestamp) / 1000);
            }
            log.systemEvents.push({ eventType: "DOCTOR_ASSIGNED" });
            await log.save();
        } catch (err) { console.error("VideoLogService - assign error:", err); }
    },

    // Lifecycle: Call Started
    logCallStarted: async (sessionId) => {
        try {
            const log = await VideoConsultationLog.findOne({ sessionId });
            if (!log) return;
            
            // Only set start time if it isn't set yet
            if (!log.callStartTimestamp) {
                log.callStartTimestamp = new Date();
                log.systemEvents.push({ eventType: "CALL_STARTED" });
            }
            await log.save();
        } catch (err) { console.error("VideoLogService - start error:", err); }
    },

    // Events: Peers joining/dropping
    logSystemEvent: async (sessionId, eventType, details = {}) => {
        try {
            const log = await VideoConsultationLog.findOne({ sessionId });
            if (!log) return;
            log.systemEvents.push({ eventType, details });
            if (eventType === "ICE_EXCHANGE_SUCCESS") {
                log.iceExchangeSuccess = true;
                log.connectionEstablished = true;
            }
            await log.save();
        } catch (err) { console.error("VideoLogService - event error:", err); }
    },

    // Activity: Files, Notes, Escalation
    incrementMetric: async (sessionId, metricName, value = 1) => {
        try {
            const log = await VideoConsultationLog.findOne({ sessionId });
            if (!log) return;
            
            if (typeof log[metricName] === 'boolean') {
                log[metricName] = true;
            } else if (typeof log[metricName] === 'number') {
                log[metricName] += value;
            }
            await log.save();
        } catch (err) { console.error("VideoLogService - increment error:", err); }
    },
    
    // Lifecycle: Call Ended + Metrics Upload
    finalizeSession: async (sessionId, terminatorRole, metrics = {}) => {
        try {
            const log = await VideoConsultationLog.findOne({ sessionId });
            if (!log) return;

            log.callEndTimestamp = new Date();
            log.callTerminatedBy = terminatorRole && ["DOCTOR", "PATIENT", "SYSTEM"].includes(terminatorRole.toUpperCase()) 
                                    ? terminatorRole.toUpperCase() 
                                    : "UNKNOWN";

            if (log.callStartTimestamp) {
                log.totalCallDurationSeconds = Math.floor((log.callEndTimestamp - log.callStartTimestamp) / 1000);
            } else if (log.requestTimestamp) {
                 // The call never formally started (failed to connect)
                 log.systemEvents.push({ eventType: "CALL_ENDED_WITHOUT_START" });
            }

            // Sync metrics uploaded by the frontend
            if (metrics.averageLatencyMs !== undefined) log.averageLatencyMs = metrics.averageLatencyMs;
            if (metrics.packetLossPercentage !== undefined) log.packetLossPercentage = metrics.packetLossPercentage;
            if (metrics.averageBitrateKbps !== undefined) log.averageBitrateKbps = metrics.averageBitrateKbps;
            if (metrics.networkType !== undefined) log.networkType = metrics.networkType;
            if (metrics.videoEnabled !== undefined) log.videoEnabled = metrics.videoEnabled;
            if (metrics.audioEnabled !== undefined) log.audioEnabled = metrics.audioEnabled;

            // Calculate overall quality rating based on metrics
            if (log.connectionEstablished) {
                if (log.packetLossPercentage > 10 || log.averageLatencyMs > 500) {
                    log.connectionQualityRating = "poor";
                    log.audioOnlyFallbackUsed = true; // High likelihood of fallback
                } else if (log.packetLossPercentage > 2 || log.averageLatencyMs > 200) {
                    log.connectionQualityRating = "fair";
                } else {
                    log.connectionQualityRating = "excellent";
                }
            }

            log.systemEvents.push({ eventType: "CALL_ENDED" });
            await log.save();

            // Fire to the global audit log securely for compliance
            await logAuditEvent({
                userId: "SYSTEM",
                action: "VIDEO_CONSULTATION_LOG_FINALIZED",
                resource: "VideoConsultationLog",
                resourceId: sessionId,
                outcome: "SUCCESS",
                complianceCategory: "INTERNAL"
            });

        } catch (err) { console.error("VideoLogService - finalize error:", err); }
    }
};

module.exports = videoLogService;
