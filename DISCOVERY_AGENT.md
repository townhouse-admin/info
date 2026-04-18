# Discovery Agent & Harvester

## Proaktiv Inhämtning
`discovery_agent` är kronjuvelen i Line 0-hubben. Den löser problemet med "Tool Overload" genom att agera som en intelligent receptionist.

**Logik:**
1. Den tar emot ett *intent* (t.ex. "Jag vill optimera mina Azure-pipelines").
2. Den kör en parallell sökning (`search`) mot alla Line 1-domäner.
3. Den rankar resultaten och returnerar en lista med exakta kommandon som klienten kan köra för att få mer info.

## Metadata Harvester
`harvester.js` används för att underhålla systemets hälsa.

**Funktioner:**
- **Prestandamätning**: Loggar hur lång tid varje domän tar att starta.
- **Registry Building**: Skapar en statisk `mcp_registry.json` vilket gör att sökningar kan ske extremt snabbt utan att behöva starta alla servrar varje gång.
- **Validation**: Kontrollerar att GitHub-källorna är tillgängliga.
