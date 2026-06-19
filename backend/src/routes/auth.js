const express = require('express');
const { v4: uuidv4 } = require('uuid');

const pool = require('../db');
const {
hashPassword,
    comparePassword,
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken
} = require('../services/auth.service');

const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");

const { z } = require("zod");
const validateMiddleware = require("../middleware/validate.middleware");

const registerSchema = z.object({
    email: z.email(),
    password: z.string().min(6)
});

router.get("/:id", authMiddleware, (req, res) => {
    res.json({
        userId: req.userId,
        message: "Protected route accessed"
    });
});

router.post('/register', validateMiddleware(registerSchema), async (req, res, next) => {

try {

    const { email, password } = req.body;

    const existingUser = await pool.query(
    `
    SELECT id
    FROM users
    WHERE email = $1
    `,
    [email]
    );

    if (existingUser.rows.length > 0) {
        const err = new Error("Email already registered");
        err.statusCode = 409;
        return next(err);
    }

    const passwordHash =
        await hashPassword(password);

    const userId = uuidv4();

    await pool.query(
        `
        INSERT INTO users (
            id,
            email,
            password_hash
        )
        VALUES ($1, $2, $3)
        `,
        [
            userId,
            email,
            passwordHash
        ]
    );

    const accessToken =
        signAccessToken(userId);

    res.status(201).json({
        accessToken
    });

}
catch (err) {

    if (err.code === '23505') {
        const conflictError = new Error('Email already registered');
        conflictError.statusCode = 409;
        return next(conflictError);
    }

    const serverError = new Error('Internal server error');
    serverError.statusCode = 500;
    return next(serverError);

}

});

router.post('/login', async (req, res, next) => {

try {

    const { email, password } = req.body;

    if (!email || !password) {
        const err = new Error('Email and password are required');
        err.statusCode = 400;
        return next(err);
    }

    const result = await pool.query(
        `
        SELECT id, password_hash
        FROM users
        WHERE email = $1
        `,
        [email]
    );

    if (result.rows.length === 0) {
        const err = new Error('Invalid credentials');
        err.statusCode = 401;
        return next(err);
    }

    const user = result.rows[0];

    const isMatch =
        await comparePassword(
            password,
            user.password_hash
        );

    if (!isMatch) {
        const err = new Error('Invalid credentials');
        err.statusCode = 401;
        return next(err);
    }

    const accessToken =
        signAccessToken(user.id);

    const refreshToken =
        signRefreshToken(user.id);

    res.cookie(
        'refreshToken',
        refreshToken,
        {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        }
    );

    res.json({
        accessToken
    });

}
catch (err) {

    const serverError = new Error('Internal server error');
    serverError.statusCode = 500;
    return next(serverError);

}

});


router.post('/refresh', async (req, res, next) => {

try {

    const refreshToken =
        req.cookies.refreshToken;

    if (!refreshToken) {
        const err = new Error('Refresh token missing');
        err.statusCode = 401;
        return next(err);
    }

    const payload =
        verifyRefreshToken(refreshToken);

    if (!payload) {
        const err = new Error('Invalid refresh token');
        err.statusCode = 401;
        return next(err);
    }

    const accessToken =
        signAccessToken(payload.userId);

    res.json({
        accessToken
    });

}
catch (err) {
    const tokenError = new Error('Invalid refresh token');
    tokenError.statusCode = 401;
    return next(tokenError);

}


});



module.exports = router;
