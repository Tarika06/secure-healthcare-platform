const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authenticate")
const authorizeByUserId = require("../middleware/authorizebyuserId");

router.get(
    "/dashboard",
    authenticate,
    authorizeByUserId(["A"]),
    (req,res) => {
        req.json({
            message : "User access granted",
            user : req.user
        });
    }
);

module.exports = router;