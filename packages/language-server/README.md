# Home Assistant Language Server

A standalone Language Server Protocol (LSP) implementation for Home Assistant configuration files. Provides intelligent completions, validation, hover information, and more for YAML configuration files.

## Features

- **Smart completions** for entity IDs, service calls, areas, devices, and more
- **Real-time validation** of entities, services, and configuration
- **Hover information** with entity states and service documentation  
- **Go to definition** for includes, scripts, and secrets
- **YAML formatting** and syntax highlighting
- **Template rendering** and validation

## Installation

### Global Installation

```bash
npm install -g home-assistant-language-server
```

### Local Installation

```bash
npm install home-assistant-language-server
```

## Configuration

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

### Getting a Long-Lived Access Token

1. In Home Assistant, go to your profile (click your username in the bottom left)
2. Scroll down to "Long-Lived Access Tokens"
3. Click "Create Token" 
4. Give it a name and copy the token

## Editor Integration

### Neovim with nvim-lspconfig

```lua
require('lspconfig').home_assistant_ls.setup{
  cmd = { 'home-assistant-language-server', '--stdio' },
  filetypes = { 'yaml' },
  root_dir = require('lspconfig.util').root_pattern('configuration.yaml'),
  settings = {}
}
```

### Neovim with Mason

```lua
-- In your Mason setup
require('mason-lspconfig').setup({
  ensure_installed = { 'home_assistant_ls' }
})
```

### VS Code

The language server can work with VS Code using a generic LSP client extension, though the official [Home Assistant VS Code extension](https://marketplace.visualstudio.com/items?itemName=keesschollaart.vscode-home-assistant) is recommended.

### Emacs with lsp-mode

```elisp
(add-to-list 'lsp-language-id-configuration '(yaml-mode . "yaml"))
(lsp-register-client
  (make-lsp-client
    :new-connection (lsp-stdio-connection '("home-assistant-language-server" "--stdio"))
    :major-modes '(yaml-mode)
    :server-id 'home-assistant-ls
    :root-path (lambda () (locate-dominating-file default-directory "configuration.yaml"))))
```

### Vim with vim-lsp

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

## Usage

The language server automatically activates when you open YAML files in a Home Assistant configuration directory (detected by the presence of `configuration.yaml`).

### Features Available

- **Entity ID completions**: Type entity IDs and get real-time suggestions from your Home Assistant instance
- **Service completions**: Complete service calls with parameter documentation
- **Validation warnings**: Get notified of unknown entities, services, or configuration errors
- **Hover tooltips**: Hover over entities to see their current state and attributes
- **Template preview**: Hover over Jinja2 templates to see rendered output
- **Go to definition**: Navigate to included files, scripts, and secrets

### File Types Supported

- `*.yaml` and `*.yml` files in Home Assistant configuration directories
- All Home Assistant configuration sections (automation, script, sensor, etc.)
- Lovelace dashboard configurations

## Troubleshooting

### Connection Issues

1. **Check your Home Assistant URL**: Ensure it's reachable from your development machine
2. **Verify your token**: Test the token using curl:
   ```bash
   curl -X GET \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     http://homeassistant.local:8123/api/
   ```
3. **Check logs**: Run with debug output:
   ```bash
   HASS_DEBUG=true home-assistant-language-server --stdio
   ```

### Performance Issues

- The language server caches Home Assistant data for performance
- Large Home Assistant instances (>1000 entities) may take longer to load initially
- Consider using a dedicated Home Assistant token for the language server

### Configuration Not Loading

1. Ensure `configuration.yaml` exists in your project root
2. Check that your workspace is correctly detected as a Home Assistant configuration
3. Verify file permissions on configuration files

## Development

### Building from Source

```bash
git clone https://github.com/home-assistant/language-server
cd language-server/packages/language-server
npm install
npm run build
```

### Contributing

Contributions are welcome! Please see the main repository for contribution guidelines.

## License

MIT License - see LICENSE file for details.

## Related Projects

- [Home Assistant VS Code Extension](https://github.com/keesschollaart81/vscode-home-assistant) - Full-featured VS Code extension
- [YAML Language Server](https://github.com/redhat-developer/yaml-language-server) - Underlying YAML language support
- [Home Assistant](https://www.home-assistant.io/) - Open source home automation platform