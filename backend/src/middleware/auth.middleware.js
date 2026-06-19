const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Check if header exists
        if (!authHeader) {
            const err = new Error("Authorization header missing");
            err.statusCode = 401;
            return next(err);
        }

        // Expect "Bearer <token>"
        const token = authHeader.split(" ")[1];

        if (!token) {
            const err = new Error("Token missing");
            err.statusCode = 401;
            return next(err);
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Attach user ID to request
        req.userId = decoded.userId;

        next();

    } catch (error) {
        const err = new Error("Invalid or expired token");
        err.statusCode = 401;
        return next(err);
    }
};

module.exports = authMiddleware;