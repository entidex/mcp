# Publishing Entidex to the Official MCP Registry

## The invariant

The registry entry (`server.json`) and npm must never drift: `server.json` `version`
and its `packages[]` reference must equal `packages/mcp-setup/package.json` `version`,
and the npm package's `mcpName` must equal the server name (`com.entidex/entidex`).
The `publish` GitHub Actions workflow (`.github/workflows/publish.yml`)
enforces this before publishing — prefer it over a manual publish once its secrets
(`NPM_TOKEN`, `MCP_PUBLISHER_PRIVATE_KEY`) are provisioned on this repo.

## Sequencing (IMPORTANT)

The official registry validates npm package ownership: any npm package referenced in
`server.json` `packages[]` must contain `"mcpName": "com.entidex/entidex"` in its
published `package.json`. So the order is always:

1. **npm publish `@entidex/mcp-setup`** (with `mcpName` — present since 1.0.4)
2. **`mcp-publisher publish`** — the registry fetches the npm tarball to verify

Publishing the registry entry against an npm version that isn't live yet (or that
lacks `mcpName`) fails with "Registry validation failed for package".

## Manual publish

### Step 1 — Install mcp-publisher

```bash
# macOS (Homebrew)
brew install modelcontextprotocol/tap/mcp-publisher

# Or download from GitHub releases:
# https://github.com/modelcontextprotocol/registry/releases
```

### Step 2 — Generate signing keypair (already done for the live entry)

```bash
mcp-publisher keygen
```

This outputs an Ed25519 public key (base64). Save the private key securely
(and mirror it into the `MCP_PUBLISHER_PRIVATE_KEY` GitHub Actions secret so the
workflow can publish).

### Step 3 — DNS TXT record (already in place)

TXT record at the **apex** of `entidex.com`:

```
entidex.com. IN TXT "v=MCPv1; k=ed25519; p=<BASE64_PUBLIC_KEY>"
```

Verify: `nslookup -type=TXT entidex.com`

### Step 4 — Authenticate

```bash
mcp-publisher login dns --domain "entidex.com" --private-key "<PRIVATE_KEY>"
```

### Step 5 — Publish

From this directory (`mcp-registry/`):

```bash
mcp-publisher publish
```

### Step 6 — Verify

```bash
curl "https://registry.modelcontextprotocol.io/v0/servers?search=com.entidex%2Fentidex"
```

Check: latest entry shows the `packages` block, `version` matching npm, and the
demo-key auth description. PulseMCP (auto-ingests the registry) should pick up the
package + source links on its next ingestion cycle.

## Namespace

Using `com.entidex/entidex` because we own `entidex.com`. DNS verification proves
domain ownership — no GitHub namespace needed.

## Notes

- The primary transport is the remote streamable-http server (`https://entidex.com/api/mcp`).
  The `packages[]` block references `@entidex/mcp-setup` (the one-command installer)
  so directories that ingest the registry surface the npm package + install path.
- Auth header stays `isRequired: true` — the server genuinely rejects keyless requests
  (CANON 1.22: every tier needs a key for rate-limiting + attribution). The keyless
  *evaluation* story is the public demo key, which is named in the header description;
  it already ships in the published `@entidex/mcp-setup` package, so this is not a
  new disclosure.
- `repository.url` points at `entidex/mcp` — the public home for the publishable
  packages (the previous entry referenced `Entidex/MiloSays`, a 404). Because the
  repo is public, the workflow publishes with npm `--provenance`
  (see `.github/workflows/publish.yml`).
