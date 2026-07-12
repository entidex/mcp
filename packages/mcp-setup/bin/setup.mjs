#!/usr/bin/env node

/**
 * @entidex/mcp-setup — one-command installer for the Entidex MCP server.
 *
 * Usage:
 *   npx @entidex/mcp-setup                        # interactive — picks client, prompts for key
 *   npx @entidex/mcp-setup --client claude-desktop --key entx_live_sk_...
 *   npx @entidex/mcp-setup --client cursor
 *   npx @entidex/mcp-setup --client claude-code
 *   npx @entidex/mcp-setup --client vscode
 *   npx @entidex/mcp-setup --demo                 # use the demo key (reference cohort only)
 *   npx @entidex/mcp-setup --uninstall             # remove entidex from the config
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, platform } from 'node:os';
import { createInterface } from 'node:readline';
import { execSync } from 'node:child_process';

const MCP_URL = 'https://entidex.com/api/mcp';
const SERVER_NAME = 'entidex';
const DEMO_KEY = 'entx_demo_sk_oo35PvnqmtFMoW7JRpOnLTkVVFBi9IFe';

// ── Argument parsing ────────────────────────────────────────────────

const args = process.argv.slice(2);
function flag(name) {
  return args.includes(`--${name}`);
}
function option(name) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : null;
}

// ── Client config paths ─────────────────────────────────────────────

const IS_MAC = platform() === 'darwin';
const HOME = homedir();
const APPDATA = process.env.APPDATA || join(HOME, 'AppData', 'Roaming');

const CLIENTS = {
  'claude-desktop': {
    label: 'Claude Desktop',
    configPath: IS_MAC
      ? join(HOME, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
      : join(APPDATA, 'Claude', 'claude_desktop_config.json'),
    configKey: 'mcpServers',
    buildEntry: (apiKey) => ({
      command: 'npx',
      args: ['-y', 'mcp-remote', MCP_URL, '--header', `Authorization: Bearer ${apiKey}`],
    }),
    restart: 'Restart Claude Desktop to connect.',
  },
  cursor: {
    label: 'Cursor',
    configPath: IS_MAC
      ? join(HOME, '.cursor', 'mcp.json')
      : join(APPDATA, 'Cursor', 'User', 'mcp.json'),
    configKey: 'mcpServers',
    buildEntry: (apiKey) => ({
      url: MCP_URL,
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
    restart: 'Restart Cursor to connect.',
  },
  vscode: {
    label: 'VS Code',
    configPath: IS_MAC
      ? join(HOME, 'Library', 'Application Support', 'Code', 'User', 'settings.json')
      : join(APPDATA, 'Code', 'User', 'settings.json'),
    configKey: 'mcp.servers',
    buildEntry: (apiKey) => ({
      url: MCP_URL,
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
    restart: 'Restart VS Code to connect.',
  },
  'claude-code': {
    label: 'Claude Code',
    configPath: null, // uses CLI, not a file
    buildEntry: null,
    restart: null,
  },
};

// ── Helpers ──────────────────────────────────────────────────────────

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function log(msg) {
  console.log(`\x1b[36m▸\x1b[0m ${msg}`);
}
function success(msg) {
  console.log(`\x1b[32m✓\x1b[0m ${msg}`);
}
function warn(msg) {
  console.log(`\x1b[33m!\x1b[0m ${msg}`);
}
function error(msg) {
  console.error(`\x1b[31m✗\x1b[0m ${msg}`);
}

function readJsonFile(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

function writeJsonFile(path, data) {
  const dir = join(path, '..');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function setNested(obj, dotPath, value) {
  const keys = dotPath.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in cur) || typeof cur[keys[i]] !== 'object') {
      cur[keys[i]] = {};
    }
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

function getNested(obj, dotPath) {
  const keys = dotPath.split('.');
  let cur = obj;
  for (const k of keys) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = cur[k];
  }
  return cur;
}

function deleteNested(obj, dotPath) {
  const keys = dotPath.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur || typeof cur !== 'object') return;
    cur = cur[keys[i]];
  }
  if (cur && typeof cur === 'object') delete cur[keys[keys.length - 1]];
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  // Guard: this is an installer, not an MCP server. If an MCP client spawned
  // us over a pipe expecting a stdio server (no TTY, no flags), fail fast with
  // a pointer instead of hanging on interactive prompts.
  if (!process.stdin.isTTY && !option('client') && !flag('demo') && !flag('uninstall')) {
    console.error(
      '@entidex/mcp-setup is an installer, not an MCP server. The Entidex MCP server is hosted at ' +
        MCP_URL +
        ' (streamable HTTP, Bearer auth). Run `npx @entidex/mcp-setup --client <claude-desktop|claude-code|cursor|vscode>` in a terminal to configure your client, or point your client at the URL directly. Docs: https://entidex.com/developers/mcp',
    );
    process.exit(2);
  }

  console.log();
  console.log('\x1b[1m  Entidex MCP Setup\x1b[0m');
  console.log('  Entity intelligence for your AI client');
  console.log();

  // Resolve client
  let clientId = option('client');
  if (!clientId) {
    const detected = detectClients();
    if (detected.length === 0) {
      log('No supported MCP clients detected. Choose manually:');
    } else {
      log(`Detected: ${detected.map((c) => CLIENTS[c].label).join(', ')}`);
    }
    console.log();
    console.log('  1) Claude Desktop');
    console.log('  2) Cursor');
    console.log('  3) VS Code');
    console.log('  4) Claude Code (CLI)');
    console.log();
    const choice = await ask('  Which client? [1-4]: ');
    clientId = ['claude-desktop', 'cursor', 'vscode', 'claude-code'][parseInt(choice) - 1];
    if (!clientId) {
      error('Invalid choice.');
      process.exit(1);
    }
  }

  const client = CLIENTS[clientId];
  if (!client) {
    error(`Unknown client: ${clientId}. Use: ${Object.keys(CLIENTS).join(', ')}`);
    process.exit(1);
  }

  log(`Client: ${client.label}`);

  // Handle uninstall
  if (flag('uninstall')) {
    return uninstall(clientId, client);
  }

  // Resolve API key (needed for every install path — Claude Code included, so
  // the `claude mcp add` command carries the Authorization header).
  let apiKey = option('key');
  if (flag('demo')) {
    apiKey = DEMO_KEY;
    log('Using demo key (reference cohort: Tesla, Elon Musk, PBD Podcast)');
  }
  if (!apiKey) {
    console.log();
    console.log('  Get your API key at https://entidex.com/developers');
    console.log('  Or press Enter to use the demo key (limited to reference entities).');
    console.log();
    apiKey = await ask('  API key: ');
    if (!apiKey) {
      apiKey = DEMO_KEY;
      log('Using demo key.');
    }
  }

  if (!apiKey.startsWith('entx_')) {
    warn('Key doesn\'t start with entx_ — are you sure it\'s correct?');
  }

  // Handle Claude Code (CLI-based, no config file — must run AFTER apiKey
  // resolution so the header can be passed to `claude mcp add`).
  if (clientId === 'claude-code') {
    return installClaudeCode(apiKey);
  }

  // Read existing config
  const configPath = client.configPath;
  let config = readJsonFile(configPath) || {};

  // Check if already installed
  const existing = getNested(config, `${client.configKey}.${SERVER_NAME}`);
  if (existing) {
    const overwrite = await ask('  Entidex is already configured. Overwrite? [y/N]: ');
    if (overwrite.toLowerCase() !== 'y') {
      log('Aborted. Existing config unchanged.');
      process.exit(0);
    }
  }

  // Write config
  const entry = client.buildEntry(apiKey);
  setNested(config, `${client.configKey}.${SERVER_NAME}`, entry);
  writeJsonFile(configPath, config);

  console.log();
  success(`Entidex MCP server added to ${client.label}`);
  success(`Config: ${configPath}`);
  if (client.restart) log(client.restart);
  console.log();
  log('28 tools available — resolve, verify, intelligence, grounding packet,');
  log('  grounding check, drift, timeline, decision survival, knowledge accuracy,');
  log('  X sentiment, cohort, milo action, and more.');
  console.log();
  log('Docs: https://entidex.com/developers/mcp');
  console.log();
}

function installClaudeCode(apiKey) {
  // The MCP endpoint requires a Bearer token — without --header, every tool
  // call would 401. Pass Authorization the same way the Desktop / Cursor /
  // VS Code paths do.
  const authHeader = `Authorization: Bearer ${apiKey}`;
  const displayCmd = `claude mcp add ${SERVER_NAME} --transport http ${MCP_URL} --header "${authHeader}"`;
  log(`Running: ${displayCmd}`);
  console.log();
  try {
    execSync(
      `claude mcp add ${SERVER_NAME} --transport http ${MCP_URL} --header ${JSON.stringify(authHeader)}`,
      { stdio: 'inherit' },
    );
    console.log();
    success('Entidex MCP server added to Claude Code.');
  } catch {
    error('Failed to run `claude mcp add`. Is Claude Code installed?');
    console.log();
    log('Install manually:');
    log(`  ${displayCmd}`);
  }
  console.log();
}

function uninstall(clientId, client) {
  if (clientId === 'claude-code') {
    log('Running: claude mcp remove entidex');
    try {
      execSync(`claude mcp remove ${SERVER_NAME}`, { stdio: 'inherit' });
      success('Removed Entidex from Claude Code.');
    } catch {
      warn('Could not remove. Run manually: claude mcp remove entidex');
    }
    return;
  }

  const config = readJsonFile(client.configPath);
  if (!config) {
    warn('Config file not found. Nothing to remove.');
    return;
  }

  const existing = getNested(config, `${client.configKey}.${SERVER_NAME}`);
  if (!existing) {
    warn('Entidex not found in config. Nothing to remove.');
    return;
  }

  deleteNested(config, `${client.configKey}.${SERVER_NAME}`);
  writeJsonFile(client.configPath, config);
  success(`Removed Entidex from ${client.label}.`);
  if (client.restart) log(client.restart);
}

function detectClients() {
  const found = [];
  for (const [id, client] of Object.entries(CLIENTS)) {
    if (id === 'claude-code') {
      try {
        execSync('claude --version', { stdio: 'ignore' });
        found.push(id);
      } catch { /* not installed */ }
    } else if (client.configPath) {
      const dir = join(client.configPath, '..');
      if (existsSync(dir)) found.push(id);
    }
  }
  return found;
}

main().catch((err) => {
  error(err.message);
  process.exit(1);
});
