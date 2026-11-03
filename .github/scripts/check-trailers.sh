#!/bin/bash
# Check agent provenance trailers (agent-workflow.md §3) on every commit in a PR.
#
# Usage: check-trailers.sh <base-sha> <head-sha> <head-ref>
#
# A commit must carry Agent, Session, Task and Base trailers when:
#   - the PR branch is an agent branch (agent/... or ccr-...), or
#   - the commit already has an Agent: trailer (all four are then required).
# Trailers must be in the commit message's final trailer block, so
# `git interpret-trailers --parse` and `git log --format=%(trailers)` see them.
# Base must name a commit in the target branch's history.
set -euo pipefail

base_sha="$1"; head_sha="$2"; head_ref="$3"
required=(Agent Session Task Base)

agent_branch=false
case "$head_ref" in agent/*|ccr-*) agent_branch=true ;; esac

fail=0; checked=0
for c in $(git rev-list --no-merges --reverse "$base_sha..$head_sha"); do
  trailers="$(git log -1 --format=%B "$c" | git interpret-trailers --parse)"
  if [ "$agent_branch" = false ] && ! grep -q '^Agent:' <<<"$trailers"; then
    continue
  fi
  checked=$((checked + 1))
  subject="$(git log -1 --format=%s "$c")"
  problems=()
  for key in "${required[@]}"; do
    value="$(sed -n "s/^$key: *//p" <<<"$trailers" | head -1)"
    if [ -z "$value" ]; then
      problems+=("missing $key:")
    elif [[ "$value" == *"<"*">"* ]]; then
      problems+=("$key: is a template placeholder ($value)")
    elif [ "$key" = Base ]; then
      if ! git cat-file -e "$value^{commit}" 2>/dev/null; then
        problems+=("Base: $value is not a commit in this repo")
      elif ! git merge-base --is-ancestor "$value" "$base_sha"; then
        problems+=("Base: $value is not in the target branch's history")
      fi
    fi
  done
  if [ "${#problems[@]}" -gt 0 ]; then
    fail=1
    echo "::error::${c:0:7} \"$subject\": ${problems[*]}"
  else
    echo "ok ${c:0:7} $subject"
  fi
done

echo "checked $checked commit(s) on $head_ref"
if [ "$fail" -ne 0 ]; then
  echo "Provenance trailers must be the last block of the commit message, e.g.:"
  echo "  Agent: <agent>"
  echo "  Session: <session-id>"
  echo "  Task: <task-id or unknown>"
  echo "  Base: <base-sha>"
  echo "  Co-Authored-By: ..."
  echo "See agent-workflow.md §3."
fi
exit "$fail"
