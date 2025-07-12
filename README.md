# Home Assistant Language Server

> 🧪 **Beta Release**: Standalone language server extracted from [vscode-home-assistant](https://github.com/keesschollaart81/vscode-home-assistant). Currently in testing phase (v0.0.2-beta).

Language Server Protocol (LSP) implementation for Home Assistant configuration files. Provides completions, validation, hover information, and formatting for YAML configuration files.

## Features

- **Smart completions** for entity IDs, service calls, areas, devices, and configuration keys
- **Real-time validation** of configuration structure and entity references
- **Hover information** with entity states and service documentation
- **YAML formatting** and schema validation
- **Auto-sync** with upstream vscode-home-assistant for latest features

## Installation

```bash
npm install -g home-assistant-ls
```

## Configuration

Set up your Home Assistant connection:

```bash
export HASS_SERVER="http://homeassistant.local:8123"
export HASS_TOKEN="your_long_lived_access_token"
```

### Getting a Long-Lived Access Token

1. In Home Assistant, go to your profile (click your username)
2. Scroll down to "Long-Lived Access Tokens"
3. Click "Create Token" and give it a name
4. Copy the token for use with the language server

## Editor Setup

### Neovim (LazyVim)

```lua
return {
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        home_assistant_ls = {},
      },
    },
    config = function(_, opts)
      local lspconfig = require("lspconfig")
      local configs = require("lspconfig.configs")

      if not configs.home_assistant_ls then
        configs.home_assistant_ls = {
          default_config = {
            cmd = { "home-assistant-language-server", "--stdio" },
            filetypes = { "yaml" },
            root_dir = lspconfig.util.root_pattern("configuration.yaml"),
            single_file_support = false,
            settings = {},
          },
          docs = {
            description = "Language Server for Home Assistant configuration files",
          },
        }
      end

      lspconfig.home_assistant_ls.setup(opts.servers.home_assistant_ls or {})
    end,
  },
}
```

## Usage

The language server automatically activates when you open YAML files in directories containing `configuration.yaml`.

**Supported files:**

- `*.yaml` and `*.yml` files in Home Assistant configuration directories
- All Home Assistant configuration sections (automation, script, sensor, etc.)
- Lovelace dashboard configurations

## Development

```bash
git clone https://github.com/rtuszik/home-assistant-ls
cd home-assistant-ls
npm install && npm run build
```

## Sync Strategy

Auto-synced with upstream [vscode-home-assistant](https://github.com/keesschollaart81/vscode-home-assistant):

- **Automated sync**: GitHub Actions runs weekly to detect upstream changes
- **Preserved customizations**: Standalone server features remain intact
- See [SYNC_STRATEGY.md](SYNC_STRATEGY.md) for details

## Contributing

**Language features**: Report to [vscode-home-assistant](https://github.com/keesschollaart81/vscode-home-assistant)  
**Standalone server**: Report here

## License

MIT License - see [LICENSE.md](LICENSE.md)

