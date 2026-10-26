# Entidex — publishable packages

Public source home for the npm packages Entidex distributes, and the entry for
the [official MCP Registry](https://registry.modelcontextprotocol.io). Having a
public repo is what lets the npm publishes carry
[provenance](https://docs.npmjs.com/generating-provenance-statements).

| Package | What it is |
|---|---|
| [`@entidex/mcp-setup`](packages/mcp-setup) | One-command installer for the Entidex MCP server — configures Claude Desktop, Claude Code, Cursor, or VS Code. |
| [`entidex`](packages/entidex) | Unscoped meta-package. `npx entidex` delegates to `@entidex/mcp-setup`. |
| [`@entidex/sdk`](packages/sdk) | TypeScript SDK for the Entidex entity-intelligence API. |
| [`mcp-registry/`](mcp-registry) | The `server.json` registry entry + publish runbook. |

## Use it

```bash
npx @entidex/mcp-setup          # configure the MCP server, prompts for your key
npx @entidex/mcp-setup --demo   # public demo key, reference cohort (21 entities, e.g. Tesla, OpenAI, Elon Musk)
```

- **MCP server:** `https://entidex.com/api/mcp` (streamable HTTP, Bearer auth)
- **Descriptor:** `https://entidex.com/.well-known/mcp.json`
- **Docs:** `https://entidex.com/developers/mcp` · **Keys:** `https://entidex.com/developers`

## Publishing

Owner-ops only. See [`mcp-registry/PUBLISH.md`](mcp-registry/PUBLISH.md) and the
[`publish`](.github/workflows/publish.yml) workflow (npm publish → registry
publish, gated on a version-alignment check and an npm-live poll). Provision
`NPM_TOKEN` and `MCP_PUBLISHER_PRIVATE_KEY` as repository secrets, then run the
workflow.

Licensed [MIT](LICENSE).
