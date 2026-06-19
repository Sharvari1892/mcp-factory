require("dotenv").config();

const { Worker } = require("bullmq");
const yaml = require("js-yaml");

const pool = require("./db");
const { parseOperations } = require("./services/parser");
const {
    generateTool,
    generateServerCode
} = require("./services/generator");

const {
    redisConnection
} = require("./services/queue.service");

const {
    saveGeneratedServerCode
} = require("./services/storage.service");

function parseSpecContent(specContent) {

    if (
        typeof specContent === "object" &&
        specContent !== null
    ) {
        return specContent;
    }

    if (typeof specContent !== "string") {
        throw new Error("Invalid spec content");
    }

    try {
        return JSON.parse(specContent);
    }
    catch {
        return yaml.load(specContent);
    }

}

async function updateJob(jobId, fields) {

    const assignments = [];
    const values = [];

    let index = 1;

    for (const [key, value] of Object.entries(fields)) {

        assignments.push(
            `${key} = $${index}`
        );

        values.push(value);

        index++;

    }

    values.push(jobId);

    await pool.query(
        `
        UPDATE generation_jobs
        SET ${assignments.join(", ")}
        WHERE id = $${index}
        `,
        values
    );

}

async function processGenerationJob(job) {

    const {
        serverId,
        specContent,
        jobId
    } = job.data;

    console.log(
        `Processing job ${job.id} for server ${serverId}`
    );

    try {

        console.log("Updating status → running");

        await updateJob(jobId, {
            status: "running",
            started_at: new Date()
        });

        await updateJob(jobId, {
            status: "done",
            finished_at: new Date(),
            logs: `Generated ${tools.length} tools successfully`
        });

        await updateJob(jobId, {
          status: "failed",
          logs: err.message,
          finished_at: new Date()
      });

        // TEMPORARY delay for testing
        await new Promise(resolve =>
            setTimeout(resolve, 5000)
        );

        console.log("Parsing OpenAPI spec");

        const spec =
            parseSpecContent(specContent);

        console.log("Extracting operations");

        const operations =
            parseOperations(spec);

        console.log(
            `Found ${operations.length} operations`
        );

        console.log("Generating tools");

        const tools =
            operations.map(generateTool);

        console.log("Generating server code");

        const generatedCode =
            generateServerCode(tools);

        console.log("Saving generated code");

        await saveGeneratedServerCode(
            serverId,
            generatedCode
        );

        console.log("Updating status → done");

        await updateJob(serverId, {
            status: "done",
            finished_at: new Date(),
            logs:
                `Generated ${tools.length} tools successfully`
        });

        console.log(
            `Job ${job.id} completed successfully`
        );

        return {
            serverId,
            toolsGenerated: tools.length
        };

    }
    catch (err) {

        console.error(
            `Job ${job.id} failed`
        );

        console.error(err);

        await updateJob(serverId, {
            status: "failed",
            logs: err.message,
            finished_at: new Date()
        });

        throw err;

    }

}

console.log("Starting generation worker...");

const worker = new Worker(
    "generation",
    processGenerationJob,
    {
        connection: redisConnection
    }
);

worker.on("active", job => {

    console.log(
        `Job ${job.id} is active`
    );

});

worker.on("completed", job => {

    console.log(
        `Job ${job.id} completed`
    );

});

worker.on("failed", (job, err) => {

    console.error(
        `Job ${job?.id} failed`
    );

    console.error(err);

});

worker.on("error", err => {

    console.error(
        "Worker error:"
    );

    console.error(err);

});

console.log(
    "Worker started and waiting for jobs..."
);

process.on("SIGINT", async () => {

    console.log(
        "Shutting down worker..."
    );

    await worker.close();

    await redisConnection.quit();

    process.exit(0);

});

process.on("SIGTERM", async () => {

    console.log(
        "Shutting down worker..."
    );

    await worker.close();

    await redisConnection.quit();

    process.exit(0);

});