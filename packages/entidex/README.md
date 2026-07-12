# entidex

**Signed, verifiable entity ground truth for AI.**

[Entidex](https://entidex.com) maintains a verified, provenance-carrying record per entity — companies, people, products, creators — and measures exactly where each AI engine diverges from it.

This package is the front door:

```bash
npx entidex
```

One command sets up the **Entidex MCP server** in Claude Desktop, Claude Code, Cursor, or VS Code — your AI client gets tools to resolve entities, fetch the signed verified record (Grounding Packet), check statements before asserting them (Grounding Check), read per-engine knowledge accuracy, and submit corrections.

It delegates to [`@entidex/mcp-setup`](https://www.npmjs.com/package/@entidex/mcp-setup); all flags pass through:

```bash
npx entidex --client claude-code     # non-interactive per-client setup
npx entidex --demo                   # public demo key (reference cohort: Tesla, Elon Musk, PBD Podcast)
npx entidex --uninstall              # remove Entidex from a client config
```

No package runs a server locally — the Entidex MCP server is hosted at `https://entidex.com/api/mcp` (streamable HTTP, Bearer auth). Registry entry: [`com.entidex/entidex`](https://registry.modelcontextprotocol.io/v0/servers?search=com.entidex%2Fentidex).

## Building on the API instead?

- [`@entidex/sdk`](https://www.npmjs.com/package/@entidex/sdk) — typed TypeScript client for the REST API
- Docs: [entidex.com/developers](https://entidex.com/developers) · MCP: [entidex.com/developers/mcp](https://entidex.com/developers/mcp)

## License

MIT © ENTIDEX LTD
