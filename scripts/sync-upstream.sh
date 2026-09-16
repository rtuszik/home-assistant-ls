#!/bin/bash
# Sync src/language-service verbatim from upstream vscode-home-assistant.
#
# The directory is vendored 1:1 (upstream's nested package layout, no
# transformations) so this script is a plain replace. Local code must never
# live inside src/language-service - it would be overwritten here.
set -euo pipefail

UPSTREAM_REMOTE="upstream"
UPSTREAM_BRANCH="dev"
SYNC_PATH="src/language-service"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌ Working directory is not clean. Commit or stash changes first."
  exit 1
fi

git fetch "$UPSTREAM_REMOTE"
UPSTREAM_COMMIT=$(git rev-parse "$UPSTREAM_REMOTE/$UPSTREAM_BRANCH")
echo "Syncing $SYNC_PATH from $UPSTREAM_REMOTE/$UPSTREAM_BRANCH ($UPSTREAM_COMMIT)"

git rm -r -q --ignore-unmatch "$SYNC_PATH"
git archive "$UPSTREAM_COMMIT" "$SYNC_PATH" | tar -x
# The vendored tree contains its own .gitignore for generated schemas, even
# though upstream tracks those files. Force-add the archive so the index is an
# exact copy of the upstream tree.
git add -f "$SYNC_PATH"

echo "$UPSTREAM_COMMIT" > .last-upstream-sync
git add .last-upstream-sync

if git diff --cached --quiet; then
  echo "✅ Already up to date with upstream"
  exit 0
fi

echo ""
echo "📊 Sync summary:"
git diff --cached --stat | tail -5
echo ""
echo "Next steps:"
echo "1. aube install && aube run build && aube test"
echo "2. Review: git diff --cached"
echo "3. Commit: git commit -m 'sync: update language-service from upstream'"
