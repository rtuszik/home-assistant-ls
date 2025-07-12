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
exports.StandaloneFileAccessor = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscodeUri = __importStar(require("vscode-uri"));
class StandaloneFileAccessor {
    workspaceFolder;
    documents;
    ourRoot;
    constructor(workspaceFolder, documents) {
        this.workspaceFolder = workspaceFolder;
        this.documents = documents;
        this.ourRoot = path.resolve();
    }
    async getFileContents(uri) {
        const fullUri = vscodeUri.URI.file(path.resolve(uri));
        const textDocument = this.documents.get(fullUri.toString());
        if (textDocument) {
            // open file in editor, might not be saved yet
            return textDocument.getText();
        }
        return new Promise((c, e) => {
            fs.exists(uri, (exists) => {
                if (!exists) {
                    c("");
                }
                fs.readFile(uri, "utf-8", (err, result) => {
                    if (err) {
                        e(err);
                    }
                    else {
                        c(result);
                    }
                });
            });
        });
    }
    getFilesInFolder(subFolder, filelist = []) {
        subFolder = path.normalize(subFolder);
        try {
            fs.readdirSync(subFolder).forEach((file) => {
                // ignore dot files
                if (file.charAt(0) === ".") {
                    return;
                }
                filelist =
                    fs.statSync(path.join(subFolder, file)).isDirectory() &&
                        !file.startsWith(".")
                        ? this.getFilesInFolder(path.join(subFolder, file), filelist)
                        : filelist.concat(path.join(subFolder, file));
            });
        }
        catch {
            console.log(`Cannot find the files in folder ${subFolder}`);
        }
        return filelist;
    }
    dealtWithRelativeFrom = (relativeFrom) => {
        if (relativeFrom.startsWith("file://")) {
            relativeFrom = vscodeUri.URI.parse(relativeFrom).fsPath;
        }
        else {
            if (!relativeFrom.startsWith(this.ourRoot)) {
                relativeFrom = path.resolve(relativeFrom);
            }
            relativeFrom = vscodeUri.URI.file(relativeFrom).fsPath;
        }
        return relativeFrom;
    };
    getFilesInFolderRelativeFrom(subFolder, relativeFrom) {
        relativeFrom = this.dealtWithRelativeFrom(relativeFrom);
        const dirOfFile = path.dirname(relativeFrom);
        subFolder = path.join(dirOfFile, subFolder);
        return this.getFilesInFolder(subFolder);
    }
    getFilesInFolderRelativeFromAsFileUri(subFolder, relativeFrom) {
        const files = this.getFilesInFolderRelativeFrom(subFolder, relativeFrom);
        return files.map((f) => vscodeUri.URI.file(f).toString());
    }
    getRelativePath = (relativeFrom, filename) => {
        relativeFrom = this.dealtWithRelativeFrom(relativeFrom);
        const dirOfFile = path.dirname(relativeFrom);
        const joinedPath = path.join(dirOfFile, filename);
        return joinedPath;
    };
    getRelativePathAsFileUri = (relativeFrom, filename) => vscodeUri.URI.file(this.getRelativePath(relativeFrom, filename)).toString();
    fromUriToLocalPath = (uri) => {
        const workspaceFolderUri = vscodeUri.URI.parse(this.workspaceFolder);
        const fileUri = vscodeUri.URI.parse(uri);
        let local = fileUri.fsPath.replace(workspaceFolderUri.fsPath, "");
        if (local[0] === "/" || local[0] === "\\") {
            local = local.substring(1);
        }
        return local;
    };
}
exports.StandaloneFileAccessor = StandaloneFileAccessor;
//# sourceMappingURL=fileAccessor.js.map