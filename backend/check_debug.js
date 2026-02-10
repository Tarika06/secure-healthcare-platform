const fs = require('fs');
function log(msg) {
    try { fs.appendFileSync('debug_log.txt', msg + '\n'); } catch (e) { }
}

log('--- START CHECK ---');

try {
    log('Loading express...');
    require('express');
    log('Loaded express.');
} catch (e) { log('FAIL express: ' + e.message); }

try {
    log('Loading LoggerService...');
    require('./src/services/LoggerService');
    log('Loaded LoggerService.');
} catch (e) { log('FAIL LoggerService: ' + e.message); }

try {
    log('Loading AuditLog model...');
    require('./src/models/AuditLog');
    log('Loaded AuditLog model.');
} catch (e) { log('FAIL AuditLog model: ' + e.message); }

try {
    log('Loading auditService...');
    require('./src/services/auditService');
    log('Loaded auditService.');
} catch (e) { log('FAIL auditService: ' + e.message); }

try {
    log('Loading adminRoutes...');
    require('./src/routes/adminRoutes');
    log('Loaded adminRoutes.');
} catch (e) { log('FAIL adminRoutes: ' + e.message); }

log('--- END CHECK ---');
