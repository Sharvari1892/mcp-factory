const IORedis = require("ioredis");
const { Queue } = require("bullmq");

const redisConnection = new IORedis(
	process.env.REDIS_URL || "redis://127.0.0.1:6379",
	{
		maxRetriesPerRequest: null
	}
);

const generationQueue = new Queue("generation", {
	connection: redisConnection
});

async function enqueueJob(serverId, specContent, jobId) {
	return generationQueue.add("generate-server", {
		serverId,
		specContent,
    jobId
	});
}

module.exports = {
	enqueueJob,
	generationQueue,
	redisConnection
};
