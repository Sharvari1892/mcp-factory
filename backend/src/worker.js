require("dotenv").config();

const { Worker } = require("bullmq");
const yaml = require("js-yaml");

const pool = require("./db");
const { parseOperations } = require("./services/parser");
const { generateTool, generateServerCode } = require("./services/generator");
const { redisConnection } = require("./services/queue.service");
const { saveGeneratedServerCode } = require("./services/storage.service");

// Create a dedicated Redis publisher connection for streaming log events
const publisher = redisConnection.duplicate();

/**
 * Publishes a log message to the job's Redis pub/sub channel AND appends it
 * to a Redis list so late-joining WebSocket subscribers can replay missed logs.
 * @param {string} jobId
 * @param {string} message
 */
async function publishLog(jobId, message) {
    const payload = JSON.stringify({
        type: "log",
        jobId,
        message,
        timestamp: new Date().toISOString()
    });

    // Publish for any currently-connected subscribers
    await publisher.publish(`job:${jobId}`, payload);

    // Also buffer into a list so subscribers who join after the fact can replay
    const listKey = `job:logs:${jobId}`;
    await publisher.rpush(listKey, payload);
    // Keep the buffer alive for 5 minutes then auto-expire
    await publisher.expire(listKey, 300);
}

function parseSpecContent(specContent) {
    if (typeof specContent === "object" && specContent !== null) {
        return specContent;
    }
    if (typeof specContent !== "string") {
        throw new Error("Invalid spec content");
    }
    try {
        return JSON.parse(specContent);
    } catch {
        return yaml.load(specContent);
    }
}

async function updateJob(jobId, fields) {
    const assignments = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(fields)) {
        assignments.push(`${key} = $${index}`);
        values.push(value);
        index++;
    }

    values.push(jobId);

    await pool.query(
        `UPDATE generation_jobs SET ${assignments.join(", ")} WHERE id = $${index}`,
        values
    );
}

async function processGenerationJob(job) {
    const { serverId, specContent, jobId } = job.data;

    console.log(`Processing job ${job.id} for server ${serverId}`);

    try {
        // ✅ Step 1 — mark as running
        await updateJob(jobId, {
            status: "running",
            started_at: new Date()
        });
        try {
            await publishLog(jobId, "Job started");
        } catch (pErr) {
            console.error("Failed to publish log:", pErr);
        }

        // ✅ Step 2 — do the actual work
        console.log("Parsing OpenAPI spec");
        const spec = parseSpecContent(specContent);
        try {
            await publishLog(jobId, "Spec parsed successfully");
        } catch (pErr) {
            console.error("Failed to publish log:", pErr);
        }

        console.log("Extracting operations");
        const operations = parseOperations(spec);
        console.log(`Found ${operations.length} operations`);
        try {
            await publishLog(jobId, `Found ${operations.length} operations`);
        } catch (pErr) {
            console.error("Failed to publish log:", pErr);
        }

        console.log("Generating tools");
        const tools = operations.map(generateTool);
        try {
            await publishLog(jobId, `Generated ${tools.length} tool definitions`);
        } catch (pErr) {
            console.error("Failed to publish log:", pErr);
        }

        console.log("Generating server code");
        const generatedCode = generateServerCode(tools);
        try {
            await publishLog(jobId, "Server code generated");
        } catch (pErr) {
            console.error("Failed to publish log:", pErr);
        }

        console.log("Saving generated code");
        const storageKey = await saveGeneratedServerCode(serverId, generatedCode);
        try {
            await publishLog(jobId, "Code uploaded to storage");
        } catch (pErr) {
            console.error("Failed to publish log:", pErr);
        }

        await pool.query(
            "UPDATE mcp_servers SET storage_key = $1, status = 'done' WHERE id = $2",
            [storageKey, serverId]
        );

        // ✅ Step 3 — mark as done (jobId not serverId)
        await updateJob(jobId, {
            status: "done",
            finished_at: new Date(),
            logs: `Generated ${tools.length} tools successfully`
        });
        try {
            await publishLog(jobId, "Job complete");
        } catch (pErr) {
            console.error("Failed to publish log:", pErr);
        }

        console.log(`Job ${job.id} completed successfully`);
        return { serverId, toolsGenerated: tools.length };

    } catch (err) {
        console.error(`Job ${job.id} failed:`, err);
        try {
            await publishLog(jobId, `Job failed: ${err.message}`);
        } catch (pErr) {
            console.error("Failed to publish log:", pErr);
        }

        // ✅ Step 4 — mark as failed (jobId not serverId)
        await updateJob(jobId, {
            status: "failed",
            logs: err.message,
            finished_at: new Date()
        });

        throw err; // ✅ rethrow so BullMQ knows the job failed and can retry
    }
}

const worker = new Worker("generation", processGenerationJob, {
    connection: redisConnection
});

worker.on("active", job => console.log(`Job ${job.id} is active`));
worker.on("completed", job => console.log(`Job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`Job ${job?.id} failed:`, err));
worker.on("error", err => console.error("Worker error:", err));

console.log("Worker started and waiting for jobs...");

async function shutdown() {
    console.log("Shutting down worker...");
    try {
        // Quit/close the dedicated Redis publisher connection to prevent memory leaks
        await publisher.quit();
    } catch (err) {
        console.error("Error quitting Redis publisher on shutdown:", err);
    }
    await worker.close();
    await redisConnection.quit();
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);