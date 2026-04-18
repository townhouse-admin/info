# MCP Arkitektur: Line 0 & Line 1

## Översikt
Systemet är uppbyggt enligt en hierarkisk modell för att maximera modularitet och minska kognitiv belastning på LLM-modeller genom att endast ladda relevanta verktyg vid behov.

## Line 0: Central Hub
Hubben är den enda punkten som en extern klient (t.ex. en AI-agent) behöver ansluta till.

**Funktioner:**
- `list_domains`: Ger en överblick av tillgängliga kunskapsområden.
- `query_domain`: Exekverar ett specifikt verktyg i en underliggande domän.
- `search_all`: Utför en bred sökning över hela ekosystemet.
- `discovery_agent`: Analyserar fritext-intent för att föreslå lämpliga verktyg.

## Line 1: Domänlagret
Varje domän är en isolerad MCP-server. Detta gör det möjligt att lägga till nya områden utan att påverka befintlig kod.

### Implementationsmönster
Alla Line 1-servrar använder en gemensam bas (`BaseLine1Server`) vilket garanterar ett enhetligt API:
- `list_items`: Tabellöversikt av domänens innehåll.
- `get_item`: Detaljerad information om ett specifikt objekt.
- `search`: Fulltextsökning inom domänen.
- `get_info`: Metadata om domänens källa och status.

## Dataflöde
1. **Request**: Klient anropar `discovery_agent` i Line 0 med en fråga.
2. **Analysis**: Line 0 söker igenom sitt lokala register (`mcp_registry.json`).
3. **Delegation**: Line 0 startar vid behov den relevanta Line 1-servern via `node server.js`.
4. **Fetch**: Line 1-servern hämtar rådata från GitHub Markdown-filer.
5. **Response**: Data transformeras från Markdown -> JSON -> MCP Content och levereras tillbaka till klienten.
