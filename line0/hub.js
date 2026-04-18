import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DOMAINS = {
  "server-map": { file: "../line1/1-server-map.js", title: "Server Map TH-1" },
  "mcp-setup": { file: "../line1/2-mcp-setup.js", title: "MCP Server Setup" },
  "azure-devops": { file: "../line1/3-azure-devops.js", title: "Azure DevOps Top 20" },
  "awesome-agents": { file: "../line1/4-awesome-agents.js", title: "Awesome Agents Top 20" },
  "mcp-servers": { file: "../line1/5-mcp-servers.js", title: "MCP Servers Top 20" },
  "copilot-hooks": { file: "../line1/6-copilot-hooks.js", title: "Copilot Hooks" },
  "copilot-plugins": { file: "../line1/7-copilot-plugins.js", title: "Copilot Plugins Top 20" },
  "copilot-skills": { file: "../line1/8-copilot-skills.js", title: "Copilot Skills Top 20" },
  "copilot-instructions": { file: "../line1/9-copilot-instructions.js", title: "Copilot Instructions Top 20" },
  "copilot-agents": { file: "../line1/10-copilot-agents.js", title: "Copilot Agents Top 20" },
};

class McpHub {
  constructor() {
    this.server = new Server(
      { name: "MCP-Line0-Hub", version: "1.0.0" },
      { capabilities: { tools: {} } }
    );
    this.connections = new Map();
    this.setupTools();
  }

  async getClient(domainId) {
    if (this.connections.has(domainId)) {
      return this.connections.get(domainId);
    }

    const domain = DOMAINS[domainId];
    if (!domain) throw new Error(`Okänd domän: ${domainId}`);

    const transport = new StdioClientTransport({
      command: "node",
      args: [path.join(__dirname, domain.file)]
    });

    const client = new Client(
      { name: `Hub-Client-${domainId}`, version: "1.0.0" },
      { capabilities: {} }
    );

    await client.connect(transport);
    this.connections.set(domainId, client);
    return client;
  }

  setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "hub_status",
          description: "Visa status för alla anslutningar",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "list_domains",
          description: "Lista alla tillgängliga domäner",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "query_domain",
          description: "Fråga en specifik domän",
          inputSchema: {
            type: "object",
            properties: {
              domain_id: { type: "string" },
              tool: { type: "string" },
              args: { type: "object" }
            },
            required: ["domain_id", "tool"]
          }
        },
        {
          name: "search_all",
          description: "Sök i alla domäner parallellt",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string" }
            },
            required: ["query"]
          }
        },
        {
          name: "discovery_agent",
          description: "Inhämtnings-agent: Analyserar ett behov och hittar rätt verktyg/domän proaktivt",
          inputSchema: {
            type: "object",
            properties: {
              intent: { type: "string", description: "Vad vill du uppnå? (t.ex. 'automatisera Azure pipelines')" }
            },
            required: ["intent"]
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "discovery_agent":
          const intent = args.intent.toLowerCase();
          const allResults = await Promise.all(
            Object.keys(DOMAINS).map(async (id) => {
              try {
                const c = await this.getClient(id);
                const res = await c.callTool({
                  name: "search",
                  arguments: { query: intent }
                });
                const items = JSON.parse(res.content[0].text);
                return items.map(i => ({ ...i, domain: id }));
              } catch (e) {
                return [];
              }
            })
          );
          
          const flatResults = allResults.flat();
          if (flatResults.length === 0) {
            return {
              content: [{ type: "text", text: `Inhämtnings-agenten kunde inte hitta något specifikt verktyg för "${args.intent}" i de nuvarande domänerna.` }]
            };
          }

          let responseText = `Inhämtnings-agenten har hittat följande matchningar för ditt behov:\n\n`;
          flatResults.forEach(item => {
            responseText += `- [${item.domain.toUpperCase()}] ${item.name}: ${item.description}\n`;
            responseText += `  Anrop: query_domain(domain_id: "${item.domain}", tool: "get_item", args: { number: ${item.number} })\n\n`;
          });

          return {
            content: [{ type: "text", text: responseText }]
          };
        case "hub_status":
          return {
            content: [{ type: "text", text: `Anslutna domäner: ${Array.from(this.connections.keys()).join(", ") || "Inga"}` }]
          };
        case "list_domains":
          const domainList = Object.entries(DOMAINS).map(([id, d]) => `${id}: ${d.title}`).join("\n");
          return {
            content: [{ type: "text", text: `Tillgängliga domäner:\n${domainList}` }]
          };
        case "query_domain":
          const client = await this.getClient(args.domain_id);
          const result = await client.callTool({
            name: args.tool,
            arguments: args.args || {}
          });
          return result;
        case "search_all":
          const searchResults = await Promise.all(
            Object.keys(DOMAINS).map(async (id) => {
              try {
                const c = await this.getClient(id);
                const res = await c.callTool({
                  name: "search",
                  arguments: { query: args.query }
                });
                return { domain: id, results: JSON.parse(res.content[0].text) };
              } catch (e) {
                return { domain: id, error: e.message };
              }
            })
          );
          return {
            content: [{ type: "text", text: JSON.stringify(searchResults, null, 2) }]
          };
        default:
          throw new Error(`Okänt verktyg: ${name}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("MCP Hub (Line 0) running on stdio");
  }
}

const hub = new McpHub();
hub.run().catch(console.error);
