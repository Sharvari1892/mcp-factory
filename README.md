# MCP Factory

MCP Factory is a small Node.js workspace for turning OpenAPI-style specifications into usable tooling. The backend exposes a lightweight Express service for parsing specs, includes a generator that converts operations into Model Context Protocol (MCP) tools, and ships with sample specs and tests to validate the pipeline.

## What is in this repo?

- `backend/` contains the main application logic, the Express API, the MCP server generator, sample specs, and tests.
- `frontend/` is currently a placeholder package and does not include a UI yet.
- `backend/specs/` includes example OpenAPI documents used by the generation workflow.

## How it works

The backend follows a simple flow:

1. Load an OpenAPI document.
2. Extract operations and parameters.
3. Convert each operation into an MCP tool definition.
4. Emit a generated TypeScript MCP server.

The generated server currently exposes tool stubs that return `Not implemented yet`, which makes it useful as a scaffold for wiring real integrations later.

## Prerequisites

- A recent Node.js runtime
- npm

## Getting started

Install dependencies from the backend package:

```bash
cd backend
npm install
```

Run the test suite:

```bash
npm test
```

Start the Express API:

```bash
npm run start
```

For local development with automatic restarts:

```bash
npm run dev
```

## Available backend commands

- `npm run start` starts the Express server in `backend/server.js`.
- `npm run dev` starts the same server with `nodemon`.
- `npm run mcp` runs the generated MCP server from `backend/generated-server.ts`.
- `npm test` runs the Vitest suite.

## API endpoints

### `GET /health`

Returns a simple health response.

Example:

```bash
curl http://localhost:3000/health
```

Response:

```json
{ "status": "ok" }
```

### `POST /parse`

Accepts an OpenAPI document in the request body and returns the extracted operations.

Example:

```bash
curl -X POST http://localhost:3000/parse \
  -H "Content-Type: application/json" \
  -d @backend/specs/petstore.json
```

## Generating the MCP server

The repository includes a generation script used in the tests to produce `backend/generated-server.ts` from the sample GitHub spec:

```bash
node tests/services/githubPipeline.test.js
```

That script loads `backend/specs/github.json`, extracts the operations, builds MCP tool definitions, and writes the generated server file.

## Project structure

```text
backend/
  generated-server.ts
  package.json
  server.js
  specs/
  src/
  tests/
frontend/
  package.json
```

## Notes

- The backend currently focuses on parsing and generation, not on calling real upstream APIs.
- The frontend package is scaffolded but has no production UI yet.
- Sample specs and tests are included so you can extend the generator safely as the project grows.
