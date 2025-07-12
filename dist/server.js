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
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const yamlLanguageService_1 = require("yaml-language-server/out/server/src/languageservice/yamlLanguageService");
const haConnection_1 = require("./language-service/home-assistant/haConnection");
const configuration_1 = require("./language-service/configuration");
const haConfig_1 = require("./language-service/haConfig/haConfig");
const haLanguageService_1 = require("./language-service/haLanguageService");
const schemaService_1 = require("./language-service/schemas/schemaService");
const includes_1 = require("./language-service/definition/includes");
const scripts_1 = require("./language-service/definition/scripts");
const secrets_1 = require("./language-service/definition/secrets");
const fileAccessor_1 = require("./fileAccessor");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
// Load configuration from environment variables and config file
function loadConfiguration() {
    const config = {};
    // Load from environment variables first
    if (process.env.HASS_SERVER) {
        config.homeAssistantUrl = process.env.HASS_SERVER;
    }
    if (process.env.HASS_TOKEN) {
        config.homeAssistantToken = process.env.HASS_TOKEN;
    }
    if (process.env.HASS_IGNORE_CERTIFICATES) {
        config.ignoreCertificates = process.env.HASS_IGNORE_CERTIFICATES === "true";
    }
    // Load from config file
    try {
        const configPath = path.join(os.homedir(), ".home-assistant-ls.json");
        if (fs.existsSync(configPath)) {
            const fileConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
            config.homeAssistantUrl = config.homeAssistantUrl || fileConfig.homeAssistantUrl;
            config.homeAssistantToken = config.homeAssistantToken || fileConfig.homeAssistantToken;
            config.ignoreCertificates = config.ignoreCertificates ?? fileConfig.ignoreCertificates;
        }
    }
    catch (error) {
        console.warn("Failed to load configuration file:", error);
    }
    return config;
}
// Create LSP connection using stdio
const connection = (0, node_1.createConnection)(process.stdin, process.stdout);
console.log = connection.console.log.bind(connection.console);
console.warn = connection.window.showWarningMessage.bind(connection.window);
console.error = connection.window.showErrorMessage.bind(connection.window);
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
documents.listen(connection);
connection.onInitialize((params) => {
    connection.console.log(`[Home Assistant Language Server(${process.pid})] Started and initialize received`);
    // Load configuration
    const config = loadConfiguration();
    // Check if initialization contains the token in custom data
    const haInitConfig = params.initializationOptions && params.initializationOptions["vscode-home-assistant"];
    if (haInitConfig) {
        // Extract token from initialization options (from editor)
        if (haInitConfig.longLivedAccessToken) {
            const token = haInitConfig.longLivedAccessToken;
            console.log(`Token provided in initialization options (length: ${token.length}, first 5 chars: ${token.substring(0, 5)}...)`);
            config.homeAssistantToken = token;
        }
        // Extract Home Assistant instance URL from initialization options
        if (haInitConfig.hostUrl) {
            console.log(`Home Assistant instance URL provided in initialization options: ${haInitConfig.hostUrl}`);
            config.homeAssistantUrl = haInitConfig.hostUrl;
        }
        // Extract certificate settings
        if (haInitConfig.ignoreCertificates !== undefined) {
            config.ignoreCertificates = haInitConfig.ignoreCertificates;
        }
    }
    // Set environment variables for the HA connection
    if (config.homeAssistantUrl) {
        process.env.HASS_SERVER = config.homeAssistantUrl;
    }
    if (config.homeAssistantToken) {
        process.env.HASS_TOKEN = config.homeAssistantToken;
    }
    if (config.ignoreCertificates !== undefined) {
        process.env.HASS_IGNORE_CERTIFICATES = config.ignoreCertificates.toString();
    }
    console.log(`Configuration loaded: URL=${config.homeAssistantUrl ? "configured" : "not configured"}, Token=${config.homeAssistantToken ? "configured" : "not configured"}`);
    const configurationService = new configuration_1.ConfigurationService();
    const haConnection = new haConnection_1.HaConnection(configurationService);
    // Get workspace folder from params
    const workspaceFolder = params.rootUri || params.workspaceFolders?.[0]?.uri || process.cwd();
    const fileAccessor = new fileAccessor_1.StandaloneFileAccessor(workspaceFolder, documents);
    const haConfigInstance = new haConfig_1.HomeAssistantConfiguration(fileAccessor);
    const definitionProviders = [
        new includes_1.IncludeDefinitionProvider(fileAccessor),
        new scripts_1.ScriptDefinitionProvider(haConfigInstance),
        new secrets_1.SecretsDefinitionProvider(fileAccessor),
    ];
    const yamlLanguageService = (0, yamlLanguageService_1.getLanguageService)({
        schemaRequestService: async () => "",
        workspaceContext: {
            resolveRelativePath: (relativePath, resource) => {
                return path.resolve(path.dirname(resource), relativePath);
            }
        },
        telemetry: undefined,
    });
    const sendDiagnostics = (uri, diagnostics) => {
        connection.sendDiagnostics({
            uri,
            diagnostics,
        });
    };
    const discoverFilesAndUpdateSchemas = async () => {
        try {
            console.log("Discovering files and updating schemas...");
            await haConfigInstance.discoverFiles();
            homeAsisstantLanguageService.findAndApplySchemas();
            console.log("Files discovered and schemas updated successfully");
        }
        catch (e) {
            console.error(`Unexpected error during file discovery / schema configuration: ${e}`);
        }
    };
    const homeAsisstantLanguageService = new haLanguageService_1.HomeAssistantLanguageService(yamlLanguageService, haConfigInstance, haConnection, definitionProviders, new schemaService_1.SchemaServiceForIncludes(), sendDiagnostics, () => {
        documents.all().forEach(async (d) => {
            const diagnostics = await homeAsisstantLanguageService.getDiagnostics(d);
            sendDiagnostics(d.uri, diagnostics);
        });
    }, configurationService);
    // Setup handlers to notify client about connection status
    haConnection.onConnectionEstablished = (info) => {
        console.log("Home Assistant connection established");
        connection.sendNotification("ha_connected", info);
    };
    haConnection.onConnectionFailed = (error) => {
        console.log("Home Assistant connection failed");
        connection.sendNotification("ha_connection_error", { error: error || "Unknown error" });
    };
    documents.onDidChangeContent((e) => homeAsisstantLanguageService.onDocumentChange(e.document));
    documents.onDidOpen((e) => homeAsisstantLanguageService.onDocumentOpen(e.document));
    let onDidSaveDebounce;
    documents.onDidSave(() => {
        clearTimeout(onDidSaveDebounce);
        onDidSaveDebounce = setTimeout(discoverFilesAndUpdateSchemas, 100);
    });
    connection.onDocumentSymbol((p) => {
        const document = documents.get(p.textDocument.uri);
        if (document) {
            return homeAsisstantLanguageService.onDocumentSymbol(document);
        }
        return [];
    });
    connection.onDocumentFormatting((p) => {
        const document = documents.get(p.textDocument.uri);
        if (document) {
            return homeAsisstantLanguageService.onDocumentFormatting(document, p.options);
        }
        return [];
    });
    connection.onCompletion((p) => {
        const document = documents.get(p.textDocument.uri);
        if (document) {
            return homeAsisstantLanguageService.onCompletion(document, p.position);
        }
        return { items: [], isIncomplete: false };
    });
    connection.onCompletionResolve((p) => homeAsisstantLanguageService.onCompletionResolve(p));
    connection.onHover((p) => {
        const document = documents.get(p.textDocument.uri);
        if (document) {
            return homeAsisstantLanguageService.onHover(document, p.position);
        }
        return null;
    });
    connection.onDefinition((p) => {
        const document = documents.get(p.textDocument.uri);
        if (document) {
            return homeAsisstantLanguageService.onDefinition(document, p.position);
        }
        return undefined;
    });
    connection.onDidChangeConfiguration(async (config) => {
        console.log("Received configuration change from client");
        // Update the configuration service with the new settings
        configurationService.updateConfiguration(config);
        // Notify connection handler to update connection if needed
        await haConnection.notifyConfigUpdate();
        // Check configuration status after update
        if (!configurationService.isConfigured) {
            console.log("Configuration incomplete after update, sending no-config notification");
            connection.sendNotification("no-config");
        }
        else {
            console.log("Configuration is valid after update");
        }
    });
    connection.onRequest("callService", (args) => {
        void haConnection.callService(args.domain, args.service, args.serviceData);
    });
    connection.onRequest("checkConfig", async (_) => {
        const result = await haConnection.callApi("post", "config/core/check_config");
        connection.sendNotification("configuration_check_completed", result);
    });
    connection.onRequest("getErrorLog", async (_) => {
        const result = await haConnection.callApi("get", "error_log");
        connection.sendNotification("get_eror_log_completed", result);
    });
    connection.onRequest("renderTemplate", async (args) => {
        const timePrefix = `[${new Date().toLocaleTimeString()}] `;
        let outputString = `${timePrefix}Rendering template:\n${args.template}\n\n`;
        try {
            const result = await haConnection.callApi("post", "template", {
                template: args.template,
                strict: true,
            });
            // Check if the result is an error object
            if (result && typeof result === "object") {
                if (result.error) {
                    outputString += `Error:\n${result.error}`;
                }
                else if (result.message) {
                    outputString += `Error:\n${result.message}`;
                }
                else if (Object.keys(result).length > 0) {
                    const errorMessage = JSON.stringify(result, null, 2);
                    outputString += `Error:\n${errorMessage}`;
                }
                else {
                    outputString += `Result:\n${result}`;
                }
            }
            else {
                outputString += `Result:\n${result}`;
            }
        }
        catch (error) {
            let errorMessage = "Unknown error occurred";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            else if (typeof error === "object" && error !== null) {
                try {
                    errorMessage = JSON.stringify(error, null, 2);
                }
                catch {
                    if ("message" in error) {
                        errorMessage = error.message;
                    }
                    else if ("toString" in error && typeof error.toString === "function") {
                        errorMessage = error.toString();
                    }
                }
            }
            else if (typeof error === "string") {
                errorMessage = error;
            }
            outputString += `Error:\n${errorMessage}`;
        }
        connection.sendNotification("render_template_completed", outputString);
    });
    // fire and forget
    setTimeout(discoverFilesAndUpdateSchemas, 0);
    return {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Full,
            completionProvider: { triggerCharacters: [" "], resolveProvider: true },
            hoverProvider: true,
            documentSymbolProvider: true,
            documentFormattingProvider: true,
            definitionProvider: true,
        },
    };
});
connection.listen();
//# sourceMappingURL=server.js.map