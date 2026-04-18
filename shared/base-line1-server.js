import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { z } from "zod";

export class BaseLine1Server {
  constructor(id, title, githubUrl) {
    this.id = id;
    this.title = title;
    this.githubUrl = githubUrl;
    this.cache = null;
    this.cacheTime = 0;
    this.server = new Server(
      { name: `MCP-Line1-${id}`, version: "1.0.0" },
      { capabilities: { tools: {} } }
    );
    this.setupTools();
  }

  async fetchData() {
    const now = Date.now();
    if (this.cache && now - this.cacheTime < 3600000) {
      return this.cache;
    }

    try {
      const response = await axios.get(this.githubUrl);
      const content = response.data;
      const items = this.parseMarkdownTable(content);
      this.cache = items;
      this.cacheTime = now;
      return items;
    } catch (error) {
      console.error(`Failed to fetch data for ${this.id}:`, error.message);
      return [];
    }
  }

  parseMarkdownTable(content) {
    const lines = content.split("\n");
    const items = [];
    let tableStarted = false;

    for (const line of lines) {
      if (line.includes("| # |") || line.includes("| # |")) {
        tableStarted = true;
        continue;
      }
      if (tableStarted && line.startsWith("|") && !line.includes("|---|")) {
        const parts = line.split("|").map(p => p.trim()).filter(p => p !== "");
        if (parts.length >= 4) {
          items.push({
            number: parseInt(parts[0]),
            name: parts[1].replace(/\*\*/g, ""),
            category: parts[2],
            description: parts[3],
            link: parts[4] ? parts[4].match(/\((.*?)\)/)?.[1] : ""
          });
        }
      }
    }
    return items;
  }

  setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "list_items",
          description: `Lista alla objekt i domänen ${this.title}`,
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "get_item",
          description: `Hämta ett specifikt objekt via dess nummer`,
          inputSchema: {
            type: "object",
            properties: {
              number: { type: "number" }
            },
            required: ["number"]
          }
        },
        {
          name: "search",
          description: `Sök efter objekt i ${this.title}`,
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string" }
            },
            required: ["query"]
          }
        },
        {
          name: "get_info",
          description: `Metadata om domänen`,
          inputSchema: { type: "object", properties: {} }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const items = await this.fetchData();

      switch (name) {
        case "list_items":
          return {
            content: [{ type: "text", text: JSON.stringify(items.slice(0, 20), null, 2) }]
          };
        case "get_item":
          const item = items.find(i => i.number === args.number);
          return {
            content: [{ type: "text", text: item ? JSON.stringify(item, null, 2) : "Hittade inte objektet." }]
          };
        case "search":
          const results = items.filter(i => 
            i.name.toLowerCase().includes(args.query.toLowerCase()) || 
            i.description.toLowerCase().includes(args.query.toLowerCase())
          );
          return {
            content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
          };
        case "get_info":
          return {
            content: [{ type: "text", text: `Domän: ${this.title}\nID: ${this.id}\nKälla: ${this.githubUrl}` }]
          };
        default:
          throw new Error(`Okänt verktyg: ${name}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
