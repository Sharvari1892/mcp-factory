const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { z } = require("zod");

const pool = require("../db");

const authMiddleware =
    require("../middleware/auth.middleware");

const validateMiddleware =
    require("../middleware/validate.middleware");

const router = express.Router();

const specSchema = z.object({
    name: z.string().min(1),
    specContent: z.string().min(1)
});

router.post(
    "/",
    authMiddleware,
    validateMiddleware(specSchema),

    async (req, res, next) => {

        try {

            const { name, specContent } = req.body;

            const specId = uuidv4();

            await pool.query(
                `
                INSERT INTO specs (
                    id,
                    user_id,
                    name,
                    spec_content
                )
                VALUES ($1, $2, $3, $4)
                `,
                [
                    specId,
                    req.userId,
                    name,
                    specContent
                ]
            );

            res.status(201).json({
                specId
            });

        }
        catch (err) {

            const serverError = new Error("Internal server error");
            serverError.statusCode = 500;
            return next(serverError);

        }

    }
);

module.exports = router;