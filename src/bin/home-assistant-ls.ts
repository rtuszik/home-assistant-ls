#!/usr/bin/env node

import * as path from "path";
import { spawn } from "child_process";

// Get the path to the compiled server
const serverPath = path.join(__dirname, "..", "server.js");

// Parse command line arguments
const args = process.argv.slice(2);
const stdio = args.includes("--stdio");

if (stdio || args.length === 0) {
  // Default to stdio mode for LSP communication
  // Import and start the server directly
  require("../server");
} else {
  console.log("Home Assistant Language Server");
  console.log("");
  console.log("Usage:");
  console.log("  home-assistant-language-server [--stdio]");
  console.log("");
  console.log("Options:");
  console.log("  --stdio    Use stdio for LSP communication (default)");
  console.log("");
  console.log("Configuration:");
  console.log("  Set environment variables:");
  console.log("    HASS_SERVER=http://homeassistant.local:8123");
  console.log("    HASS_TOKEN=your_long_lived_access_token");
  console.log("    HASS_IGNORE_CERTIFICATES=true  # optional");
  console.log("");
  console.log("  Or create ~/.home-assistant-ls.json:");
  console.log("  {");
  console.log('    "homeAssistantUrl": "http://homeassistant.local:8123",');
  console.log('    "homeAssistantToken": "your_long_lived_access_token",');
  console.log('    "ignoreCertificates": false');
  console.log("  }");
}