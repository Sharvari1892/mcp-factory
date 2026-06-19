import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
    name: "generated-server",
    version: "1.0.0"
});

const transport = new StdioServerTransport();

async function main() {
    await server.connect(transport);
}

main().catch(console.error);
