try {
    require('./src/services/auditService');
    console.log("Successfully required auditService");
} catch (e) {
    console.error("Failed to require auditService:", e);
}
