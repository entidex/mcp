# Agent Workflow — Git & Deployment Rules

Read in full before touching the repo. These rules exist because Git contention is **per-ref, not per-repo**: pushes to different branches are free, pushes to the same branch serialise. Every rule below keeps agents on separate refs until a single integrator lands work in order.

## Quick checklist (every task)

1. Own worktree, own branch, based on latest `main`. Record the base SHA.
2. Declare intended scope (files/modules) before editing. Stay inside it.
3. Small commits with provenance trailers. Never commit secrets or client data.
4. Rebase on `main`, run the gate, push your branch, open a PR, enqueue. **Stop.**
5. Never merge, never push to `main`/`release/*`, never force-push, never deploy production.
6. Hand off with the report format at the bottom.

## 1. Isolation — one agent, one worktree, one branch

- Start every task in its own worktree: `claude --worktree <task-id>` or `git worktree add ../<repo>-wt/<branch> -b <branch> main`.
- Branch name: `agent/<task-id>-<short-slug>` (e.g. `agent/T-142-vfp-export-readback`).
- Subagents spawned with the Agent tool use `isolation: "worktree"`.
- Never share a worktree or branch with another agent. Never work on `main` directly.
- Before starting: `git fetch origin && git rebase origin/main`. Note the resulting SHA as your `Base:`.
- Gitignored dependencies (`node_modules`, `.env`, build caches) are not in a fresh worktree — link or copy them; never commit them.
- **Cloud sessions (Claude Code on the web):** the platform clones the repo into a throwaway container and assigns a branch (e.g. `ccr-…`). That branch is your agent branch: use it as-is, don't create an `agent/…` branch or a worktree, and never push anywhere else. Every other rule still applies — record `Base:`, and the session-start hook reports it for you.

## 2. Scope — declare before you edit

- Write your intent at task start in the PR description (or `.agent/intent/<task-id>.md` if no PR yet): goal, files/modules you expect to touch, shared contracts you depend on.
- Shared contracts, API schemas, database migrations and generated code are **serialised**: one agent at a time, landed before dependent work starts. Do not change them inside a parallel task; raise it and wait.
- If you must touch something outside your declared scope, stop, say so in the PR, and let the integrator decide. Silent scope creep is the main cause of conflicts.
- Same-module tasks run serially. Parallel only across different modules.

## 3. Commits — small, frequent, attributable

- Commit early and often. Median agent commit should be small; squash is the integrator's call, not yours.
- Subject: conventional style, `type(scope): imperative summary` ≤ 72 chars.
- Every commit carries these trailers (git `Key: value` lines at the end of the message):

```
feat(export): add readback check after FoxPro write

Agent: claude-sonnet
Session: <session-id>
Task: T-142
Base: <base-sha>
```

- These trailers are the provenance record. Do not omit them; do not fabricate them.
- Put them in the **last paragraph** of the message, in the same block as any `Co-Authored-By:` lines, with no blank line in between. Otherwise git doesn't treat them as trailers and the `commit-trailers` CI check fails the PR.
- Never commit: `.env*`, keys, tokens, certificates, client data, client names or numbers, third-party code without a compatible licence.

## 4. Protected paths — human approval required

Changes under these paths are never landed by an agent without a named human approver on the PR:

- `.github/workflows/`, `deploy/`, `infra/`, `Dockerfile*`, `Makefile`
- `migrations/`, `schema/`, generated contract files
- `CLAUDE.md`, `agent-workflow.md`, `.claude/`
- Release config, version files, changelogs for tagged releases

If your task needs a change here, make it a **separate** PR so the rest of your work can land without waiting.

## 5. Landing — enqueue, don't merge

Agents never merge. The sequence is:

1. `git fetch origin && git rebase origin/main` — resolve conflicts by preserving other agents' intent, never by discarding their changes. If unsure, stop and flag.
2. Run the gate locally: build, tests, lint, vet/typecheck. Do not enqueue red.
3. `git push -u origin <branch>` — then **read back**: `git ls-remote origin <branch>` must return your HEAD SHA. An unverified push is not a push.
4. Open a PR with the intent, the scope actually touched, gate results, and a rollback note.
5. Enqueue (merge queue / integrator) and move to the next task. Do not babysit the queue.

Rules:

- One integrator (human or the monitor agent) owns `merge → gate on the combined result → push main → verify`. Landing order is queue order.
- Never `--force` on any shared ref. `--force-with-lease` only on your own agent branch, and only after a deliberate rebase.
- Interrupted push or merge: check the remote SHA **before** retrying. Never replay a step that may already have landed.
- If the combined gate fails, the integrator bisects the batch; the failing branch returns to its author, the rest proceed.

## 6. Deployment — from tags, reversible, never by task agents

General rule, for repos that deploy a service:

- Deploy only from a tagged commit on `main` (`vX.Y.Z`). Never from a branch, never from a working tree.
- Ladder: `main` → CI gate → tag → staging/pilot → smoke check → production. Production is a human action.
- Every deploy must be reversible before it starts: previous tag retained, rollback command known, data migrations forward-compatible or paired with a down-migration.
- After deploy, read back: health endpoint, version endpoint reports the tag, one representative end-to-end check. Record the result.

**This repo (`entidex/mcp`) releases packages, not a service.** A release is an npm publish plus an MCP Registry publish, and both are owner-only:

- Release only from `main`, by running the `publish` workflow (`.github/workflows/publish.yml`, manual `workflow_dispatch`). Never `npm publish` from a working tree. Agents never run it.
- A release is a version bump landed on `main` via a normal PR (`packages/*/package.json`, and for `@entidex/mcp-setup` also `mcp-registry/server.json` — the workflow fails if they disagree). Version files are protected paths (§4).
- **npm releases cannot be rolled back.** A published version is permanent (unpublish is limited and breaks dependants). "Reversible" here means: the previous version stays installable, and a bad release is fixed forward with a new patch version plus `npm deprecate` on the bad one.
- Order matters: `@entidex/mcp-setup` must be live on npm before the registry publish (see `mcp-registry/PUBLISH.md`). The workflow enforces this.
- Tag the released commit `<package>@<version>` (e.g. `@entidex/mcp-setup@1.0.5`) after a successful run, so every published version maps to a commit.

```
DEPLOY_TARGETS:   npm (@entidex/mcp-setup, @entidex/sdk, entidex) → official MCP Registry (com.entidex/entidex)
DEPLOY_COMMAND:   GitHub Actions workflow `publish` (manual, owner only)
ROLLBACK_COMMAND: none — publish a fixed patch version, then `npm deprecate <pkg>@<bad-version> "<reason>"`
SMOKE_CHECK:      `npm view <pkg>@<version> version` returns the version for each published package;
                  the registry entry for com.entidex/entidex at https://registry.modelcontextprotocol.io shows it
```

## 7. Monitor / integrator agent duties

If you are the monitor agent:

- Watch the queue; land in order; run the gate on the exact assembled train, not on branches individually.
- Reject PRs missing trailers, intent, or gate results. Reject scope creep into protected paths.
- Report every landing: SHA, branches included, gate result, deploy status.
- Never approve protected-path changes yourself. Escalate to a human.

## 8. Recovery

- Conflict you can't resolve confidently → stop, describe both sides in the PR, hand to the integrator.
- Lost or stale worktree → do not reset shared refs; recreate from `main`, cherry-pick your own commits by SHA.
- Pushed to the wrong branch → do not force anything; tell the integrator with the SHA.
- Secret committed → stop immediately, report it; rotation beats history rewriting.

## 9. Hand-off report (end of every task)

```
Task:      T-142
Branch:    agent/T-142-vfp-export-readback
Base:      <sha>  Head: <sha>  (verified on remote: yes/no)
Scope:     declared: <list>   touched: <list>   outside scope: none / <list + why>
Gate:      build ✓  tests ✓ (n passed)  lint ✓
PR:        #<n>  queued: yes/no
Protected: none touched / separate PR #<n>
Rollback:  revert <sha> / <note>
Open:      <anything the integrator must decide>
```

Short and exact beats long and vague. If a field is unknown, say unknown.
