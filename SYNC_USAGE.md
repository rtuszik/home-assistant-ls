# Sync Usage Guide

Quick reference for keeping the Home Assistant Language Server synchronized with upstream changes.

## 🚀 Quick Start

### Automated Sync (Recommended)

The GitHub Actions workflow runs automatically every Monday at 2 AM UTC and creates pull requests when changes are detected.

**Manual trigger:**

1. Go to Actions tab in your GitHub repository
2. Select "Sync with Upstream VS Code Extension"
3. Click "Run workflow"

### Manual Sync

```bash
# One-time test (recommended first)
./scripts/test-sync.sh

# Run manual sync
./scripts/manual-sync.sh

# Review changes
git diff --cached

# Commit if satisfied
git commit -m "sync: Update from upstream vscode-home-assistant"
```

## 📋 Commands Reference

| Command                               | Purpose                            |
| ------------------------------------- | ---------------------------------- |
| `./scripts/test-sync.sh`              | Test sync system health            |
| `./scripts/manual-sync.sh`            | Interactive manual sync            |
| `./scripts/check-upstream-changes.sh` | Check for changes only             |
| `./scripts/sync-upstream.sh`          | Perform sync (used by manual-sync) |

## 🔍 What Gets Synced

### ✅ Synced Components

- `src/language-service/` - Core language service logic
    - Completion helpers (entities, services, areas, etc.)
    - Schema definitions and validation
    - Home Assistant connection and API logic
    - Definition and hover providers

### 🛡️ Preserved Components

- `src/server.ts` - Standalone LSP server
- `src/fileAccessor.ts` - Node.js file system adapter
- `bin/` - CLI entry point
- `examples/` - Editor integration examples
- `README.md` - Standalone documentation
- `package.json` - Standalone package configuration
- `scripts/` - Sync automation scripts

### 🚫 Excluded Components

- VS Code extension files (`src/extension.ts`, `src/auth/`, etc.)
- VS Code assets and syntax files
- VS Code specific tests and configuration

## 🧪 Testing After Sync

Always test after syncing:

```bash
# Build test (bun recommended)
bun run build  # or npm run build

# CLI test
./bin/home-assistant-ls --help

# Integration test (optional)
export HASS_SERVER="http://your-ha:8123"
export HASS_TOKEN="your_token"
echo 'automation:' | ./bin/home-assistant-ls --stdio
```

## 🚨 Troubleshooting

### Build Fails After Sync

- Check for new dependencies in upstream `package.json`
- Look for TypeScript API changes
- Review language service API compatibility

### CLI Doesn't Work

- Ensure `src/server.ts` wasn't accidentally overwritten
- Check for changes in language service initialization

### Manual Sync Fails

```bash
# Reset if needed
git reset --hard HEAD

# Check upstream connectivity
git remote -v
git fetch upstream

# Re-run with verbose output
bash -x ./scripts/manual-sync.sh
```

### No Changes Detected

This is normal! It means you're up to date.

## 📅 Recommended Workflow

1. **Weekly**: Let GitHub Actions run automatically
2. **Before releases**: Run manual sync to ensure latest features
3. **After upstream releases**: Check for important updates manually
4. **Always test**: Build and CLI functionality after any sync

## 🔗 Monitoring Upstream

- **Releases**: https://github.com/keesschollaart81/vscode-home-assistant/releases
- **Commits**: https://github.com/keesschollaart81/vscode-home-assistant/commits/main
- **Language Service**: Focus on changes in `src/language-service/`

## 💡 Tips

- **Review PRs carefully**: Automated PRs need human review
- **Test with real HA**: Use a real Home Assistant instance for testing
- **Monitor breaking changes**: Watch for major upstream API changes
- **Keep configs separate**: Don't modify synced language service files directly

