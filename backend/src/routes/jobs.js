const express = require("express");

const pool = require("../db");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/:id", authMiddleware, async (req, res, next) => {
    try {
        const result = await pool.query(
            `
            SELECT
                gj.id,
                gj.status,
                gj.logs,
                gj.started_at,
                gj.finished_at
            FROM generation_jobs gj
            JOIN mcp_servers ms
                ON ms.id = gj.server_id
            WHERE gj.id = $1
            AND ms.user_id = $2
            `,
            [req.params.id, req.userId]
        );

        if (result.rows.length === 0) {
            const notFoundError = new Error("Job not found");
            notFoundError.statusCode = 404;
            return next(notFoundError);
        }

        return res.json(result.rows[0]);
    } catch (err) {
        const serverError = new Error("Internal server error");
        serverError.statusCode = 500;
        return next(serverError);
    }
});

module.exports = router;