#!/bin/bash
set -e

UPSTREAM_REMOTE="upstream"
UPSTREAM_BRANCH="dev"
TEMP_BRANCH="temp-sync-$(date +%s)"

# Sync paths (only language service components)
SYNC_PATHS=(
  "src/language-service/"
)

# Files to preserve (our customizations)
PRESERVE_FILES=(
  "src/server.ts"
  "src/fileAccessor.ts"
  "src/bin/"
  "bin/"
  "examples/"
  "README.md"
  "package.json"
  "tsconfig.json"
  ".last-upstream-sync"
  "scripts/"
  "SYNC_STRATEGY.md"
)

# VS Code specific files that should never be synced
EXCLUDE_PATTERNS=(
  "src/extension.ts"
  "src/auth/"
  "src/commands/"
  "src/status/"
  "src/snippets/"
  "syntaxes/"
  "assets/"
  "src/test/"
  "test-*/"
  "eslint.config.*"
  ".vscode/"
  "*.vsix"
)

echo "🚀 Starting sync with upstream vscode-home-assistant..."

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# Ensure we're on a clean working directory
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌ Working directory is not clean. Please commit or stash changes first."
  exit 1
fi

# Create temporary branch from upstream
echo "📥 Creating temporary branch from upstream..."
git checkout -b $TEMP_BRANCH $UPSTREAM_REMOTE/$UPSTREAM_BRANCH

# Switch back to our branch
echo "🔄 Switching back to $CURRENT_BRANCH..."
git checkout $CURRENT_BRANCH

# Copy only the language service files from upstream
for path in "${SYNC_PATHS[@]}"; do
  if git cat-file -e $TEMP_BRANCH:$path 2>/dev/null; then
    echo "📝 Syncing $path..."
    
    # Remove existing directory to handle deleted files
    if [ -d "$path" ]; then
      rm -rf "$path"
    fi
    
    # Copy from upstream branch
    git checkout $TEMP_BRANCH -- $path 2>/dev/null || echo "⚠️  Path $path not found in upstream"
  else
    echo "⚠️  Path $path not found in upstream"
  fi
done

# Ensure our customizations are preserved
echo "🛡️  Preserving standalone customizations..."
for file in "${PRESERVE_FILES[@]}"; do
  if [ -e "$file" ]; then
    echo "  Preserving $file"
    git checkout HEAD -- $file 2>/dev/null || true
  fi
done

# Remove any VS Code specific files that might have been copied
echo "🧹 Removing VS Code specific files..."
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
  # Use find to handle patterns safely
  find . -path "./$pattern" -type f -delete 2>/dev/null || true
  find . -path "./$pattern" -type d -exec rm -rf {} + 2>/dev/null || true
done

# Clean up temp branch
echo "🗑️  Cleaning up temporary branch..."
git branch -D $TEMP_BRANCH

# Record the sync
UPSTREAM_COMMIT=$(git rev-parse $UPSTREAM_REMOTE/$UPSTREAM_BRANCH)
echo $UPSTREAM_COMMIT > .last-upstream-sync
echo "📝 Recorded sync commit: $UPSTREAM_COMMIT"

# Check if there are actual changes
if git diff --quiet; then
  echo "✅ No changes after sync - already up to date"
  exit 0
fi

# Stage changes
echo "📦 Staging changes..."
git add -A

# Show summary of changes
echo ""
echo "📊 Sync Summary:"
echo "================"
git diff --cached --stat

echo ""
echo "✅ Sync completed successfully!"
echo ""
echo "Next steps:"
echo "1. Review changes: git diff --cached"
echo "2. Test build: npm run build"
echo "3. Test CLI: ./bin/home-assistant-ls --help"
echo "4. Commit: git commit -m 'sync: Update from upstream vscode-home-assistant'"