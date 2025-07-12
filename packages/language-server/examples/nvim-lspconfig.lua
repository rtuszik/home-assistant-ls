-- Example nvim-lspconfig setup for Home Assistant Language Server
-- Add this to your Neovim configuration

-- First, ensure the language server is installed globally:
-- npm install -g home-assistant-language-server

-- Set up environment variables (optional, can also be set globally):
-- export HASS_SERVER="http://homeassistant.local:8123"
-- export HASS_TOKEN="your_long_lived_access_token"

local lspconfig = require('lspconfig')

-- Define the language server configuration
local configs = require('lspconfig.configs')

-- Check if home_assistant_ls is already defined
if not configs.home_assistant_ls then
  configs.home_assistant_ls = {
    default_config = {
      cmd = { 'home-assistant-language-server', '--stdio' },
      filetypes = { 'yaml' },
      root_dir = function(fname)
        return lspconfig.util.root_pattern('configuration.yaml')(fname)
      end,
      settings = {},
      docs = {
        description = [[
Home Assistant Language Server for YAML configuration files.
Provides completions, validation, and hover information for Home Assistant configurations.

Install with: npm install -g home-assistant-language-server

Configure with environment variables:
- HASS_SERVER: Your Home Assistant URL
- HASS_TOKEN: Your long-lived access token
        ]]
      }
    }
  }
end

-- Set up the language server
lspconfig.home_assistant_ls.setup({
  -- Optional: Override default settings
  -- cmd = { 'home-assistant-language-server', '--stdio' },
  -- filetypes = { 'yaml' },
  
  -- Only activate in Home Assistant configuration directories
  root_dir = lspconfig.util.root_pattern('configuration.yaml'),
  
  -- Optional: Add additional settings
  settings = {},
  
  -- Optional: Custom initialization options
  init_options = {
    -- These can override environment variables
    -- ["vscode-home-assistant"] = {
    --   hostUrl = "http://homeassistant.local:8123",
    --   longLivedAccessToken = "your_token_here",
    --   ignoreCertificates = false
    -- }
  },
  
  -- Optional: Custom on_attach function
  on_attach = function(client, bufnr)
    -- Enable completion triggered by <c-x><c-o>
    vim.api.nvim_buf_set_option(bufnr, 'omnifunc', 'v:lua.vim.lsp.omnifunc')

    -- Mappings
    local bufopts = { noremap=true, silent=true, buffer=bufnr }
    vim.keymap.set('n', 'gD', vim.lsp.buf.declaration, bufopts)
    vim.keymap.set('n', 'gd', vim.lsp.buf.definition, bufopts)
    vim.keymap.set('n', 'K', vim.lsp.buf.hover, bufopts)
    vim.keymap.set('n', 'gi', vim.lsp.buf.implementation, bufopts)
    vim.keymap.set('n', '<C-k>', vim.lsp.buf.signature_help, bufopts)
    vim.keymap.set('n', '<space>rn', vim.lsp.buf.rename, bufopts)
    vim.keymap.set('n', '<space>ca', vim.lsp.buf.code_action, bufopts)
    vim.keymap.set('n', 'gr', vim.lsp.buf.references, bufopts)
    vim.keymap.set('n', '<space>f', function() vim.lsp.buf.format { async = true } end, bufopts)
  end,
})

-- Optional: Auto-format on save for YAML files in Home Assistant directories
vim.api.nvim_create_autocmd("BufWritePre", {
  pattern = "*.yaml,*.yml",
  callback = function()
    local clients = vim.lsp.get_active_clients({ name = "home_assistant_ls" })
    if #clients > 0 then
      vim.lsp.buf.format({ async = false })
    end
  end,
})