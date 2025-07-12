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
exports.HomeAssistantYamlFile = void 0;
const path = __importStar(require("path"));
const YAML = __importStar(require("yaml"));
const yaml_1 = require("yaml");
const vscodeUri = __importStar(require("vscode-uri"));
const dto_1 = require("./dto");
class HomeAssistantYamlFile {
    fileAccessor;
    filename;
    path;
    yaml;
    lineCounter;
    currentPath = ""; // Track current path during parsing
    includes = {};
    scripts = {};
    constructor(fileAccessor, filename, path) {
        this.fileAccessor = fileAccessor;
        this.filename = filename;
        this.path = path;
    }
    async parse() {
        const fileContents = await this.fileAccessor.getFileContents(this.filename);
        if (!fileContents) {
            return;
        }
        // Create a line counter to track positions
        this.lineCounter = new yaml_1.LineCounter();
        this.yaml = YAML.parseDocument(fileContents, {
            customTags: this.getCustomTags(),
            keepSourceTokens: true,
            lineCounter: this.lineCounter,
        });
        await this.parseAstRecursive(this.yaml.contents, this.path);
    }
    isValid = async () => {
        try {
            await this.parse();
        }
        catch (error) {
            return {
                isValid: false,
                errors: [String(error)],
            };
        }
        if (!this.yaml) {
            return {
                isValid: true,
                warnings: ["Empty YAML"],
            };
        }
        if (this.yaml.errors && this.yaml.errors.length > 0) {
            const errors = this.yaml.errors.slice(0, 3).map((x) => {
                const line = x.linePos && x.linePos[0]
                    ? ` (Line: ${x.linePos[0].line})`
                    : "";
                return `${x.name || "YAMLError"}: ${x.message}${line}`;
            });
            if (this.yaml.errors.length > 3) {
                errors.push(` - And ${this.yaml.errors.length - 3} more errors...`);
            }
            return {
                isValid: false,
                errors,
            };
        }
        return {
            isValid: true,
        };
    };
    getIncludes = async () => {
        if (!this.yaml) {
            await this.parse();
        }
        if (!this.yaml) {
            return {};
        }
        return this.includes;
    };
    getScripts = async () => {
        if (!this.yaml) {
            await this.parse();
        }
        if (!this.yaml) {
            return {};
        }
        return this.scripts;
    };
    getCustomTags() {
        return [
            "env_var",
            "input",
            "secret",
            `${dto_1.Includetype[dto_1.Includetype.include]}`,
            `${dto_1.Includetype[dto_1.Includetype.include_dir_list]}`,
            `${dto_1.Includetype[dto_1.Includetype.include_dir_merge_list]}`,
            `${dto_1.Includetype[dto_1.Includetype.include_dir_merge_named]}`,
            `${dto_1.Includetype[dto_1.Includetype.include_dir_named]}`,
        ].map((x) => ({
            tag: `!${x}`,
            resolve: (value) => value,
        }));
    }
    parseAstRecursive = async (node, currentPath) => {
        if (!node) {
            return;
        }
        // Update the current path being processed
        this.currentPath = currentPath;
        // Handle maps (objects)
        if ((0, yaml_1.isMap)(node)) {
            // Check if this is a scripts section in different formats
            if (currentPath === "configuration.yaml/script" ||
                currentPath === "configuration.yaml/homeassistant/packages/script") {
                this.collectScripts(node);
                return;
            }
            // Check for script definitions in format: script my_script:
            if (currentPath.endsWith("/script") ||
                /^configuration\.yaml\/script\s+/.test(currentPath)) {
                this.collectScripts(node);
                return;
            }
            for (const pair of node.items) {
                if ((0, yaml_1.isPair)(pair) && pair.value) {
                    const keyName = this.getKeyName(pair.key);
                    // Type guard to ensure pair.value is a Node
                    if (typeof pair.value === "object" && pair.value !== null) {
                        await this.parseAstRecursive(pair.value, `${currentPath}/${keyName}`);
                    }
                }
            }
        }
        // Handle sequences (arrays)
        else if ((0, yaml_1.isSeq)(node)) {
            for (const item of node.items) {
                if (item !== null && item !== undefined && typeof item === "object") {
                    await this.parseAstRecursive(item, currentPath);
                }
            }
        }
        // Handle scalar nodes with include tags
        else if ((0, yaml_1.isScalar)(node) && node.tag) {
            this.collectInclude(node, currentPath);
        }
    };
    getKeyName = (node) => {
        if (node.tag && node.type === "PLAIN") {
            return node.value.toString().slice(7, -1);
        }
        return node.toJSON();
    };
    getIncludeType = (str) => {
        let includeType;
        switch (str) {
            case `${dto_1.Includetype[dto_1.Includetype.include]}`:
                includeType = dto_1.Includetype.include;
                break;
            case `${dto_1.Includetype[dto_1.Includetype.include_dir_list]}`:
                includeType = dto_1.Includetype.include_dir_list;
                break;
            case `${dto_1.Includetype[dto_1.Includetype.include_dir_merge_list]}`:
                includeType = dto_1.Includetype.include_dir_merge_list;
                break;
            case `${dto_1.Includetype[dto_1.Includetype.include_dir_merge_named]}`:
                includeType = dto_1.Includetype.include_dir_merge_named;
                break;
            case `${dto_1.Includetype[dto_1.Includetype.include_dir_named]}`:
                includeType = dto_1.Includetype.include_dir_named;
                break;
            default:
                return null;
        }
        return includeType;
    };
    collectInclude(x, currentPath) {
        let value = "";
        const includeType = this.getIncludeType(`${x.tag}`.slice(1).toLowerCase());
        if (includeType === null) {
            // secrets and other tags
            return;
        }
        value = x.value.toString().replace(/\\/g, "/"); // \ to / on windows
        let files = [];
        if (includeType === dto_1.Includetype.include) {
            const relativeFilePath = this.fileAccessor.getRelativePath(this.filename, String(value));
            // single file include
            files.push(relativeFilePath);
        }
        else {
            // multiple file include
            const filesInThisFolder = this.fileAccessor.getFilesInFolderRelativeFrom(String(value), this.filename);
            files = filesInThisFolder.filter((f) => path.extname(f) === ".yaml");
        }
        if (files.length === 0) {
            console.log(`The include could not be resolved because no file(s) found in '${value}' included with '${dto_1.Includetype[includeType]}' from '${this.filename}'`);
        }
        for (const file of files) {
            const key = file.replace(/\\/g, "/");
            this.includes[key] = {
                path: currentPath,
                includeType,
                start: x.range[0],
                end: x.range[1],
            };
        }
    }
    collectScripts(node) {
        const filepath = vscodeUri.URI.file(path.resolve(this.filename)).fsPath;
        // Check if this is a direct script definition (script another_script:)
        const directScriptMatch = /^configuration\.yaml\/script\s+(.+)$/.exec(this.currentPath);
        if (directScriptMatch) {
            const scriptId = directScriptMatch[1];
            let startPos = [0, 0];
            let endPos = [0, 0];
            // For direct script definitions, try to get position from the first relevant item
            if (this.lineCounter && node.items.length > 0) {
                for (const item of node.items) {
                    if (item && item.key && typeof item.key === "object" && item.key !== null && "range" in item.key &&
                        Array.isArray(item.key.range)) {
                        const range = item.key.range;
                        const startOffset = range[0];
                        const endOffset = range[2] || range[1];
                        const startLinePos = this.lineCounter.linePos(startOffset);
                        const endLinePos = this.lineCounter.linePos(endOffset);
                        // Convert from 1-indexed to 0-indexed positions as expected by VS Code
                        startPos = [startLinePos.line - 1, startLinePos.col - 1];
                        endPos = [endLinePos.line - 1, endLinePos.col - 1];
                        break; // Use the first item with a range
                    }
                }
            }
            this.scripts[scriptId] = {
                fileUri: vscodeUri.URI.file(filepath).toString(),
                start: startPos,
                end: endPos,
            };
            return;
        }
        // Handle regular script section (script:)
        for (const item of node.items) {
            const isNamed = item.value && (0, yaml_1.isMap)(item.value);
            const filename = path.parse(filepath).base.replace(".yaml", "");
            let key;
            if (isNamed && item.key && (0, yaml_1.isScalar)(item.key)) {
                key = item.key.toJSON();
            }
            else {
                key = filename;
            }
            if ((0, yaml_1.isPair)(item)) {
                let startPos = [0, 0];
                let endPos = [0, 0];
                // Get position from range property if available and line counter exists
                if (this.lineCounter && item.key && typeof item.key === "object" && item.key !== null && "range" in item.key && Array.isArray(item.key.range)) {
                    const range = item.key.range;
                    const startOffset = range[0];
                    const endOffset = range[2] || range[1];
                    const startLinePos = this.lineCounter.linePos(startOffset);
                    const endLinePos = this.lineCounter.linePos(endOffset);
                    // Convert from 1-indexed to 0-indexed positions as expected by VS Code
                    startPos = [startLinePos.line - 1, startLinePos.col - 1];
                    endPos = [endLinePos.line - 1, endLinePos.col - 1];
                }
                this.scripts[key] = {
                    fileUri: vscodeUri.URI.file(filepath).toString(),
                    start: startPos,
                    end: endPos,
                };
            }
        }
    }
}
exports.HomeAssistantYamlFile = HomeAssistantYamlFile;
//# sourceMappingURL=haYamlFile.js.map