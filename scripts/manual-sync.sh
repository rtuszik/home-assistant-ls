#!/bin/bash
set -e

UPSTREAM_REPO="https://github.com/keesschollaart81/vscode-home-assistant.git"
UPSTREAM_REMOTE="upstream"

echo "🏠 Home Assistant Language Server - Manual Sync"
echo "=============================================="
echo ""
echo "This script will sync the language service components from the"
echo "upstream vscode-home-assistant extension while preserving your"
echo "standalone server customizations."
echo ""
echo "What this will do:"
echo "1. Add/update upstream remote if needed"
echo "2. Fetch latest upstream changes"
echo "3. Sync language-service components only"
echo "4. Preserve standalone customizations"
echo "5. Stage changes for your review"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Sync cancelled"
  exit 0
fi

echo ""
echo "🔍 Checking repository setup..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || ! grep -q "home-assistant-language-server" package.json; then
  echo "❌ This doesn't appear to be the home-assistant-language-server repository"
  exit 1
fi

# Check if upstream remote exists, if not add it
if ! git remote get-url $UPSTREAM_REMOTE >/dev/null 2>&1; then
  echo "➕ Adding upstream remote..."
  git remote add $UPSTREAM_REMOTE $UPSTREAM_REPO
  echo "✅ Added upstream remote: $UPSTREAM_REPO"
else
  # Update upstream URL in case it changed
  git remote set-url $UPSTREAM_REMOTE $UPSTREAM_REPO
  echo "✅ Upstream remote already exists"
fi

# Fetch latest upstream changes
echo ""
echo "📥 Fetching upstream changes..."
git fetch $UPSTREAM_REMOTE
echo "✅ Fetched latest upstream changes"

# Check for changes
echo ""
echo "🔍 Checking for changes..."
if ! ./scripts/check-upstream-changes.sh; then
  echo "❌ Failed to check for changes"
  exit 1
fi

# Ask user if they want to proceed with sync
echo ""
read -p "Proceed with sync? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Sync cancelled"
  exit 0
fi

# Run the sync
echo ""
echo "🔄 Running sync..."
if ! ./scripts/sync-upstream.sh; then
  echo "❌ Sync failed"
  exit 1
fi

# Test the build
echo ""
echo "🧪 Testing build..."
if npm run build >/dev/null 2>&1; then
  echo "✅ Build successful"
else
  echo "⚠️  Build failed - you may need to fix compatibility issues"
  echo "   Run 'npm run build' to see detailed errors"
fi

# Test CLI
echo ""
echo "🧪 Testing CLI..."
if ./bin/home-assistant-ls --help >/dev/null 2>&1; then
  echo "✅ CLI test successful"
else
  echo "⚠️  CLI test failed"
fi

echo ""
echo "🎉 Manual sync completed!"
echo ""
echo "📋 Next steps:"
echo "=============="
echo "1. Review changes:"
echo "   git diff --cached"
echo ""
echo "2. Test thoroughly:"
echo "   npm run build"
echo "   ./bin/home-assistant-ls --help"
echo ""
echo "3. Test with real Home Assistant (optional):"
echo "   export HASS_SERVER='http://your-ha:8123'"
echo "   export HASS_TOKEN='your_token'"
echo "   echo 'test: yaml' | ./bin/home-assistant-ls --stdio"
echo ""
echo "4. Commit if satisfied:"
echo "   git commit -m 'sync: Update from upstream vscode-home-assistant'"
echo ""
echo "5. Or reset if not satisfied:"
echo "   git reset --hard HEAD"