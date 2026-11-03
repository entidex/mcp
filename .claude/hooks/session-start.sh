#!/bin/bash
# SessionStart hook: sync with origin, report the base SHA, load the agent
# workflow rules into context, and (cloud sessions only) install SDK deps.
# Stdout from this hook is added to the session's context.
set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

# 1. Sync with origin/main. Never block the session on a network failure.
if git fetch --quiet origin main 2>/dev/null; then
  fetch_note="fetched origin/main"
else
  fetch_note="WARNING: git fetch origin main failed; origin/main may be stale"
fi

branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
head_sha="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
base_sha="$(git rev-parse origin/main 2>/dev/null || echo unknown)"
behind="unknown"; ahead="unknown"
if [ "$base_sha" != "unknown" ] && [ "$head_sha" != "unknown" ]; then
  read -r behind ahead < <(git rev-list --left-right --count origin/main...HEAD)
fi

echo "## Session start: git state"
echo "- $fetch_note"
echo "- Branch: $branch"
echo "- HEAD: $head_sha"
echo "- Base (origin/main): $base_sha"
echo "- Behind main: $behind commit(s); ahead of main: $ahead commit(s)"
if [ "$branch" = "main" ]; then
  echo "- WARNING: you are on main. Create your own branch before editing (agent-workflow.md §1)."
fi
if [ "$behind" != "unknown" ] && [ "$behind" -gt 0 ]; then
  echo "- ACTION: rebase on origin/main before starting work (agent-workflow.md §1, §5)."
fi
echo

# 2. Cloud sessions only: install SDK dev dependencies so the typecheck gate works.
if [ "${CLAUDE_CODE_REMOTE:-}" = "true" ] && command -v npm >/dev/null; then
  hashes=packages/sdk/node_modules/.session-start.sha256
  if ! sha256sum --check --status "$hashes" 2>/dev/null; then
    rm -f "$hashes"
    (cd packages/sdk && npm install --no-audit --no-fund --no-package-lock >&2)
    sha256sum .claude/hooks/session-start.sh packages/sdk/package.json > "$hashes" || rm -f "$hashes"
  fi
fi

# 3. Load the agent workflow rules into context.
if [ -f agent-workflow.md ]; then
  echo "## Agent workflow rules (agent-workflow.md). Follow these for every task."
  echo
  cat agent-workflow.md
else
  echo "WARNING: agent-workflow.md not found at repo root."
fi
