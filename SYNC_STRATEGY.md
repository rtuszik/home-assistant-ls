# Upstream Sync Strategy

This project vendors the language service from
[vscode-home-assistant](https://github.com/keesschollaart81/vscode-home-assistant)
and keeps it up to date with a verbatim directory sync.

## The one rule

**`src/language-service/` is upstream's directory, copied 1:1 from its `dev`
branch, nested package layout and all. Never edit anything inside it.**
Every sync replaces the whole directory, so local changes there are silently
lost. Fixes to language-service code belong upstream; standalone-server
concerns belong in the fork-owned files below.

Because the copy is verbatim (no path flattening, no file filtering, no
preserve lists), a sync cannot clobber fork code and needs no transformation
logic. This is what makes the sync sustainable, the previous strategy
(flatten + patch + preserve-list) produced a year of unmergeable PRs.

## Layout

| Path | Owner |
|---|---|
| `src/language-service/` | upstream (verbatim, auto-synced) |
| `src/server.ts` | fork, standalone LSP server (stdio, env-var config) |
| `src/fileAccessor.ts` | fork, Node.js file accessor (derived from upstream `src/server/fileAccessor.ts`) |
| `src/bin/`, `bin/` | fork, CLI entry |
| `test/` | fork, offline LSP smoke test |
| `package.json`, `tsconfig.json` | fork, build wiring; keep deps aligned with `src/language-service/package.json` |

`.last-upstream-sync` records the upstream commit of the last merged sync.
It only advances when a sync PR is actually merged to `main`.

## How a sync works

1. `scripts/check-upstream-changes.sh` compares `upstream/dev` against
   `.last-upstream-sync`, scoped to `src/language-service/`.
2. `scripts/sync-upstream.sh` replaces the directory verbatim
   (`git rm` + `git archive | tar -x`) and updates the marker.
3. Build + smoke test must pass (`aube run build && aube test`).

The GitHub Actions workflow (`.github/workflows/sync-upstream.yml`) runs this
monthly and on manual dispatch. It only opens a PR if build and smoke test
pass, and it reuses a single `sync/upstream` branch so PRs never pile up.
A failing workflow run means the sync needs manual attention, usually an
upstream API change that `src/server.ts` / `src/fileAccessor.ts` must adopt.

Manual sync: `./scripts/manual-sync.sh` (interactive), or run the two scripts
yourself.

## When upstream changes its server too

Upstream's `src/server/` (its own LSP server) is *not* synced, but
`src/server.ts` and `src/fileAccessor.ts` were derived from it. When a sync PR
contains language-service API changes, check the corresponding upstream diff:

```bash
git log --oneline <last-sync>..upstream/dev -- src/server/
```

and port anything relevant (bug fixes, new constructor signatures) by hand.

## Dependency alignment

The vendored code resolves its imports from the root `node_modules`. Keep the
root `package.json` dependency versions compatible with what
`src/language-service/package.json` declares, the smoke test will usually
catch drift (e.g. the yaml-language-server 1.19 l10n change).
