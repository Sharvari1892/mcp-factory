function generateTool(operation)
{
  const properties = {};
  const required = [];

  for(const parameter of operation.parameters )
  {
    properties[parameter.name] = {
      type : parameter.schema?.type || "string"
    };

    if(parameter.required){
      required.push(parameter.name);
    }
  }

  return {
    name: operation.operationId,
    description: `${operation.method.toUpperCase()} ${operation.path}`,
    inputSchema: {
      type: "object",
      properties,
      required
    }
  };
}

function generateServerCode(tools) {
  // ✅ Fix 1: McpServer from server/mcp.js — not Server from server/index.js
  let code = `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
    name: "generated-server",
    version: "1.0.0"
});

`;

  for (const tool of tools) {
    // ✅ Fix 2: build a zod shape string from the inputSchema properties
    const zodShape = buildZodShape(tool.inputSchema.properties, tool.inputSchema.required);

    code += `server.tool(
    "${tool.name}",
    "${tool.description}",
    { ${zodShape} },
    async (args) => {
        return {
            content: [{ type: "text", text: "Not implemented yet" }]
        };
    }
);

`;
  }

  // ✅ Fix 3: proper async main wrapper — no top-level await problem
  code += `const transport = new StdioServerTransport();

async function main() {
    await server.connect(transport);
}

main().catch(console.error);
`;

  return code;
}

// ✅ New helper: converts your JSON schema properties into a zod shape string
// e.g. { limit: "integer", name: "string" } → `limit: z.number().optional(), name: z.string()`
function buildZodShape(properties, required) {
  if (!properties || Object.keys(properties).length === 0) return "";

  const parts = [];

  for (const [name, schema] of Object.entries(properties)) {
    const isRequired = required && required.includes(name);
    let zodType;

    // map OpenAPI types to zod types
    switch (schema.type) {
      case "integer":
      case "number":
        zodType = "z.number()";
        break;
      case "boolean":
        zodType = "z.boolean()";
        break;
      default:
        zodType = "z.string()";
    }

    // if not required, mark optional
    if (!isRequired) {
      zodType += ".optional()";
    }

    parts.push(`${name}: ${zodType}`);
  }

  return parts.join(", ");
}

module.exports = {
  generateTool,
  generateServerCode
};