# @entidex/mcp-setup

One-command installer for the [Entidex MCP server](https://entidex.com/developers/mcp).

Configures Claude Desktop, Cursor, VS Code, or Claude Code automatically — no manual JSON editing.

## Quick start

```bash
npx @entidex/mcp-setup
```

Interactive mode: detects installed clients, prompts for your API key, writes the config.

## Options

```bash
# Specify client and key directly
npx @entidex/mcp-setup --client claude-desktop --key entx_live_sk_...

# Use the demo key (reference cohort: Tesla, Elon Musk, PBD Podcast)
npx @entidex/mcp-setup --client cursor --demo

# Claude Code (runs `claude mcp add` for you)
npx @entidex/mcp-setup --client claude-code

# Remove Entidex from a client
npx @entidex/mcp-setup --client claude-desktop --uninstall
```

### Clients

| Flag | Client | Config path |
|------|--------|-------------|
| `claude-desktop` | Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) / `%APPDATA%\Claude\` (Windows) |
| `cursor` | Cursor | `~/.cursor/mcp.json` (macOS) / `%APPDATA%\Cursor\User\mcp.json` (Windows) |
| `vscode` | VS Code | `~/Library/Application Support/Code/User/settings.json` (macOS) / `%APPDATA%\Code\User\` (Windows) |
| `claude-code` | Claude Code CLI | Uses `claude mcp add` (no config file) |

## What it does

1. Detects your OS and installed clients
2. Reads the existing config (or creates a new one)
3. Merges the Entidex server entry — preserves your other MCP servers
4. Prompts for your API key (or uses `--key` / `--demo`)
5. Writes the updated config
6. Tells you to restart the client

## Demo key

Press Enter when prompted for a key (or pass `--demo`) to use the shared demo key. It grants read access to a small reference cohort (Tesla, Elon Musk, PBD Podcast) with no account needed — for evaluation only.

## Tools available after setup

28 tools, tier-laddered. Headline set:

- `entity_resolve` — resolve a name to a canonical Entidex entity ID
- `entity_complete` — the complete, categorized intelligence record in one call
- `entity_grounding_packet` — deterministic, Ed25519-signed grounding payload over the verified record ("fetch first, answer second")
- `entity_grounding_check` — check a statement against the verified record before asserting it
- `entity_verify_fact` — verified values + where AI engines currently diverge
- `entity_knowledge_accuracy` — per-engine accuracy vs the verified record
- `entity_drift` / `entity_timeline` — drift history and the unified "what happened, when, and why" stream
- `entity_decision_survival` — multi-turn AI recommendation persistence
- `entity_submit_feedback` — submit corrections back to Entidex

Full tool list + tier ladder: [entidex.com/developers/mcp](https://entidex.com/developers/mcp)

Registry entry: [`com.entidex/entidex`](https://registry.modelcontextprotocol.io/v0/servers?search=com.entidex%2Fentidex) on the official MCP Registry.
