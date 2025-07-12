# Sync Strategy with Upstream VS Code Extension

This document outlines the strategy for keeping the standalone Home Assistant Language Server synchronized with the upstream [vscode-home-assistant](https://github.com/keesschollaart81/vscode-home-assistant) extension.

## Overview

The sync strategy is designed to:

1. **Automatically detect** upstream changes to language server components
2. **Selectively merge** only relevant changes (ignore VS Code-specific code)
3. **Preserve customizations** made for the standalone server
4. **Minimize manual intervention** through automation

## Architecture

### Core Components to Sync

The following directories contain the core language service logic that should be synced:

```
src/language-service/          # Core language service (SYNC)
├── completionHelpers/         # Entity/service completion logic
├── definition/               # Go-to-definition features
├── haConfig/                 # Home Assistant config parsing
├── home-assistant/           # HA connection and API logic
├── schemas/                  # YAML schema definitions
├── haLanguageService.ts      # Main language service class
└── configuration.ts          # Configuration management
```

### Files to Exclude from Sync

These upstream files should **NOT** be synced as they're VS Code-specific:

```
src/extension.ts              # VS Code extension entry point
src/auth/                     # VS Code authentication UI
src/commands/                 # VS Code command implementations
src/status/                   # VS Code status bar
src/snippets/                 # VS Code code snippets
syntaxes/                     # VS Code syntax highlighting
assets/                       # VS Code extension assets
src/test/                     # VS Code extension tests
package.json (root)           # VS Code extension manifest
```

### Standalone-Specific Files

These files are unique to the standalone server and should be preserved:

```
src/server.ts                 # Standalone LSP server
src/fileAccessor.ts           # Node.js file system adapter
src/bin/                      # CLI entry point
bin/                          # Executable script
examples/                     # Editor integration examples
README.md                     # Standalone documentation
```

## Sync Methods

### Method 1: Automated GitHub Actions (Recommended)

A GitHub Actions workflow that:

1. **Monitors upstream** for new releases/commits
2. **Checks out upstream** changes to a temporary branch
3. **Applies selective sync** using predefined file patterns
4. **Runs tests** to ensure compatibility
5. **Creates PR** for manual review if changes detected

### Method 2: Manual Sync Script

A local script for manual synchronization when needed.

### Method 3: Git Subtree Strategy

Use git subtree to manage the language-service directory as a separate component.

## Implementation

### 1. Automated Sync Workflow (.github/workflows/sync-upstream.yml)

```yaml
name: Sync with Upstream VS Code Extension

on:
    schedule:
        - cron: "0 2 * * 1" # Weekly on Monday at 2 AM UTC
    workflow_dispatch: # Manual trigger

jobs:
    sync:
        runs-on: ubuntu-latest
        steps:
            - name: Checkout
              uses: actions/checkout@v4
              with:
                  fetch-depth: 0

            - name: Add upstream remote
              run: |
                  git remote add upstream https://github.com/keesschollaart81/vscode-home-assistant.git
                  git fetch upstream

            - name: Check for changes
              id: changes
              run: |
                  # Compare language-service directory with upstream
                  ./scripts/check-upstream-changes.sh

            - name: Sync changes
              if: steps.changes.outputs.has_changes == 'true'
              run: |
                  ./scripts/sync-upstream.sh

            - name: Test build
              run: |
                  npm install
                  npm run build
                  ./bin/home-assistant-ls --help

            - name: Create Pull Request
              if: steps.changes.outputs.has_changes == 'true'
              uses: peter-evans/create-pull-request@v5
              with:
                  title: "sync: Update from upstream VS Code extension"
                  body: |
                      Automated sync from upstream vscode-home-assistant extension.

                      **Changes detected in:**
                      ${{ steps.changes.outputs.changed_files }}

                      **Upstream commit:** ${{ steps.changes.outputs.upstream_commit }}

                      Please review changes before merging.
                  branch: sync/upstream-${{ github.run_number }}
```

### 2. Change Detection Script (scripts/check-upstream-changes.sh)

```bash
#!/bin/bash
set -e

UPSTREAM_REMOTE="upstream"
UPSTREAM_BRANCH="main"
SYNC_PATHS=(
  "src/language-service/"
)

# Get latest upstream commit
UPSTREAM_COMMIT=$(git rev-parse $UPSTREAM_REMOTE/$UPSTREAM_BRANCH)
echo "upstream_commit=$UPSTREAM_COMMIT" >> $GITHUB_OUTPUT

# Check if we've synced this commit before
LAST_SYNC_FILE=".last-upstream-sync"
if [ -f "$LAST_SYNC_FILE" ]; then
  LAST_SYNC=$(cat $LAST_SYNC_FILE)
  if [ "$LAST_SYNC" = "$UPSTREAM_COMMIT" ]; then
    echo "has_changes=false" >> $GITHUB_OUTPUT
    echo "No changes since last sync"
    exit 0
  fi
fi

# Check for changes in sync paths
CHANGED_FILES=""
for path in "${SYNC_PATHS[@]}"; do
  if [ -f "$LAST_SYNC_FILE" ]; then
    LAST_SYNC=$(cat $LAST_SYNC_FILE)
    changes=$(git diff --name-only $LAST_SYNC..$UPSTREAM_COMMIT -- $path || true)
  else
    changes=$(git ls-tree -r --name-only $UPSTREAM_COMMIT -- $path || true)
  fi

  if [ -n "$changes" ]; then
    CHANGED_FILES="$CHANGED_FILES\n$changes"
  fi
done

if [ -n "$CHANGED_FILES" ]; then
  echo "has_changes=true" >> $GITHUB_OUTPUT
  echo "changed_files<<EOF" >> $GITHUB_OUTPUT
  echo -e "$CHANGED_FILES" >> $GITHUB_OUTPUT
  echo "EOF" >> $GITHUB_OUTPUT
else
  echo "has_changes=false" >> $GITHUB_OUTPUT
fi
```

### 3. Sync Script (scripts/sync-upstream.sh)

```bash
#!/bin/bash
set -e

UPSTREAM_REMOTE="upstream"
UPSTREAM_BRANCH="main"
TEMP_BRANCH="temp-sync"

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
)

echo "Starting sync with upstream..."

# Create temporary branch from upstream
git checkout -b $TEMP_BRANCH $UPSTREAM_REMOTE/$UPSTREAM_BRANCH

# Copy only the language service files to our branch
git checkout dev

for path in "${SYNC_PATHS[@]}"; do
  echo "Syncing $path..."
  git checkout $TEMP_BRANCH -- $path 2>/dev/null || echo "Path $path not found in upstream"
done

# Ensure our customizations are preserved
for file in "${PRESERVE_FILES[@]}"; do
  if [ -e "$file" ]; then
    git checkout HEAD -- $file
  fi
done

# Clean up temp branch
git branch -D $TEMP_BRANCH

# Record the sync
UPSTREAM_COMMIT=$(git rev-parse $UPSTREAM_REMOTE/$UPSTREAM_BRANCH)
echo $UPSTREAM_COMMIT > .last-upstream-sync

# Stage changes
git add -A

echo "Sync completed. Review changes and commit."
```

### 4. Manual Sync Script (scripts/manual-sync.sh)

```bash
#!/bin/bash
set -e

echo "Manual sync with upstream vscode-home-assistant..."
echo "This will:"
echo "1. Add upstream remote if not exists"
echo "2. Fetch latest upstream changes"
echo "3. Sync language-service components"
echo "4. Preserve standalone customizations"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 0
fi

# Add upstream remote if it doesn't exist
if ! git remote get-url upstream >/dev/null 2>&1; then
  echo "Adding upstream remote..."
  git remote add upstream https://github.com/keesschollaart81/vscode-home-assistant.git
fi

# Fetch latest
echo "Fetching upstream changes..."
git fetch upstream

# Run sync
./scripts/sync-upstream.sh

echo ""
echo "Sync completed! Review changes with:"
echo "  git diff --cached"
echo ""
echo "Commit changes with:"
echo "  git commit -m 'sync: Update from upstream'"
```

## Usage

### Automated (Recommended)

The GitHub Actions workflow runs weekly and creates PRs for any detected changes.

### Manual Sync

```bash
# One-time setup
chmod +x scripts/*.sh

# Run manual sync
./scripts/manual-sync.sh

# Review changes
git diff --cached

# Commit if satisfied
git commit -m "sync: Update from upstream vscode-home-assistant"
```

### Testing After Sync

Always test after syncing:

```bash
npm install
npm run build
./bin/home-assistant-ls --help

# Test with a real HA instance
export HASS_SERVER="http://your-ha-instance:8123"
export HASS_TOKEN="your_token"
echo 'test: yaml' | ./bin/home-assistant-ls --stdio
```

## Conflict Resolution

When conflicts arise:

1. **Language service conflicts**: Usually accept upstream changes
2. **Build/config conflicts**: Favor standalone customizations
3. **API changes**: May require manual adaptation of `server.ts` or `fileAccessor.ts`

## Monitoring

- **GitHub Actions** provides sync status
- **Release notes** from upstream should be reviewed
- **Breaking changes** in language service APIs need manual attention

## Benefits

- ✅ **Automated detection** of upstream changes
- ✅ **Selective syncing** of relevant components only
- ✅ **Preservation** of standalone customizations
- ✅ **CI/CD integration** with automated testing
- ✅ **Pull request workflow** for review before merging
- ✅ **Minimal manual effort** for routine updates

