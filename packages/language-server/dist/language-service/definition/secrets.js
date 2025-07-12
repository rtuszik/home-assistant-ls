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
exports.SecretsDefinitionProvider = void 0;
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const YAML = __importStar(require("yaml"));
class SecretsDefinitionProvider {
    fileAccessor;
    constructor(fileAccessor) {
        this.fileAccessor = fileAccessor;
    }
    onDefinition = async (line, uri) => {
        const matches = /(.*)(!secret)\s+([a-zA-Z0-9_]+)(.*)/.exec(line);
        if (!matches || matches.length !== 5) {
            return [];
        }
        const secretName = matches[3];
        try {
            // secrets.yaml is always in the root of the project
            const secretsPath = "secrets.yaml";
            const secretsContent = await this.fileAccessor.getFileContents(secretsPath);
            if (!secretsContent) {
                console.log("No secrets.yaml file found");
                return [];
            }
            // Parse the YAML content
            const secretsDocument = YAML.parseDocument(secretsContent);
            if (!secretsDocument.contents || typeof secretsDocument.contents !== "object") {
                console.log("Invalid secrets.yaml content");
                return [];
            }
            // Find the secret key in the YAML document
            if (secretsDocument.contents && "items" in secretsDocument.contents) {
                const contents = secretsDocument.contents;
                for (const item of contents.items) {
                    if (item && item.key && typeof item.key.value === "string" && item.key.value === secretName) {
                        // Found the secret! Now get its position
                        const range = item.key.range;
                        if (range && range.length >= 2) {
                            const startOffset = range[0];
                            // Convert offset to line/character position
                            const lines = secretsContent.split("\n");
                            let currentOffset = 0;
                            let line = 0;
                            let character = 0;
                            for (let i = 0; i < lines.length; i++) {
                                const lineLength = lines[i].length + 1; // +1 for newline
                                if (currentOffset + lineLength > startOffset) {
                                    line = i;
                                    character = startOffset - currentOffset;
                                    break;
                                }
                                currentOffset += lineLength;
                            }
                            // Get the URI for secrets.yaml
                            const secretsUri = this.fileAccessor.getRelativePathAsFileUri(uri, secretsPath);
                            return [
                                vscode_languageserver_protocol_1.Location.create(secretsUri, {
                                    start: { line, character },
                                    end: { line, character: character + secretName.length },
                                }),
                            ];
                        }
                    }
                }
            }
            console.log(`Secret '${secretName}' not found in secrets.yaml`);
            return [];
        }
        catch (error) {
            console.error("Error reading secrets.yaml:", error);
            return [];
        }
    };
}
exports.SecretsDefinitionProvider = SecretsDefinitionProvider;
//# sourceMappingURL=secrets.js.map