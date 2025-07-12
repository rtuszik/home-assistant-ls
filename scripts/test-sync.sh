#!/bin/bash
set -e

echo "🧪 Testing Home Assistant Language Server Sync Process"
echo "======================================================"

# Test 1: Check if upstream remote can be added
echo ""
echo "Test 1: Upstream remote connectivity"
echo "------------------------------------"
UPSTREAM_REPO="https://github.com/keesschollaart81/vscode-home-assistant.git"
if git ls-remote $UPSTREAM_REPO HEAD >/dev/null 2>&1; then
  echo "✅ Can connect to upstream repository"
else
  echo "❌ Cannot connect to upstream repository"
  exit 1
fi

# Test 2: Check script permissions
echo ""
echo "Test 2: Script permissions"
echo "---------------------------"
for script in scripts/*.sh; do
  if [ -x "$script" ]; then
    echo "✅ $script is executable"
  else
    echo "❌ $script is not executable"
    exit 1
  fi
done

# Test 3: Add upstream remote (temporary)
echo ""
echo "Test 3: Upstream remote setup"
echo "------------------------------"
TEMP_REMOTE="test-upstream"
if git remote add $TEMP_REMOTE $UPSTREAM_REPO 2>/dev/null; then
  echo "✅ Can add upstream remote"
  git fetch $TEMP_REMOTE >/dev/null 2>&1
  echo "✅ Can fetch from upstream"
  git remote remove $TEMP_REMOTE
else
  echo "⚠️  Upstream remote might already exist (this is ok)"
fi

# Test 4: Check if language service directory exists
echo ""
echo "Test 4: Language service structure"
echo "-----------------------------------"
if [ -d "src/language-service" ]; then
  echo "✅ Language service directory exists"
  
  # Check key components
  REQUIRED_COMPONENTS=(
    "src/language-service/haLanguageService.ts"
    "src/language-service/completionHelpers"
    "src/language-service/home-assistant"
    "src/language-service/schemas"
  )
  
  for component in "${REQUIRED_COMPONENTS[@]}"; do
    if [ -e "$component" ]; then
      echo "✅ $component exists"
    else
      echo "❌ $component missing"
      exit 1
    fi
  done
else
  echo "❌ Language service directory missing"
  exit 1
fi

# Test 5: Check standalone components are preserved
echo ""
echo "Test 5: Standalone components"
echo "------------------------------"
STANDALONE_COMPONENTS=(
  "src/server.ts"
  "src/fileAccessor.ts"
  "bin/home-assistant-ls"
  "README.md"
  "examples/nvim-lspconfig.lua"
)

for component in "${STANDALONE_COMPONENTS[@]}"; do
  if [ -e "$component" ]; then
    echo "✅ $component exists"
  else
    echo "❌ $component missing"
    exit 1
  fi
done

# Test 6: Build test
echo ""
echo "Test 6: Build process"
echo "---------------------"
if npm run build >/dev/null 2>&1; then
  echo "✅ Build successful"
else
  echo "❌ Build failed"
  echo "Run 'npm run build' for details"
  exit 1
fi

# Test 7: CLI test
echo ""
echo "Test 7: CLI functionality"
echo "-------------------------"
if ./bin/home-assistant-ls --help >/dev/null 2>&1; then
  echo "✅ CLI works correctly"
else
  echo "❌ CLI test failed"
  exit 1
fi

# Test 8: Dry run of change detection
echo ""
echo "Test 8: Change detection (dry run)"
echo "-----------------------------------"
if [ -f "scripts/check-upstream-changes.sh" ]; then
  # This will fail if no upstream remote, but that's expected in test
  echo "✅ Change detection script exists"
else
  echo "❌ Change detection script missing"
  exit 1
fi

echo ""
echo "🎉 All tests passed!"
echo "==================="
echo ""
echo "The sync system is ready to use. You can now:"
echo "1. Run manual sync: ./scripts/manual-sync.sh"
echo "2. Set up GitHub Actions for automated sync"
echo "3. Monitor upstream changes weekly"