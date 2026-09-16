#!/bin/bash
# Manual upstream sync: fetch, replace src/language-service, build, test.
set -euo pipefail

UPSTREAM_REPO="https://github.com/keesschollaart81/vscode-home-assistant.git"
UPSTREAM_REMOTE="upstream"

if [ ! -f "package.json" ] || ! grep -q '"home-assistant-ls"' package.json; then
  echo "❌ Run this from the home-assistant-ls repository root"
  exit 1
fi

if ! git remote get-url $UPSTREAM_REMOTE >/dev/null 2>&1; then
  git remote add $UPSTREAM_REMOTE $UPSTREAM_REPO
  echo "➕ Added upstream remote"
fi

git fetch "$UPSTREAM_REMOTE"
./scripts/check-upstream-changes.sh || exit 1

read -p "Proceed with sync? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Sync cancelled"
  exit 0
fi

./scripts/sync-upstream.sh

echo ""
echo "🧪 Building and testing..."
aube install
aube run build
aube test

echo ""
echo "✅ Sync built and tested. Review with 'git diff --cached', then commit:"
echo "   git commit -m 'sync: update language-service from upstream'"
