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
exports.ConfigurationService = void 0;
const vscodeUri = __importStar(require("vscode-uri"));
class ConfigurationService {
    isConfigured = false;
    token;
    url;
    ignoreCertificates = false;
    disableAutomaticFileAssociation = false;
    autoRenderTemplates = true;
    constructor() {
        this.setConfigViaEnvironmentVariables();
        this.isConfigured = `${this.url}` !== "";
    }
    updateConfiguration = (config) => {
        console.log("Received updated configuration from VS Code");
        // Store previous values to detect changes
        const prevToken = this.token;
        const prevUrl = this.url;
        const prevIgnoreCertificates = this.ignoreCertificates;
        const prevDisableAutomaticFileAssociation = this.disableAutomaticFileAssociation;
        const prevAutoRenderTemplates = this.autoRenderTemplates;
        // Get the Home Assistant configuration section
        const incoming = config.settings["vscode-home-assistant"];
        // Update configuration values if we have a valid configuration object
        if (incoming && typeof incoming === "object") {
            console.log("Got valid configuration object");
            // Check if we have a token in the incoming configuration
            if (incoming.longLivedAccessToken) {
                this.token = incoming.longLivedAccessToken;
                console.log(`Token found in configuration (length: ${this.token.length}, first 5 chars: ${this.token.substring(0, 5)}...)`);
            }
            else {
                console.log("No token in incoming configuration");
            }
            // Handle URL configuration
            if (incoming.hostUrl !== undefined) {
                this.url = this.getUri(incoming.hostUrl);
            }
            this.ignoreCertificates = !!incoming.ignoreCertificates;
            this.disableAutomaticFileAssociation = !!incoming.disableAutomaticFileAssociation;
            this.autoRenderTemplates = incoming.autoRenderTemplates !== undefined ? !!incoming.autoRenderTemplates : true;
        }
        else {
            console.warn("Received invalid or empty configuration object");
        }
        this.setConfigViaEnvironmentVariables();
        this.isConfigured = `${this.url}` !== "" && !!this.token;
        // Log changes for debugging
        if (this.token !== prevToken) {
            if (!prevToken && this.token) {
                console.log("Token was added to configuration");
            }
            else if (prevToken && !this.token) {
                console.log("Token was removed from configuration");
            }
            else {
                console.log("Token was updated in configuration");
            }
        }
        if (this.url !== prevUrl) {
            console.log(`URL was updated: '${prevUrl || "undefined"}' -> '${this.url || "undefined"}'`);
        }
        if (this.ignoreCertificates !== prevIgnoreCertificates) {
            console.log(`Ignore certificates setting changed: ${prevIgnoreCertificates} -> ${this.ignoreCertificates}`);
        }
        if (this.disableAutomaticFileAssociation !== prevDisableAutomaticFileAssociation) {
            console.log(`Disable automatic file association setting changed: ${prevDisableAutomaticFileAssociation} -> ${this.disableAutomaticFileAssociation}`);
        }
        if (this.autoRenderTemplates !== prevAutoRenderTemplates) {
            console.log(`Auto render templates setting changed: ${prevAutoRenderTemplates} -> ${this.autoRenderTemplates}`);
        }
        console.log(`Configuration status after update: ${this.isConfigured ? "Configured" : "Not Configured"}`);
    };
    setConfigViaEnvironmentVariables() {
        const envHassServer = process.env.HASS_SERVER;
        const envHassToken = process.env.HASS_TOKEN;
        const envSupervisorToken = process.env.SUPERVISOR_TOKEN;
        console.log("Checking environment variables for configuration:");
        console.log(`- HASS_SERVER: ${envHassServer ? "Present" : "Not present"}`);
        console.log(`- HASS_TOKEN: ${envHassToken ? "Present" : "Not present"}`);
        console.log(`- SUPERVISOR_TOKEN: ${envSupervisorToken ? "Present" : "Not present"}`);
        // Set URL from environment if needed
        if (!this.url && envHassServer) {
            this.url = this.getUri(envHassServer);
            console.log(`Using URL from HASS_SERVER env var: ${this.url}`);
        }
        // Set token from environment if needed
        if (!this.token && envHassToken) {
            this.token = envHassToken;
            console.log(`Using token from HASS_TOKEN env var (length: ${this.token.length})`);
        }
        // Handle Supervisor special case
        if (!this.url && !this.token && envSupervisorToken) {
            this.url = this.getUri("http://supervisor/core");
            this.token = envSupervisorToken;
            console.log(`Using Supervisor connection: URL=${this.url}, token length: ${this.token.length}`);
        }
    }
    getUri = (value) => {
        if (!value) {
            return "";
        }
        try {
            // Normalize the URL input
            let normalizedUrl = value.trim();
            // Ensure the URL has a protocol
            if (!normalizedUrl.includes("://")) {
                console.log(`URL '${normalizedUrl}' has no protocol, assuming http://`);
                normalizedUrl = `http://${normalizedUrl}`;
            }
            // Parse and validate the URL
            const url = new URL(normalizedUrl);
            // Now parse with vscodeUri to get the same format as the rest of the code
            const uri = vscodeUri.URI.parse(url.href);
            // Ensure path doesn't end with a slash unless it's just the root path
            const path = uri.path === "/" ? "" : uri.path.replace(/\/$/, "");
            // Return properly formatted URL
            const formattedUrl = `${uri.scheme}://${uri.authority}${path}`;
            console.log(`Formatted URL: '${value}' -> '${formattedUrl}'`);
            return formattedUrl;
        }
        catch (error) {
            console.error(`Failed to parse URL '${value}':`, error);
            return value; // Return original if parsing fails
        }
    };
}
exports.ConfigurationService = ConfigurationService;
//# sourceMappingURL=configuration.js.map