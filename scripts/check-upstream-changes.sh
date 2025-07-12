#!/bin/bash
set -e

UPSTREAM_REMOTE="upstream"
UPSTREAM_BRANCH="dev"
SYNC_PATHS=(
  "src/language-service/"
)

echo "Checking for upstream changes..."

# Get latest upstream commit
UPSTREAM_COMMIT=$(git rev-parse $UPSTREAM_REMOTE/$UPSTREAM_BRANCH)
echo "Latest upstream commit: $UPSTREAM_COMMIT"

# For GitHub Actions output
if [ -n "$GITHUB_OUTPUT" ]; then
  echo "upstream_commit=$UPSTREAM_COMMIT" >> $GITHUB_OUTPUT
fi

# Check if we've synced this commit before
LAST_SYNC_FILE=".last-upstream-sync"
if [ -f "$LAST_SYNC_FILE" ]; then
  LAST_SYNC=$(cat $LAST_SYNC_FILE)
  echo "Last synced commit: $LAST_SYNC"
  
  if [ "$LAST_SYNC" = "$UPSTREAM_COMMIT" ]; then
    echo "✅ No changes since last sync"
    if [ -n "$GITHUB_OUTPUT" ]; then
      echo "has_changes=false" >> $GITHUB_OUTPUT
    fi
    exit 0
  fi
else
  echo "No previous sync found - will sync all language service files"
  LAST_SYNC=""
fi

# Check for changes in sync paths
CHANGED_FILES=""
HAS_CHANGES=false

for path in "${SYNC_PATHS[@]}"; do
  echo "Checking changes in $path..."
  
  if [ -n "$LAST_SYNC" ]; then
    # Compare with last sync
    changes=$(git diff --name-only $LAST_SYNC..$UPSTREAM_COMMIT -- $path 2>/dev/null || true)
  else
    # First sync - list all files
    changes=$(git ls-tree -r --name-only $UPSTREAM_COMMIT -- $path 2>/dev/null || true)
  fi
  
  if [ -n "$changes" ]; then
    echo "📝 Changes detected in $path:"
    echo "$changes" | sed 's/^/  /'
    CHANGED_FILES="$CHANGED_FILES\n$changes"
    HAS_CHANGES=true
  else
    echo "✅ No changes in $path"
  fi
done

if [ "$HAS_CHANGES" = true ]; then
  echo ""
  echo "🔄 Changes detected - sync needed"
  if [ -n "$GITHUB_OUTPUT" ]; then
    echo "has_changes=true" >> $GITHUB_OUTPUT
    echo "changed_files<<EOF" >> $GITHUB_OUTPUT
    echo -e "$CHANGED_FILES" >> $GITHUB_OUTPUT
    echo "EOF" >> $GITHUB_OUTPUT
  fi
else
  echo "✅ No relevant changes found"
  if [ -n "$GITHUB_OUTPUT" ]; then
    echo "has_changes=false" >> $GITHUB_OUTPUT
  fi
fi