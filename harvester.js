import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_FILE = path.join(__dirname, 'mcp_registry.json');

const DOMAINS = [
  { id: "server-map", file: "line1/1-server-map.js", name: "Server Map TH-1" },
  { id: "mcp-setup", file: "line1/2-mcp-setup.js", name: "MCP Server Setup" },
  { id: "azure-devops", file: "line1/3-azure-devops.js", name: "Azure DevOps Top 20" },
  { id: "awesome-agents", file: "line1/4-awesome-agents.js", name: "Awesome Agents Top 20" },
  { id: "mcp-servers", file: "line1/5-mcp-servers.js", name: "MCP Servers Top 20" },
  { id: "copilot-hooks", file: "line1/6-copilot-hooks.js", name: "Copilot Hooks" },
  { id: "copilot-plugins", file: "line1/7-copilot-plugins.js", name: "Copilot Plugins Top 20" },
  { id: "copilot-skills", file: "line1/8-copilot-skills.js", name: "Copilot Skills Top 20" },
  { id: "copilot-instructions", file: "line1/9-copilot-instructions.js", name: "Copilot Instructions Top 20" },
  { id: "copilot-agents", file: "line1/10-copilot-agents.js", name: "Copilot Agents Top 20" }
];

async function harvest() {
  const registry = { mcp_servers: [] };

  for (const domain of DOMAINS) {
    console.error(`Harvesting metadata from ${domain.name}...`);
    const startTime = Date.now();

    try {
      const transport = new StdioClientTransport({
        command: "node",
        args: [path.join(__dirname, domain.file)]
      });

      const client = new Client(
        { name: `Harvester-${domain.id}`, version: "1.0.0" },
        { capabilities: {} }
      );

      await client.connect(transport);
      
      // Wait a bit for the server to be fully ready
      await new Promise(resolve => setTimeout(resolve, 500));

      const toolsResult = await client.listTools();
      const endTime = Date.now();

      registry.mcp_servers.push({
        id: domain.id,
        name: domain.name,
        path: domain.file,
        runtime: "node",
        priority_score: 0.5,
        capabilities: toolsResult.tools.map(t => ({
          tool: t.name,
          description: t.description
        })),
        metadata: {
          avg_startup_ms: endTime - startTime,
          last_harvested: new Date().toISOString()
        }
      });

      // Cleanup
      await transport.close();
      console.error(`Successfully harvested ${domain.id}`);
    } catch (error) {
      console.error(`Failed to harvest ${domain.id}:`, error.message);
    }
  }

  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2));
  console.error(`Registry updated at ${REGISTRY_FILE}`);
}

harvest().catch(console.error);
