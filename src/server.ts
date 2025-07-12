import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  ServerCapabilities,
  TextDocumentSyncKind,
  Diagnostic,
  InitializeParams,
  InitializeResult,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getLanguageService } from "yaml-language-server/out/server/src/languageservice/yamlLanguageService";
import { HaConnection } from "./language-service/home-assistant/haConnection";
import { ConfigurationService } from "./language-service/configuration";
import { HomeAssistantConfiguration } from "./language-service/haConfig/haConfig";
import { HomeAssistantLanguageService } from "./language-service/haLanguageService";
import { SchemaServiceForIncludes } from "./language-service/schemas/schemaService";
import { IncludeDefinitionProvider } from "./language-service/definition/includes";
import { ScriptDefinitionProvider } from "./language-service/definition/scripts";
import { SecretsDefinitionProvider } from "./language-service/definition/secrets";
import { StandaloneFileAccessor } from "./fileAccessor";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

interface HomeAssistantLSConfig {
  homeAssistantUrl?: string;
  homeAssistantToken?: string;
  ignoreCertificates?: boolean;
}

// Load configuration from environment variables and config file
function loadConfiguration(): HomeAssistantLSConfig {
  const config: HomeAssistantLSConfig = {};
  
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
  } catch (error) {
    console.warn("Failed to load configuration file:", error);
  }
  
  return config;
}

// Create LSP connection using stdio
const connection = createConnection(process.stdin, process.stdout);

console.log = connection.console.log.bind(connection.console);
console.warn = connection.window.showWarningMessage.bind(connection.window);
console.error = connection.window.showErrorMessage.bind(connection.window);

const documents = new TextDocuments(TextDocument);
documents.listen(connection);

connection.onInitialize((params: InitializeParams): InitializeResult => {
  connection.console.log(
    `[Home Assistant Language Server(${process.pid})] Started and initialize received`,
  );

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

  const configurationService = new ConfigurationService();
  const haConnection = new HaConnection(configurationService);
  
  // Get workspace folder from params
  const workspaceFolder = params.rootUri || params.workspaceFolders?.[0]?.uri || process.cwd();
  const fileAccessor = new StandaloneFileAccessor(workspaceFolder, documents);
  const haConfigInstance = new HomeAssistantConfiguration(fileAccessor);

  const definitionProviders = [
    new IncludeDefinitionProvider(fileAccessor),
    new ScriptDefinitionProvider(haConfigInstance),
    new SecretsDefinitionProvider(fileAccessor),
  ];

  const yamlLanguageService = getLanguageService({
    schemaRequestService: async () => "",
    workspaceContext: {
      resolveRelativePath: (relativePath: string, resource: string) => {
        return path.resolve(path.dirname(resource), relativePath);
      }
    },
    telemetry: undefined,
  });

  const sendDiagnostics = (uri: string, diagnostics: Diagnostic[]) => {
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
    } catch (e) {
      console.error(
        `Unexpected error during file discovery / schema configuration: ${e}`,
      );
    }
  };

  const homeAsisstantLanguageService = new HomeAssistantLanguageService(
    yamlLanguageService,
    haConfigInstance,
    haConnection,
    definitionProviders,
    new SchemaServiceForIncludes(),
    sendDiagnostics,
    () => {
      documents.all().forEach(async (d) => {
        const diagnostics =
          await homeAsisstantLanguageService.getDiagnostics(d);
        sendDiagnostics(d.uri, diagnostics);
      });
    },
    configurationService,
  );

  // Setup handlers to notify client about connection status
  haConnection.onConnectionEstablished = (info) => {
    console.log("Home Assistant connection established");
    connection.sendNotification("ha_connected", info);
  };
  
  haConnection.onConnectionFailed = (error) => {
    console.log("Home Assistant connection failed");
    connection.sendNotification("ha_connection_error", { error: error || "Unknown error" });
  };

  documents.onDidChangeContent((e) =>
    homeAsisstantLanguageService.onDocumentChange(e.document),
  );
  documents.onDidOpen((e) =>
    homeAsisstantLanguageService.onDocumentOpen(e.document),
  );

  let onDidSaveDebounce: NodeJS.Timeout;
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
  
  connection.onCompletionResolve((p) =>
    homeAsisstantLanguageService.onCompletionResolve(p),
  );
  
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
    } else {
      console.log("Configuration is valid after update");
    }
  });

  connection.onRequest(
    "callService",
    (args: { domain: string; service: string; serviceData?: any }) => {
      void haConnection.callService(
        args.domain,
        args.service,
        args.serviceData,
      );
    },
  );

  connection.onRequest("checkConfig", async (_) => {
    const result = await haConnection.callApi(
      "post",
      "config/core/check_config",
    );
    connection.sendNotification("configuration_check_completed", result);
  });
  
  connection.onRequest("getErrorLog", async (_) => {
    const result = await haConnection.callApi("get", "error_log");
    connection.sendNotification("get_eror_log_completed", result);
  });
  
  connection.onRequest("renderTemplate", async (args: { template: string }) => {
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
        } else if (result.message) {
          outputString += `Error:\n${result.message}`;
        } else if (Object.keys(result).length > 0) {
          const errorMessage = JSON.stringify(result, null, 2);
          outputString += `Error:\n${errorMessage}`;
        } else {
          outputString += `Result:\n${result}`;
        }
      } else {
        outputString += `Result:\n${result}`;
      }
    } catch (error) {
      let errorMessage = "Unknown error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        try {
          errorMessage = JSON.stringify(error, null, 2);
        } catch {
          if ("message" in error) {
            errorMessage = error.message;
          } else if ("toString" in error && typeof error.toString === "function") {
            errorMessage = error.toString();
          }
        }
      } else if (typeof error === "string") {
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
      textDocumentSync: TextDocumentSyncKind.Full,
      completionProvider: { triggerCharacters: [" "], resolveProvider: true },
      hoverProvider: true,
      documentSymbolProvider: true,
      documentFormattingProvider: true,
      definitionProvider: true,
    } as ServerCapabilities,
  };
});

connection.listen();