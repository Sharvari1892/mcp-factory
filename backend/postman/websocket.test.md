# WebSocket Log Streaming End-to-End Test Guide

This document describes how to manually test and verify the real-time WebSocket generation log streaming functionality using `wscat`.

## Prerequisites

Install `wscat` globally on your machine:
```bash
npm install -g wscat
```

---

## E2E Testing Steps

### 1. Start Services & Server
Ensure that Redis and the database are running, and start the development server:
```bash
npm run dev
```

### 2. Connect via WebSockets
Open a terminal and connect to the WebSocket server using `wscat`:
```bash
wscat -c ws://localhost:3000
```
Upon a successful connection, the client will wait in idle state.

### 3. Send Subscribe Message
Send the subscription JSON payload containing the `jobId` of the generation job you want to listen to. Replace `YOUR_JOB_ID_HERE` with the actual job ID:
```json
{ "type": "subscribe", "jobId": "YOUR_JOB_ID_HERE" }
```
You should receive a confirmation payload back instantly:
```json
{"type":"subscribed","jobId":"YOUR_JOB_ID_HERE"}
```

### 4. Trigger Server Code Generation
In a separate terminal (or via Postman), trigger a code generation job by sending a POST request to `http://localhost:3000/servers/generate` (include the spec ID and desired server name in the request body):
```json
POST /servers/generate
{
  "specId": "YOUR_SPEC_ID",
  "serverName": "MyNewServer"
}
```
This returns a JSON response containing the newly created `jobId` (which you can use in Step 3).

### 5. Watch Logs Stream in Real-Time
Observe your `wscat` terminal. As the generation worker progresses through each stage, you will see log statements arriving in real-time.

---

## Expected Output Format

Each log line output will match the following structure:
```json
{
  "type": "log",
  "jobId": "YOUR_JOB_ID_HERE",
  "message": "Job started",
  "timestamp": "2026-06-19T12:00:00.000Z"
}
```

The sequential log messages streamed during a successful execution will include:
1. `Job started`
2. `Spec parsed successfully`
3. `Found {count} operations`
4. `Generated {count} tool definitions`
5. `Server code generated`
6. `Code uploaded to storage`
7. `Job complete`

If a job fails, the terminal will receive:
* `Job failed: {error message}`
