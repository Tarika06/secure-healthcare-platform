/**
 * AI Service for Security Log Analysis
 * 
 * Integrates with Google Gemini API to identify anomalies and suspicious patterns
 * in audit logs.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize Gemini API
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

/**
 * Analyze a batch of audit logs for suspicious patterns
 * @param {Array} logs - Array of audit log objects
 * @returns {Promise<Array>} - Array of identified security alerts
 */
const analyzeLogs = async (logs) => {
    if (!logs || logs.length === 0) return [];

    try {
        if (!genAI) {
            console.log("AI Service: GEMINI_API_KEY missing, using heuristic/mock analysis.");
            return runHeuristicAnalysis(logs);
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        Analyze the following system audit logs for security threats, anomalies, or suspicious behavior.
        Look for:
        1. Brute force attempts (many failed logins from same IP).
        2. Unauthorized access attempts (repeated ACCESS_DENIED).
        3. Anomalous data access (large number of records viewed by one user).
        4. Unusual timestamps (access during non-working hours).
        5. Suspicious sequences (login followed immediately by sensitive data export).

        Logs:
        ${JSON.stringify(logs.map(l => ({
            userId: l.userId,
            action: l.action,
            outcome: l.outcome,
            resource: l.resource,
            ip: l.ipAddress,
            timestamp: l.timestamp,
            details: l.details
        })))}

        Return your analysis as a JSON array of objects with the following structure:
        [{
            "type": "SUSPICIOUS_LOGIN" | "BRUTE_FORCE" | "DATA_EXFILTRATION" | "UNAUTHORIZED_ACCESS" | "ANOMALY",
            "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
            "description": "Short explanation",
            "relatedLogIds": ["id1", "id2"],
            "recommendation": "What should the admin do?"
        }]
        If no threats are found, return an empty array [].
        Return ONLY valid JSON.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response (sometimes Gemini wraps in code blocks)
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return [];
    } catch (error) {
        console.error("AI Analysis Error:", error);
        return runHeuristicAnalysis(logs);
    }
};

/**
 * Fallback heuristic analysis if AI is unavailable
 */
const runHeuristicAnalysis = (logs) => {
    const alerts = [];

    // 1. Group by IP for brute force detection
    const ipFailures = {};
    logs.forEach(log => {
        if (log.action === "LOGIN_FAILURE") {
            ipFailures[log.ipAddress] = (ipFailures[log.ipAddress] || 0) + 1;
        }
    });

    for (const [ip, count] of Object.entries(ipFailures)) {
        if (count >= 5) {
            alerts.push({
                type: "BRUTE_FORCE",
                severity: "HIGH",
                description: `Possible brute force attack from IP ${ip} (${count} failed attempts)`,
                recommendation: "Review firewall rules and block this IP if necessary."
            });
        }
    }

    // 2. Detection of repeated access denial
    const userDenials = {};
    logs.forEach(log => {
        if (log.outcome === "DENIED") {
            userDenials[log.userId] = (userDenials[log.userId] || 0) + 1;
        }
    });

    for (const [userId, count] of Object.entries(userDenials)) {
        if (count >= 3) {
            alerts.push({
                type: "UNAUTHORIZED_ACCESS",
                severity: "MEDIUM",
                description: `Frequent access denials for user ${userId} (${count} attempts)`,
                recommendation: "Verify user permissions and check for compromised account."
            });
        }
    }

    return alerts;
};

module.exports = { analyzeLogs };
