const jwt = require("jsonwebtoken");

/**
 * Authenticate a request using the JWT issued by signup/login.
 * The user id is deliberately kept as a string so it can be used by both
 * mongoose and the native MongoDB driver used by the user controller.
 */
function authMiddleware(req, res, next) {
    const header = req.get("authorization") || "";
    const [scheme, token] = header.split(" ");
    const secret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ error: "Authentication required." });
    }
    if (!secret) {
        return res.status(500).json({ error: "Authentication is not configured." });
    }

    try {
        const payload = jwt.verify(token, secret);
        if (!payload || !payload.id) {
            return res.status(401).json({ error: "Invalid authentication token." });
        }
        req.user = { id: String(payload.id) };
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired authentication token." });
    }
}

module.exports = authMiddleware;
module.exports.authenticate = authMiddleware;
module.exports.authenticateToken = authMiddleware;
module.exports.authMiddleware = authMiddleware;