# mcp-open-sanctions

OpenSanctions MCP — Global sanctions and PEP data (free, no auth required)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search_entities` | Search global sanctions, watchlists, and PEP (politically exposed persons) databases. Returns matched entities with names, countries, datasets, and sanctions details. Example: search_entities("Vladimir Putin") or search_entities("Huawei", schema="Company") |
| `get_entity` | Get full details for a sanctioned entity by its OpenSanctions ID. Returns all properties including names, addresses, identifiers, sanctions programs, and related entities. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "open-sanctions": {
      "url": "https://gateway.pipeworx.io/open-sanctions/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Open Sanctions data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
