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
exports.SecretsCompletionContribution = void 0;
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const YAML = __importStar(require("yaml"));
class SecretsCompletionContribution {
    fileAccessor;
    // This is a special case - secrets are triggered by !secret tag, not property names
    static propertyMatches = [];
    constructor(fileAccessor) {
        this.fileAccessor = fileAccessor;
    }
    collectDefaultCompletions(_resource, _result) {
        return Promise.resolve(null);
    }
    collectPropertyCompletions = async (_resource, _location, _currentWord, _addValue, _isLast, _result) => {
        // Secrets completion is handled differently - not by property names
        return Promise.resolve(null);
    };
    collectValueCompletions = async (_resource, _location, _currentKey, _result) => {
        // Secrets completion is handled differently - not by property names
        return Promise.resolve(null);
    };
    getInfoContribution(_resource, _location) {
        return Promise.resolve([]);
    }
    /**
     * Get secrets completions by reading and parsing the secrets.yaml file
     */
    async getSecretsCompletions() {
        try {
            // secrets.yaml is always in the root of the project
            const secretsPath = "secrets.yaml";
            const secretsContent = await this.fileAccessor.getFileContents(secretsPath);
            if (!secretsContent) {
                return [];
            }
            // Parse the YAML content
            const secretsDocument = YAML.parseDocument(secretsContent);
            if (!secretsDocument.contents || typeof secretsDocument.contents !== "object") {
                return [];
            }
            const completions = [];
            // Extract all top-level keys from the secrets file
            if (secretsDocument.contents && "items" in secretsDocument.contents) {
                const contents = secretsDocument.contents;
                for (const item of contents.items) {
                    if (item && item.key && typeof item.key.value === "string") {
                        const secretKey = item.key.value;
                        const completionItem = vscode_languageserver_protocol_1.CompletionItem.create(secretKey);
                        completionItem.kind = vscode_languageserver_protocol_1.CompletionItemKind.Variable;
                        completionItem.insertText = secretKey;
                        completionItem.detail = "Secret from secrets.yaml";
                        completionItem.data = {};
                        completionItem.data.isSecret = true;
                        // Add documentation if there's a comment or value
                        let documentation = `**${secretKey}**\n\nSecret from: secrets.yaml`;
                        if (item.value && typeof item.value.value === "string") {
                            // Don't show the actual secret value for security, just indicate it has a value
                            documentation += "\n\nValue: [HIDDEN]";
                        }
                        completionItem.documentation = {
                            kind: "markdown",
                            value: documentation,
                        };
                        completions.push(completionItem);
                    }
                }
            }
            return completions;
        }
        catch (error) {
            console.log("Error reading secrets file:", error);
            return [];
        }
    }
    /**
     * Get all available secret keys from the secrets.yaml file
     */
    async getAvailableSecrets() {
        try {
            // secrets.yaml is always in the root of the project
            const secretsPath = "secrets.yaml";
            const secretsContent = await this.fileAccessor.getFileContents(secretsPath);
            if (!secretsContent) {
                return [];
            }
            // Parse the YAML content
            const secretsDocument = YAML.parseDocument(secretsContent);
            if (!secretsDocument.contents || typeof secretsDocument.contents !== "object") {
                return [];
            }
            const secretKeys = [];
            // Extract all top-level keys from the secrets file
            if (secretsDocument.contents && "items" in secretsDocument.contents) {
                const contents = secretsDocument.contents;
                for (const item of contents.items) {
                    if (item && item.key && typeof item.key.value === "string") {
                        secretKeys.push(item.key.value);
                    }
                }
            }
            return secretKeys;
        }
        catch (error) {
            console.log("Error reading secrets file:", error);
            return [];
        }
    }
}
exports.SecretsCompletionContribution = SecretsCompletionContribution;
//# sourceMappingURL=secrets.js.map