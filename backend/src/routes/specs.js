const express = require("express");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");

const pool = require("../db");
const authMiddleware = require("../middleware/auth.middleware");
const { uploadFile } = require("../services/storage.service");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
    "/",
    authMiddleware,
    upload.single("spec"),

    async (req, res, next) => {
        try {
            if (!req.file) {
                const err = new Error("Validation failed: spec file is required");
                err.statusCode = 400;
                return next(err);
            }

            const { name } = req.body;
            if (!name || typeof name !== "string" || name.trim() === "") {
                const err = new Error("Validation failed: name is required");
                err.statusCode = 400;
                return next(err);
            }

            const specId = uuidv4();
            const storageKey = `${req.userId}/${specId}.yaml`;
            const specContent = req.file.buffer.toString("utf8");

            // Upload spec file buffer to MinIO bucket specs
            await uploadFile("specs", storageKey, req.file.buffer, "application/x-yaml");

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
                specId,
                storageKey
            });

        }
        catch (err) {
            const serverError = new Error(err.message || "Internal server error");
            serverError.statusCode = err.statusCode || 500;
            return next(serverError);
        }
    }
);

module.exports = router;