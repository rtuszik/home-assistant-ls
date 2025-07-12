#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
// Get the path to the compiled server
const serverPath = path.join(__dirname, "..", "server.js");
// Parse command line arguments
const args = process.argv.slice(2);
const stdio = args.includes("--stdio");
if (stdio || args.length === 0) {
    // Default to stdio mode for LSP communication
    // Import and start the server directly
    require("../server");
}
else {
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
//# sourceMappingURL=home-assistant-ls.js.map