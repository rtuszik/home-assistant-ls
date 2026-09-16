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
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const vscodeUri = __importStar(require("vscode-uri"));
class StandaloneFileAccessor {
    workspaceFolder;
    documents;
    workspacePath;
    constructor(workspaceFolder, documents) {
        this.workspaceFolder = workspaceFolder;
        this.documents = documents;
        // Convert workspace URI to file system path
        this.workspacePath = vscodeUri.URI.parse(workspaceFolder).fsPath;
    }
    async getFileContents(uri) {
        const filePath = path.isAbsolute(uri)
            ? uri
            : path.resolve(this.workspacePath, uri);
        const fullUri = vscodeUri.URI.file(filePath);
        const textDocument = this.documents.get(fullUri.toString());
        if (textDocument) {
            // open file in editor, might not be saved yet
            return textDocument.getText();
        }
        try {
            const result = await fs.readFile(filePath, "utf-8");
            return result;
        }
        catch (err) {
            if (err.code === "ENOENT") {
                return null;
            }
            else {
                throw err;
            }
        }
    }
    async getFilesInFolder(subFolder) {
        return await this.getAbsoluteFilesInFolder(subFolder);
    }
    async getAbsoluteFilesInFolder(subFolder, filelist = [], visitedDirs = new Set()) {
        // Resolve subfolder relative to workspace path
        const resolvedSubFolder = path.isAbsolute(subFolder)
            ? subFolder
            : path.join(this.workspacePath, subFolder);
        const normalizedSubFolder = path.normalize(resolvedSubFolder);
        // Get the real path to detect symlink loops
        let realPath;
        try {
            realPath = await fs.realpath(normalizedSubFolder);
        }
        catch {
            // If we can't resolve the real path, skip this directory
            console.log(`Cannot resolve real path for ${normalizedSubFolder}`);
            return filelist;
        }
        // Check if we've already visited this directory (prevents infinite loops)
        if (visitedDirs.has(realPath)) {
            console.log(`Skipping already visited directory: ${normalizedSubFolder} (real path: ${realPath})`);
            return filelist;
        }
        // Mark this directory as visited
        visitedDirs.add(realPath);
        try {
            const files = await fs.readdir(normalizedSubFolder);
            for (const file of files) {
                // ignore dot files
                if (file.charAt(0) === ".") {
                    continue;
                }
                const filePath = path.join(normalizedSubFolder, file);
                // Use lstat to not follow symlinks automatically
                let stat;
                try {
                    stat = await fs.lstat(filePath);
                }
                catch {
                    // Skip files we can't stat
                    continue;
                }
                if (stat.isSymbolicLink()) {
                    // For symlinks, check if they point to a directory
                    try {
                        const targetStat = await fs.stat(filePath);
                        if (targetStat.isDirectory()) {
                            // Recursively scan, but with visited directory tracking
                            filelist = await this.getAbsoluteFilesInFolder(filePath, filelist, visitedDirs);
                        }
                        else {
                            // It's a file symlink, add it to the list
                            filelist = filelist.concat(filePath);
                        }
                    }
                    catch {
                        // Broken symlink or permission issue, skip it
                        console.log(`Skipping broken or inaccessible symlink: ${filePath}`);
                    }
                }
                else if (stat.isDirectory() && !file.startsWith(".")) {
                    filelist = await this.getAbsoluteFilesInFolder(filePath, filelist, visitedDirs);
                }
                else if (stat.isFile()) {
                    filelist = filelist.concat(filePath);
                }
            }
        }
        catch {
            console.log(`Cannot find the files in folder ${normalizedSubFolder}`);
        }
        return filelist;
    }
    dealtWithRelativeFrom = (relativeFrom) => {
        if (relativeFrom.startsWith("file://")) {
            relativeFrom = vscodeUri.URI.parse(relativeFrom).fsPath;
        }
        else if (!path.isAbsolute(relativeFrom)) {
            relativeFrom = path.resolve(this.workspacePath, relativeFrom);
        }
        return vscodeUri.URI.file(relativeFrom).fsPath;
    };
    async getFilesInFolderRelativeFrom(subFolder, relativeFrom) {
        relativeFrom = this.dealtWithRelativeFrom(relativeFrom);
        const dirOfFile = path.dirname(relativeFrom);
        subFolder = path.join(dirOfFile, subFolder);
        return await this.getAbsoluteFilesInFolder(subFolder);
    }
    async getFilesInFolderRelativeFromAsFileUri(subFolder, relativeFrom) {
        const files = await this.getFilesInFolderRelativeFrom(subFolder, relativeFrom);
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
        return vscodeUri.URI.parse(uri).fsPath;
    };
}
exports.StandaloneFileAccessor = StandaloneFileAccessor;
//# sourceMappingURL=fileAccessor.js.map