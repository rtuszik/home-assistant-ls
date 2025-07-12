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
exports.HomeAssistantConfiguration = void 0;
const path = __importStar(require("path"));
const haYamlFile_1 = require("./haYamlFile");
class HomeAssistantConfiguration {
    fileAccessor;
    files;
    subFolder = "";
    constructor(fileAccessor) {
        this.fileAccessor = fileAccessor;
        this.files = {};
    }
    getFileAccessor() {
        return this.fileAccessor;
    }
    getAllFiles = () => {
        const allFiles = [];
        for (const [filename, yamlFile] of Object.entries(this.files)) {
            allFiles.push({
                filename,
                path: yamlFile.path,
            });
        }
        return allFiles;
    };
    updateFile = async (uri) => {
        const filename = this.fileAccessor.fromUriToLocalPath(uri);
        let ourFile = this.files[filename];
        if (!ourFile) {
            return {
                isValidYaml: true,
                newFilesFound: true,
            };
        }
        const homeAssistantYamlFile = new haYamlFile_1.HomeAssistantYamlFile(this.fileAccessor, filename, ourFile.path);
        this.files[filename] = homeAssistantYamlFile;
        const validationResult = await homeAssistantYamlFile.isValid();
        if (!validationResult.isValid) {
            return {
                isValidYaml: false,
                newFilesFound: false,
            };
        }
        const files = await this.discoverCore(filename, ourFile.path, {});
        if (files !== undefined) {
            ourFile = files[filename];
            this.files[filename] = ourFile;
            for (const file in files) {
                if (!this.files[file]) {
                    return {
                        isValidYaml: true,
                        newFilesFound: true,
                    };
                }
            }
        }
        return {
            isValidYaml: true,
            newFilesFound: false,
        };
    };
    getIncludes = async () => {
        let results = [];
        for (const file of Object.values(this.files)) {
            results.push(file.getIncludes());
        }
        results = await Promise.all(results);
        let allIncludes = {};
        for (const result of results) {
            allIncludes = { ...allIncludes, ...result };
        }
        return allIncludes;
    };
    getScripts = async () => {
        let results = [];
        for (const filename of Object.keys(this.files)) {
            results.push(this.files[filename].getScripts());
        }
        results = await Promise.all(results);
        let allScripts = {};
        for (const result of results) {
            allScripts = { ...allScripts, ...result };
        }
        return allScripts;
    };
    getRootFiles = () => {
        const filesInRoot = this.fileAccessor.getFilesInFolder("");
        const ourFiles = [
            "configuration.yaml",
            "ui-lovelace.yaml",
            "automations.yaml",
        ];
        const ourFolders = [
            path.join("blueprints", "automation") + path.sep,
            path.join("blueprints", "script") + path.sep,
            "automations" + path.sep,
            "custom_sentences" + path.sep,
        ];
        const rootFiles = ourFiles.filter((f) => filesInRoot.some((y) => y === f));
        const subfolderFiles = filesInRoot.filter((f) => ourFolders.some((y) => f.startsWith(y)));
        const files = [...rootFiles, ...subfolderFiles];
        if (files.length === 0) {
            const areOurFilesSomehwere = filesInRoot.filter((f) => ourFiles.some((ourFile) => f.endsWith(ourFile)));
            if (areOurFilesSomehwere.length > 0) {
                this.subFolder = areOurFilesSomehwere[0].substr(0, areOurFilesSomehwere[0].lastIndexOf(path.sep));
                return areOurFilesSomehwere;
            }
        }
        return files.map((x) => path.join(this.subFolder, x));
    };
    discoverFiles = async () => {
        const rootFiles = this.getRootFiles();
        let results = [];
        for (const rootFile of rootFiles) {
            results.push(this.discoverCore(rootFile, rootFile.substring(this.subFolder.length), this.files));
        }
        results = await Promise.all(results);
        const result = results.pop();
        if (result !== undefined) {
            this.files = result;
        }
    };
    discoverCore = async (filename, dirPath, files) => {
        if (dirPath.startsWith(path.sep)) {
            dirPath = dirPath.substring(1);
        }
        const homeAssistantYamlFile = new haYamlFile_1.HomeAssistantYamlFile(this.fileAccessor, filename, dirPath);
        files[filename] = homeAssistantYamlFile;
        let error = false;
        let errorMessage = `File '${filename}' could not be parsed, it was referenced from path '${dirPath}'.This file will be ignored.`;
        let includes = {};
        try {
            includes = await homeAssistantYamlFile.getIncludes();
        }
        catch (err) {
            error = true;
            errorMessage += ` Error message: ${err}`;
        }
        const validationResult = await homeAssistantYamlFile.isValid();
        if (!validationResult.isValid) {
            error = true;
            if (validationResult.errors && validationResult.errors.length > 0) {
                errorMessage += " Error(s): ";
                validationResult.errors.forEach((e) => (errorMessage += `\r\n - ${e}`));
            }
        }
        if (validationResult.warnings && validationResult.warnings.length > 0) {
            // validationResult.warnings.forEach(w => console.debug(`Warning parsing file ${filename}: ${w}`));
        }
        if (error) {
            if (filename === dirPath) {
                // root file has more impact
                console.warn(errorMessage);
            }
            else {
                console.log(errorMessage);
            }
            return files;
        }
        const results = [];
        for (const [filenameKey, include] of Object.entries(includes)) {
            if (Object.keys(files).some((x) => x === filenameKey)) {
                /// we already know this file
                continue;
            }
            results.push(this.discoverCore(filenameKey, include.path, files));
        }
        const fileCollections = await Promise.all(results);
        return fileCollections[fileCollections.length - 1];
    };
}
exports.HomeAssistantConfiguration = HomeAssistantConfiguration;
//# sourceMappingURL=haConfig.js.map