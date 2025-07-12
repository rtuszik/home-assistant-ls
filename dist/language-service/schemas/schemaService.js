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
exports.SchemaServiceForIncludes = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class SchemaServiceForIncludes {
    mappings;
    constructor() {
        const jsonPathMappings = path.join(__dirname, "mappings.json");
        const mappingFileContents = fs.readFileSync(jsonPathMappings, "utf-8");
        this.mappings = JSON.parse(mappingFileContents);
        this.mappings.forEach((mapping) => {
            const jsonPath = path.join(__dirname, "json", mapping.file);
            const filecontents = fs.readFileSync(jsonPath, "utf-8");
            const schema = JSON.parse(filecontents);
            mapping.schema = schema;
        });
    }
    getSchemaContributions(haFiles) {
        const results = [];
        for (const [sourceFile, sourceFileMapping] of haFiles.entries()) {
            let sourceFileMappingPath = sourceFileMapping.path.replace(path.join("homeassistant", "packages") + path.sep, "");
            sourceFileMappingPath = sourceFileMappingPath.replace(/cards(\/|\\)cards/g, "cards");
            if (sourceFileMappingPath.startsWith(path.join("blueprints", "automation") + path.sep)) {
                sourceFileMappingPath = "blueprints/automation";
            }
            if (sourceFileMappingPath.startsWith(path.join("blueprints", "script") + path.sep)) {
                sourceFileMappingPath = "blueprints/script";
            }
            if (sourceFileMappingPath.startsWith("automations" + path.sep) ||
                sourceFileMappingPath === "automations.yaml") {
                sourceFileMappingPath = "configuration.yaml/automation";
            }
            if (sourceFileMappingPath.startsWith("groups" + path.sep) ||
                sourceFileMappingPath === "groups.yaml") {
                sourceFileMappingPath = "configuration.yaml/group";
            }
            if (sourceFileMappingPath.startsWith("custom_sentences" + path.sep)) {
                sourceFileMappingPath = "custom_sentences.yaml";
            }
            const relatedPathToSchemaMapping = this.mappings.find((x) => x.path === sourceFileMappingPath);
            if (relatedPathToSchemaMapping) {
                const id = `http://schemas.home-assistant.io/${relatedPathToSchemaMapping.key}`;
                let absolutePath = fs.realpathSync.native(haFiles[sourceFile].filename);
                absolutePath = absolutePath.replace(/\\/g, "/");
                const fileass = encodeURI(absolutePath);
                let resultEntry = results.find((x) => x.uri === id);
                console.log(`Assigning ${fileass} the ${relatedPathToSchemaMapping.path} schema`);
                if (!resultEntry) {
                    resultEntry = {
                        uri: id,
                        fileMatch: [fileass],
                        schema: relatedPathToSchemaMapping.schema,
                    };
                    results.push(resultEntry);
                }
                else if (resultEntry.fileMatch !== undefined) {
                    resultEntry.fileMatch.push(fileass);
                }
            }
        }
        return results;
    }
}
exports.SchemaServiceForIncludes = SchemaServiceForIncludes;
//# sourceMappingURL=schemaService.js.map