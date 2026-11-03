# entidex/mcp

Public source home for the Entidex npm packages (`packages/`) and the official MCP Registry entry (`mcp-registry/`). See `README.md`.

## Rules for agents

Read and follow the agent workflow rules before touching the repo:

@agent-workflow.md

## Gate

- `packages/sdk`: `npm install && npm run typecheck`
- `packages/mcp-setup`, `packages/entidex`: no build or tests; `node --check` the files in `bin/`.
- No repo-wide test suite or linter.
