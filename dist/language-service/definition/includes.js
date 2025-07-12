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
exports.IncludeDefinitionProvider = void 0;
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const path = __importStar(require("path"));
class IncludeDefinitionProvider {
    fileAccessor;
    constructor(fileAccessor) {
        this.fileAccessor = fileAccessor;
    }
    onDefinition = async (line, uri) => {
        const matches = /(.*)(!include\S*)\s+(["'])?(.+)\3/.exec(line);
        if (!matches || matches.length !== 5) {
            return [];
        }
        const includeType = matches[2];
        const whatToInclude = `${matches[4]}`.trim();
        switch (includeType) {
            case "!include":
                // eslint-disable-next-line no-case-declarations
                const destination = this.fileAccessor.getRelativePathAsFileUri(uri, whatToInclude);
                return [
                    vscode_languageserver_protocol_1.Location.create(destination, {
                        start: { line: 0, character: 0 },
                        end: { line: 0, character: 0 },
                    }),
                ];
            case "!include_dir_list":
            case "!include_dir_named":
            case "!include_dir_merge_list":
            case "!include_dir_merge_named":
                // eslint-disable-next-line no-case-declarations
                let files = this.fileAccessor.getFilesInFolderRelativeFromAsFileUri(whatToInclude, uri);
                files = files.filter((f) => path.extname(f) === ".yaml");
                if (files.length === 0) {
                    console.warn(`There were no files found in folder '${whatToInclude}' referenced with '${includeType}' from '${uri}'`);
                }
                return files.map((f) => vscode_languageserver_protocol_1.Location.create(f, {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 0 },
                }));
            default:
                return [];
        }
    };
}
exports.IncludeDefinitionProvider = IncludeDefinitionProvider;
//# sourceMappingURL=includes.js.map