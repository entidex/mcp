#!/usr/bin/env node

/**
 * entidex — thin meta-package. `npx entidex` delegates to @entidex/mcp-setup,
 * the one-command installer for the Entidex MCP server (hosted at
 * https://entidex.com/api/mcp). All flags pass through unchanged:
 *
 *   npx entidex                          # interactive — picks client, prompts for key
 *   npx entidex --client claude-code
 *   npx entidex --demo                   # public demo key (reference cohort only)
 *   npx entidex --uninstall
 *
 * Docs: https://entidex.com/developers/mcp
 */

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let setupBin;
try {
  setupBin = require.resolve('@entidex/mcp-setup/bin/setup.mjs');
} catch {
  console.error(
    'entidex: could not resolve @entidex/mcp-setup. Run `npx @entidex/mcp-setup` directly, or see https://entidex.com/developers/mcp',
  );
  process.exit(1);
}

const child = spawn(process.execPath, [setupBin, ...process.argv.slice(2)], {
  stdio: 'inherit',
});
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
