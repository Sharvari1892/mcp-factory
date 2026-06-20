require("dotenv").config();

const http = require('http');
const { WebSocketServer } = require('ws');

console.log(process.env.JWT_SECRET);
console.log(process.env.JWT_REFRESH_SECRET);

const express = require('express');
const { parseOperations } = require('./src/services/parser');

const cookieParser = require('cookie-parser');

const app = express();

const authRoutes =
    require('./src/routes/auth');

const specRoutes =
    require("./src/routes/specs");

const serverRoutes =
    require("./src/routes/servers");

const jobsRoutes =
  require("./src/routes/jobs");

const errorMiddleware =
  require("./src/middleware/error.middleware");
const rateLimitMiddleware =
  require("./src/middleware/rateLimit.middleware");

app.use(express.json());//this middleware converts incoming JSON into request body

app.use(rateLimitMiddleware);

app.use(cookieParser());

app.use("/specs", specRoutes);

app.use("/servers", serverRoutes);

app.use("/jobs", jobsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: "ok" });
});

app.post('/health', (req, res) => {
  res.json({ status: "ok" });
});

app.post('/parse', (req, res) => {
  const spec = req.body;
  const operations = parseOperations(spec);
  res.json(operations);
});

app.use('/auth', authRoutes);

app.use(errorMiddleware);

const httpServer = http.createServer(app);

// Attach WebSocket server to the HTTP server
const wss = new WebSocketServer({ server: httpServer });

// Listen for incoming WebSocket connections
wss.on('connection', (ws) => {
  // Listen for the first message from the client to perform subscription
  ws.once('message', async (data) => {
    let message;
    try {
      // Parse the incoming message as JSON
      message = JSON.parse(data);
    } catch (e) {
      // If parsing fails, send error and close connection to protect the server
      ws.send(JSON.stringify({ error: "Expected { type: 'subscribe', jobId: '...' }" }));
      ws.close();
      return;
    }

    // Verify the message has type 'subscribe' and jobId exists
    if (!message || message.type !== "subscribe" || !message.jobId) {
      // Send error and close connection if validation fails
      ws.send(JSON.stringify({ error: "Expected { type: 'subscribe', jobId: '...' }" }));
      ws.close();
      return;
    }

    const { jobId } = message;

    // Create a new dedicated ioredis subscriber connection by duplicating the existing one
    // to prevent blocking the main connection with subscription state.
    const { redisConnection } = require('./src/services/queue.service');
    const subscriber = redisConnection.duplicate();

    try {
      // Listen for message events on the Redis subscriber
      subscriber.on('message', (channel, msg) => {
        // Forward the message to the client if the socket is in OPEN state
        if (ws.readyState === ws.OPEN) {
          ws.send(msg);
        }
      });

      // Subscribe to the job-specific channel BEFORE replaying buffered logs
      // so we don't miss any messages published between the replay and subscribe
      await subscriber.subscribe(`job:${jobId}`);

      // Send subscription confirmation first
      ws.send(JSON.stringify({ type: "subscribed", jobId }));

      // Replay any logs that were published before this client connected.
      // The worker buffers every log into a Redis list (job:logs:{jobId}) with a 5-min TTL.
      // This eliminates the race condition where the job finishes before the WS subscription.
      const bufferedLogs = await redisConnection.lrange(`job:logs:${jobId}`, 0, -1);
      for (const log of bufferedLogs) {
        if (ws.readyState === ws.OPEN) {
          ws.send(log);
        }
      }
    } catch (err) {
      console.error(`Failed to subscribe to Redis channel job:${jobId}:`, err);
      ws.send(JSON.stringify({ error: "Failed to subscribe to log stream" }));
      ws.close();
      // Ensure Redis connection is cleaned up on subscription failure
      subscriber.quit().catch(qErr => console.error("Error quitting subscriber:", qErr));
      return;
    }

    // Register cleanup on socket close
    ws.on('close', async () => {
      try {
        // Unsubscribe from the Redis channel to stop receiving messages
        await subscriber.unsubscribe();
      } catch (err) {
        console.error("Error during Redis unsubscribe on close:", err);
      }
      try {
        // Quit/close the Redis connection to prevent memory/connection leaks
        await subscriber.quit();
      } catch (err) {
        console.error("Error quitting Redis subscriber on close:", err);
      }
    });

    // Register cleanup on socket error
    ws.on('error', (err) => {
      console.error(`WebSocket client error for jobId ${jobId}:`, err);
      // Immediately quit the Redis connection to prevent connection leaks
      subscriber.quit().catch(qErr => console.error("Error quitting Redis subscriber on error:", qErr));
    });
  });
});

httpServer.listen(3000, () => {
  console.log("Server running on port 3000");
});