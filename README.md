# MCP Factory

**MCP Factory** is a full-stack web application that converts any OpenAPI/Swagger specification into a ready-to-run [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server — automatically. Upload your spec, click generate, and download a fully scaffolded TypeScript MCP server that exposes every API operation as an MCP tool.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Option A — Docker Compose (Recommended)](#option-a--docker-compose-recommended)
  - [Option B — Manual Setup](#option-b--manual-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [How Generation Works](#how-generation-works)
- [Running Tests](#running-tests)
- [Scripts Reference](#scripts-reference)

---

## Overview

MCP Factory solves a real friction point for AI developers: bridging existing REST APIs into the MCP ecosystem. Instead of hand-writing tool definitions, you paste or upload any OpenAPI 2.x/3.x spec and the platform:

1. Parses every operation and its parameters.
2. Converts them into typed MCP tool definitions.
3. Emits a production-ready TypeScript MCP server.
4. Stores the generated file in object storage (MinIO) and gives you a time-limited download link.

The entire generation pipeline runs asynchronously in a background worker. Real-time log streaming over WebSocket lets you watch every step of the process as it happens.

---

## Architecture

```
┌─────────────────────────────────────────┐
│              React Frontend             │
│  (Vite + React 19 + Tailwind CSS v4)    │
│                                         │
│  /login   /register                     │
│  /dashboard  →  list of MCP servers     │
│  /generate   →  upload spec, trigger    │
│  /servers/:id  →  live logs, download   │
└───────────────────┬─────────────────────┘
                    │ HTTP / WebSocket
┌───────────────────▼─────────────────────┐
│           Express API (Node.js)          │
│                                         │
│  Auth (JWT, refresh tokens, cookies)    │
│  /specs   /servers   /jobs   /auth      │
│  WebSocket: real-time job log stream    │
└────────┬──────────────────┬─────────────┘
         │ BullMQ           │ SQL
┌────────▼────────┐  ┌──────▼──────┐
│   Redis         │  │ PostgreSQL   │
│ (job queue +    │  │ (users,      │
│  pub/sub logs)  │  │  specs,      │
└────────┬────────┘  │  servers,    │
         │           │  jobs)       │
┌────────▼────────┐  └─────────────┘
│  BullMQ Worker  │
│                 │
│  parse → gen →  │
│  upload to MinIO│
└────────┬────────┘
         │
┌────────▼────────┐
│  MinIO          │
│ (generated .ts  │
│  server files)  │
└─────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router v7, Axios |
| **Backend API** | Node.js, Express 5, WebSocket (`ws`) |
| **Auth** | JWT (access + refresh tokens), `bcrypt`, HTTP-only cookies |
| **Database** | PostgreSQL 16 |
| **Job Queue** | BullMQ + Redis 7 |
| **Real-time** | Redis Pub/Sub → WebSocket log streaming |
| **Object Storage** | MinIO (S3-compatible), presigned download URLs |
| **MCP SDK** | `@modelcontextprotocol/sdk` |
| **Validation** | Zod |
| **Testing** | Vitest |

---

## Features

- 🔐 **Authentication** — JWT-based auth with access/refresh tokens stored in HTTP-only cookies. Rate limiting on all routes.
- 📄 **Spec Management** — Upload and store OpenAPI specs (JSON or YAML) per user account.
- ⚡ **Async Generation** — MCP server generation runs in a background BullMQ worker, keeping the API responsive.
- 📡 **Live Log Streaming** — WebSocket connection streams real-time generation logs. Buffered in Redis so late-joining clients replay missed events.
- 💾 **Object Storage** — Generated TypeScript files uploaded to MinIO; download via 15-minute presigned URL.
- 🖥️ **Dashboard** — View all generated MCP servers and their statuses at a glance.
- 🛡️ **Input Validation** — All API inputs validated with Zod schemas before hitting business logic.

---

## Project Structure

```
mcp-factory/
├── backend/
│   ├── server.js               # Express app + WebSocket server entry point
│   ├── migrate.js              # Database migration runner
│   ├── generated-server.ts     # Example of a generated MCP server (from GitHub spec)
│   ├── openapi.yaml            # Sample OpenAPI spec (Petstore)
│   ├── specs/                  # Example OpenAPI documents used for testing
│   ├── src/
│   │   ├── worker.js           # BullMQ generation worker
│   │   ├── routes/
│   │   │   ├── auth.js         # Register, login, logout, token refresh
│   │   │   ├── specs.js        # Upload & list OpenAPI specs
│   │   │   ├── servers.js      # Trigger generation, list servers, download
│   │   │   └── jobs.js         # Query job status
│   │   ├── services/
│   │   │   ├── parser.js       # OpenAPI operation extractor
│   │   │   ├── generator.js    # MCP tool + server code generator
│   │   │   ├── queue.service.js# BullMQ queue helpers (ioredis connection)
│   │   │   └── storage.service.js # MinIO upload & presigned URL helpers
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── validate.middleware.js
│   │   │   ├── rateLimit.middleware.js
│   │   │   └── error.middleware.js
│   │   ├── db/                 # pg Pool setup
│   │   └── config/
│   ├── tests/                  # Vitest test suite
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Router setup + protected route layout
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx   # Lists all MCP servers
│   │   │   ├── Generate.jsx    # Upload spec + trigger generation
│   │   │   └── ServerDetail.jsx# Live logs + download button
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── hooks/
│   │   │   └── useAuth.jsx     # Auth context + token refresh logic
│   │   └── api/
│   │       └── axios.js        # Axios instance with interceptors
│   └── package.json
├── docker-compose.yml          # Spins up API, worker, Postgres, Redis, MinIO
└── openapi.yaml                # API spec for MCP Factory itself
```

---

## Getting Started

### Prerequisites

- [Docker & Docker Compose](https://docs.docker.com/get-docker/) — for the recommended setup
- **Or**, for manual setup:
  - Node.js ≥ 20
  - PostgreSQL 16
  - Redis 7
  - MinIO (or any S3-compatible store)

---

### Option A — Docker Compose (Recommended)

This starts the API server, background worker, PostgreSQL, Redis, and MinIO in one command.

```bash
# 1. Clone the repo
git clone https://github.com/Sharvari1892/mcp-factory.git
cd mcp-factory

# 2. Start all services
docker compose up --build
```

The API will be available at `http://localhost:3000`.  
The MinIO console is available at `http://localhost:9001` (user: `minioadmin`, password: `minioadmin123`).

> **Note:** The Docker secrets in `docker-compose.yml` are for **local development only**. Generate and use strong secrets for any non-local environment.

---

### Option B — Manual Setup

**1. Backend**

```bash
cd backend

# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT secrets, and MinIO config

# Run database migrations
node migrate.js

# Start the API server
npm run dev

# In a separate terminal, start the background worker
npm run worker
```

**2. Frontend**

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will be at `http://localhost:5173` and proxies API calls to `http://localhost:3000`.

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and set the following:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `REDIS_URL` | Redis connection URL (e.g. `redis://localhost:6379`) |
| `PUBLIC_MINIO_HOST` | Public hostname for MinIO (used in presigned URLs) |
| `PUBLIC_MINIO_PORT` | Public port for MinIO |
| `MINIO_ENDPOINT` | Internal MinIO host (used by the server/worker) |
| `MINIO_PORT` | Internal MinIO port |
| `MINIO_ACCESS_KEY` | MinIO access key |
| `MINIO_SECRET_KEY` | MinIO secret key |
| `FRONTEND_URL` | Allowed CORS origin (e.g. `http://localhost:5173`) |

To generate secure JWT secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## API Reference

The full OpenAPI 3.0 spec is in [`openapi.yaml`](./openapi.yaml) at the repo root.

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Create a new account |
| `POST` | `/auth/login` | Log in, receive access + refresh tokens in cookies |
| `POST` | `/auth/logout` | Clear auth cookies |
| `POST` | `/auth/refresh` | Exchange refresh token for a new access token |

### Specs

| Method | Path | Description |
|---|---|---|
| `GET` | `/specs` | List all specs for the authenticated user |
| `POST` | `/specs` | Upload a new OpenAPI spec (JSON or YAML) |

### Servers

| Method | Path | Description |
|---|---|---|
| `GET` | `/servers` | List all generated MCP servers |
| `GET` | `/servers/:id` | Get a single server by ID |
| `POST` | `/servers/generate` | Start MCP server generation from a spec |
| `GET` | `/servers/:id/download` | Get a 15-minute presigned download URL |

### Jobs

| Method | Path | Description |
|---|---|---|
| `GET` | `/jobs/:id` | Get generation job status and logs |

### WebSocket

Connect to the root WebSocket endpoint and send a subscribe message:

```json
{ "type": "subscribe", "jobId": "<your-job-id>" }
```

The server will immediately replay any buffered logs and then stream live updates until the job finishes.

---

## How Generation Works

1. **Upload** — User uploads an OpenAPI spec (JSON or YAML). It is stored in the `specs` table.
2. **Trigger** — `POST /servers/generate` validates the request, creates `mcp_servers` and `generation_jobs` DB records, and enqueues a BullMQ job.
3. **Parse** — The worker parses the OpenAPI document and extracts all operations (method, path, parameters, request body).
4. **Generate** — Each operation is converted into an MCP tool definition (name, description, Zod-style input schema). All tools are assembled into a TypeScript MCP server using `@modelcontextprotocol/sdk`.
5. **Store** — The generated `.ts` file is uploaded to MinIO under `servers/<serverId>.ts`.
6. **Download** — The frontend polls for job completion, then calls `GET /servers/:id/download` to get a presigned URL valid for 15 minutes.

Throughout steps 3–5, each milestone is published to a Redis channel and buffered into a Redis list, so the frontend WebSocket connection receives a live log stream.

---

## Running Tests

```bash
cd backend
npm test
```

Tests are written with [Vitest](https://vitest.dev/) and cover the parser and generator services.

---

## Scripts Reference

### Backend (`cd backend`)

| Script | Command | Description |
|---|---|---|
| `start` | `node server.js` | Start API in production mode |
| `dev` | `nodemon server.js` | Start API with hot reload |
| `worker` | `node src/worker.js` | Start the BullMQ generation worker |
| `mcp` | `tsx generated-server.ts` | Run the example generated MCP server |
| `test` | `vitest run` | Run the test suite |

### Frontend (`cd frontend`)

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Start dev server at `localhost:5173` |
| `build` | `vite build` | Build for production |
| `preview` | `vite preview` | Preview the production build |
| `lint` | `eslint .` | Run ESLint |
