import { BaseLine1Server } from "../shared/base-line1-server.js";

const server = new BaseLine1Server(
  "azure-devops",
  "Azure DevOps Top 20",
  "https://raw.githubusercontent.com/townhouse-admin/Track-N-Show/main/docs/AZURE_DEVOPS_TOP20.md"
);

server.run().catch(console.error);
