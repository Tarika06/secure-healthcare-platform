const express = require('express');
console.log('typeof express:', typeof express);
try {
    const app = express();
    console.log('app created');
} catch (e) {
    console.error('Error creating app:', e);
}
