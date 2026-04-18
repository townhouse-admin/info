# Mega MCP Hub-of-Hubs

En skalbar Model Context Protocol (MCP) arkitektur för intelligent orkestrering av specialiserade domäner.

## Vision
Att skapa en centraliserad intelligens (Line 0) som kan hantera och delegera uppgifter till ett obegränsat antal specialiserade kunskapskällor (Line 1), med stöd för proaktiv verktygsupptäckt.

## Huvudkomponenter

### 1. Line 0 Hub (`hub.js`)
Fungerar som "hjärnan" i systemet. Den håller inga egna data utan agerar som en router och manager för alla anslutna domäner.
- **Transports**: Använder `stdio` för säker och snabb interprocess-kommunikation.
- **Orkestrering**: Kan söka i alla domäner parallellt eller skicka specifika frågor.

### 2. Line 1 Domäner (Specialized Servers)
Tio oberoende servrar som var och en ansvarar för ett specifikt område (t.ex. Azure DevOps, Awesome Agents, Copilot Skills).
- **Dynamic Fetching**: Hämtar data i realtid från GitHub (`townhouse-admin/Track-N-Show`).
- **Standardisering**: Alla domäner bygger på en gemensam `BaseLine1Server`-klass.

### 3. Discovery Agent
En inbyggd agent som förstår användarens intention. Istället för att användaren måste veta vilket verktyg som ska användas, hittar Discovery-agenten rätt domän proaktivt.

### 4. Metadata Harvester
Ett verktyg för att automatiskt indexera hela systemet och mäta prestanda (startup-tider) för varje domän.

---
*Denna dokumentation är genererad för `townhouse-admin/info`.*
