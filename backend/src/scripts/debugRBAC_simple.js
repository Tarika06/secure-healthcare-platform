const express = require('express');
const jwt = require('jsonwebtoken');
const http = require('http');

const app = express();
const PORT = 3001;
process.env.JWT_SECRET = "test_secret";

// AUTH MIDDLEWARE REPRODUCTION
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: "No Header" });
        const token = authHeader.split(" ")[1];
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Authenticated:", req.user);
        next();
    } catch (e) {
        console.log("❌ Auth Failed:", e.message);
        res.status(401).json({ message: "Invalid Token" });
    }
};

// AUTHORIZE MIDDLEWARE REPRODUCTION
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        console.log(`🔎 Checking Permission: UserRole=${req.user.role} Allowed=${JSON.stringify(allowedRoles)}`);

        // CRITICAL CHECK
        if (!allowedRoles.includes(req.user.role)) {
            console.log("⛔ ACCESS DENIED");
            return res.status(403).json({ message: "Forbidden" });
        }

        console.log("🔓 ACCESS GRANTED");
        next();
    };
};

app.get('/admin/test', authenticate, authorize(["ADMIN"]), (req, res) => {
    res.json({ message: "Welcome Admin" });
});

const server = app.listen(PORT, async () => {
    console.log(`Test Server running on ${PORT}`);

    const makeRequest = (role, userId) => {
        return new Promise((resolve) => {
            const token = jwt.sign({ userId, role }, process.env.JWT_SECRET);
            const options = {
                hostname: 'localhost',
                port: PORT,
                path: '/admin/test',
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    console.log(`\n--- TEST: Role=${role} ---`);
                    console.log(`Status: ${res.statusCode}`);
                    console.log(`Body: ${data}`);
                    resolve();
                });
            });
            req.end();
        });
    };

    await makeRequest('DOCTOR', 'doc1');
    await makeRequest('ADMIN', 'admin1');

    server.close();
    process.exit(0);
});
