const fs = require('fs');

console.log('--- START CHECK ---');
fs.appendFileSync('debug_final.txt', 'START\n');

try {
    console.log('Loading express...');
    require('express');
    console.log('Loaded express.');
    fs.appendFileSync('debug_final.txt', 'Express OK\n');
} catch (e) {
    console.error('FAIL express:', e);
    fs.appendFileSync('debug_final.txt', 'FAIL express: ' + e.message + '\n');
}

// ... other checks ...
try {
    console.log('Loading LoggerService...');
    require('./src/services/LoggerService');
    console.log('Loaded LoggerService.');
    fs.appendFileSync('debug_final.txt', 'LoggerService OK\n');
} catch (e) {
    console.error('FAIL LoggerService:', e);
    fs.appendFileSync('debug_final.txt', 'FAIL LoggerService: ' + e.message + '\n');
}

try {
    console.log('Loading AuditLog...');
    require('./src/models/AuditLog');
    console.log('Loaded AuditLog.');
    fs.appendFileSync('debug_final.txt', 'AuditLog OK\n');
} catch (e) {
    console.error('FAIL AuditLog:', e);
    fs.appendFileSync('debug_final.txt', 'FAIL AuditLog: ' + e.message + '\n');
}

console.log('--- END CHECK ---');
fs.appendFileSync('debug_final.txt', 'END\n');
