const { v4: uuidv4 } = require("uuid");
const { z } = require("zod");

const validateMiddleware =
    require("../middleware/validate.middleware");

const express = require("express");

const pool = require("../db");
const { enqueueJob } = require("../services/queue.service");
const { getPresignedUrl } = require("../services/storage.service");

const generateSchema = z.object({
    specId: z.uuid(),
    serverName: z.string().min(1)
});

const authMiddleware =
    require("../middleware/auth.middleware");

const router = express.Router();

router.get(
    "/",
    authMiddleware,

    async (req, res, next) => {

        try {

            const result = await pool.query(
                `
                SELECT
                    id,
                    name,
                    status,
                    created_at
                FROM mcp_servers
                WHERE user_id = $1
                ORDER BY created_at DESC
                `,
                [req.userId]
            );

            res.json(result.rows);

        }
        catch (err) {

            const serverError = new Error("Internal server error");
            serverError.statusCode = 500;
            return next(serverError);

        }

    }
);

router.get(
    "/:id",
    authMiddleware,

    async (req, res, next) => {

        try {

            const result = await pool.query(
                `
                SELECT
                    id,
                    name,
                    status,
                    created_at
                FROM mcp_servers
                WHERE id = $1
                AND user_id = $2
                `,
                [
                    req.params.id,
                    req.userId
                ]
            );

            if (result.rows.length === 0) {

                const notFoundError = new Error("Server not found");
                notFoundError.statusCode = 404;
                return next(notFoundError);

            }

            res.json(result.rows[0]);

        }
        catch (err) {

            const serverError = new Error("Internal server error");
            serverError.statusCode = 500;
            return next(serverError);

        }

    }
);

router.get(
    "/:id/download",
    authMiddleware,

    async (req, res, next) => {
        try {
            const result = await pool.query(
                `
                SELECT storage_key
                FROM mcp_servers
                WHERE id = $1
                AND user_id = $2
                `,
                [req.params.id, req.userId]
            );

            if (result.rows.length === 0) {
                const notFoundError = new Error("Server not found");
                notFoundError.statusCode = 404;
                return next(notFoundError);
            }

            const server = result.rows[0];
            if (!server.storage_key) {
                return res.status(400).json({
                    error: "Server has not been generated yet"
                });
            }

            const downloadUrl = await getPresignedUrl("servers", server.storage_key);

            res.json({
                downloadUrl,
                message: "This link is valid for 15 minutes."
            });
        } catch (err) {
            console.error("[download] Error generating presigned URL:", err.message);
            const serverError = new Error("Internal server error");
            serverError.statusCode = 500;
            return next(serverError);
        }
    }
);

router.post(
    "/generate",
    authMiddleware,
    validateMiddleware(generateSchema),

    async (req, res, next) => {

        try {

            const {
                specId,
                serverName
            } = req.body;

            // Verify spec belongs to user
            const specResult = await pool.query(
                `
                SELECT spec_content
                FROM specs
                WHERE id = $1
                AND user_id = $2
                `,
                [
                    specId,
                    req.userId
                ]
            );

            if (specResult.rows.length === 0) {

                const notFoundError = new Error("Spec not found");
                notFoundError.statusCode = 404;
                return next(notFoundError);

            }

            const { spec_content: specContent } = specResult.rows[0];

            const serverId = uuidv4();
            const jobId = uuidv4();

            // Create server
            await pool.query(
                `
                INSERT INTO mcp_servers (
                    id,
                    user_id,
                    name,
                    status
                )
                VALUES ($1, $2, $3, $4)
                `,
                [
                    serverId,
                    req.userId,
                    serverName,
                    "pending"
                ]
            );

            // Create generation job
            await pool.query(
                `
                INSERT INTO generation_jobs (
                    id,
                    server_id,
                    status
                )
                VALUES ($1, $2, $3)
                `,
                [
                    jobId,
                    serverId,
                    "pending"
                ]
            );

            await enqueueJob(serverId, specContent, jobId);

            res.status(201).json({
                serverId,
                jobId
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