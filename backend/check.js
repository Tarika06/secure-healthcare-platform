console.log('--- START CHECK ---');
try {
    console.log('Loading express...');
    require('express');
    console.log('Loaded express.');
} catch (e) { console.error('FAIL express:', e); }

try {
    console.log('Loading LoggerService...');
    require('./src/services/LoggerService');
    console.log('Loaded LoggerService.');
} catch (e) { console.error('FAIL LoggerService:', e); }

try {
    console.log('Loading auditService...');
    require('./src/services/auditService');
    console.log('Loaded auditService.');
} catch (e) { console.error('FAIL auditService:', e); }

try {
    console.log('Loading adminRoutes...');
    require('./src/routes/adminRoutes');
    console.log('Loaded adminRoutes.');
} catch (e) { console.error('FAIL adminRoutes:', e); }

console.log('--- END CHECK ---');
