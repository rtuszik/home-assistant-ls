# Home Assistant Language Server

A standalone Language Server Protocol (LSP) implementation for Home Assistant configuration files. Provides intelligent completions, validation, hover information, and more for YAML configuration files in any LSP-compatible editor.

## ✨ Features

- **Smart completions** for entity IDs, service calls, areas, devices, floors, and labels
- **Real-time validation** of entities, services, areas, devices, and configuration
- **Hover information** with entity states, service documentation, and template previews
- **Go to definition** for includes, scripts, and secrets
- **Template rendering** with live preview and validation
- **YAML formatting** and comprehensive schema validation
- **Universal compatibility** with Neovim, Emacs, Vim, VS Code, and other LSP clients

## 🚀 Quick Start

### Installation

```bash
# Using npm
npm install -g home-assistant-language-server

# Using bun (recommended)
bun install -g home-assistant-language-server
```

### Configuration

Set up your Home Assistant connection using environment variables:

```bash
export HASS_SERVER="http://homeassistant.local:8123"
export HASS_TOKEN="your_long_lived_access_token"
```

### Getting a Long-Lived Access Token

1. In Home Assistant, go to your profile (click your username)
2. Scroll down to "Long-Lived Access Tokens"
3. Click "Create Token" and give it a name
4. Copy the token for use with the language server

## 📝 Editor Setup

### Neovim (nvim-lspconfig)

```lua
require('lspconfig').home_assistant_ls.setup{
  cmd = { 'home-assistant-language-server', '--stdio' },
  filetypes = { 'yaml' },
  root_dir = require('lspconfig.util').root_pattern('configuration.yaml'),
  settings = {}
}
```

### Neovim (Mason)

```lua
require('mason-lspconfig').setup({
  ensure_installed = { 'home_assistant_ls' }
})
```

### Emacs (lsp-mode)

```elisp
(add-to-list 'lsp-language-id-configuration '(yaml-mode . "yaml"))
(lsp-register-client
  (make-lsp-client
    :new-connection (lsp-stdio-connection '("home-assistant-language-server" "--stdio"))
    :major-modes '(yaml-mode)
    :server-id 'home-assistant-ls
    :root-path (lambda () (locate-dominating-file default-directory "configuration.yaml"))))
```

### Vim (vim-lsp)

```vim
if executable('home-assistant-language-server')
  au User lsp_setup call lsp#register_server({
    \ 'name': 'home-assistant-language-server',
    \ 'cmd': {server_info->['home-assistant-language-server', '--stdio']},
    \ 'allowlist': ['yaml'],
    \ 'root_uri': {server_info->lsp#utils#path_to_uri(lsp#utils#find_nearest_parent_file_directory(lsp#utils#get_buffer_path(), 'configuration.yaml'))},
    \ })
endif
```

### VS Code (Generic LSP Client)

While the [official Home Assistant VS Code extension](https://marketplace.visualstudio.com/items?itemName=keesschollaart.vscode-home-assistant) is recommended, you can use this language server with any generic LSP client extension.

## ⚙️ Configuration

### Environment Variables (Recommended)

```bash
export HASS_SERVER="http://homeassistant.local:8123"
export HASS_TOKEN="your_long_lived_access_token"
export HASS_IGNORE_CERTIFICATES="false"  # optional, for self-signed certs
```

### Config File

Create `~/.home-assistant-ls.json`:

```json
{
    "homeAssistantUrl": "http://homeassistant.local:8123",
    "homeAssistantToken": "your_long_lived_access_token",
    "ignoreCertificates": false
}
```

### LSP Initialization Options

The language server accepts configuration through LSP `initializationOptions`:

```json
{
    "vscode-home-assistant": {
        "hostUrl": "http://homeassistant.local:8123",
        "longLivedAccessToken": "your_token_here",
        "ignoreCertificates": false
    }
}
```

## 🔧 Usage

The language server automatically activates when you open YAML files in a Home Assistant configuration directory (detected by the presence of `configuration.yaml`).

### Available Features

- **Entity ID completions**: Real-time suggestions from your Home Assistant instance
- **Service completions**: Complete service calls with parameter documentation
- **Validation warnings**: Unknown entities, services, areas, devices, or configuration errors
- **Hover tooltips**: Entity states, attributes, and service documentation
- **Template preview**: Live rendering of Jinja2 templates on hover
- **Go to definition**: Navigate to included files, scripts, and secrets
- **Smart validation**: Context-aware validation for Home Assistant YAML files

### Supported File Types

- `*.yaml` and `*.yml` files in Home Assistant configuration directories
- All Home Assistant configuration sections (automation, script, sensor, etc.)
- Lovelace dashboard configurations
- Blueprint files

## 🛠️ Development

### Building from Source

```bash
git clone https://github.com/home-assistant/language-server
cd home-assistant-language-server

# Using bun (recommended)
bun install
bun run build

# Or using npm
npm install
npm run build
```

### Testing

```bash
# Test the CLI
./bin/home-assistant-ls --help

# Test with a real Home Assistant instance
export HASS_SERVER="http://your-ha-instance:8123"
export HASS_TOKEN="your_token"
./bin/home-assistant-ls --stdio

# Test the build
bun run build  # or npm run build
```

### Project Structure

```
├── src/
│   ├── server.ts              # Main LSP server
│   ├── fileAccessor.ts        # File system operations
│   ├── bin/                   # CLI entry point
│   └── language-service/      # Core language service logic
├── bin/                       # Executable CLI script
├── examples/                  # Editor configuration examples
└── dist/                      # Compiled JavaScript (after build)
```

## 🚧 Troubleshooting

### Connection Issues

1. **Verify Home Assistant URL**: Ensure it's reachable from your development machine
2. **Test your token**:
    ```bash
    curl -X GET \
      -H "Authorization: Bearer YOUR_TOKEN" \
      -H "Content-Type: application/json" \
      http://homeassistant.local:8123/api/
    ```
3. **Check logs**: Look for language server output in your editor's LSP logs

### Performance

- The language server caches Home Assistant data for performance
- Large instances (>1000 entities) may take longer to load initially
- Consider using a dedicated token for the language server

### Configuration Not Loading

1. Ensure `configuration.yaml` exists in your project root
2. Check workspace detection in LSP logs
3. Verify file permissions on configuration files

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [Home Assistant](https://www.home-assistant.io/) - Open source home automation platform
- [YAML Language Server](https://github.com/redhat-developer/yaml-language-server) - Underlying YAML language support
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/) - Protocol specification

## 📊 Supported Editors

| Editor       | Support       | Setup Guide                                                |
| ------------ | ------------- | ---------------------------------------------------------- |
| Neovim       | ✅ Full       | [examples/nvim-lspconfig.lua](examples/nvim-lspconfig.lua) |
| Emacs        | ✅ Full       | [Setup Guide](#emacs-lsp-mode)                             |
| Vim          | ✅ Full       | [Setup Guide](#vim-vim-lsp)                                |
| VS Code      | ✅ Compatible | Use generic LSP client                                     |
| Sublime Text | ✅ Compatible | Use LSP package                                            |
| Atom         | ✅ Compatible | Use atom-languageclient                                    |

---

**Made with ❤️ for the Home Assistant community**

