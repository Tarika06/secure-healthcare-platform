const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// mock process.env
process.env.JWT_SECRET = "test_secret";

// Mock middleware
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No Auth Header" });
    const token = authHeader.split(" ")[1];
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        console.log("DEBUG: Authenticated User:", req.user); // Debug log
        next();
    } catch (e) {
        res.status(401).json({ message: "Invalid Token" });
    }
};

const authorize = (allowedRoles) => {
    return (req, res, next) => {
        console.log("DEBUG: Checking Role:", req.user.role, "against Allowed:", allowedRoles); // Debug log
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    };
};

// Route
app.get('/admin/test', authenticate, authorize(["ADMIN"]), (req, res) => {
    res.json({ message: "Admin Access Granted" });
});

// Test
const runTest = async () => {
    console.log("--- TEST 1: Doctor Accessing Admin Route ---");
    const docToken = jwt.sign({ userId: 'doc1', role: 'DOCTOR' }, process.env.JWT_SECRET);

    await request(app)
        .get('/admin/test')
        .set('Authorization', `Bearer ${docToken}`)
        .expect(403)
        .then(res => console.log("Result:", res.status, res.body));

    console.log("\n--- TEST 2: Admin Accessing Admin Route ---");
    const adminToken = jwt.sign({ userId: 'admin1', role: 'ADMIN' }, process.env.JWT_SECRET);

    await request(app)
        .get('/admin/test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .then(res => console.log("Result:", res.status, res.body));
};

runTest();
