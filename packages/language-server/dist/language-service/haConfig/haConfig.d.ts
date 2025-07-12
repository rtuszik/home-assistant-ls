import { FileAccessor } from "../fileAccessor";
import { HomeAssistantYamlFile } from "./haYamlFile";
import { ScriptReferences, HaFileInfo, IncludeReferences } from "./dto";
export declare class HomeAssistantConfiguration {
    private fileAccessor;
    private files;
    private subFolder;
    constructor(fileAccessor: FileAccessor);
    getFileAccessor(): FileAccessor;
    getAllFiles: () => HaFileInfo[];
    updateFile: (uri: string) => Promise<FileUpdateResult>;
    getIncludes: () => Promise<IncludeReferences>;
    getScripts: () => Promise<ScriptReferences>;
    private getRootFiles;
    discoverFiles: () => Promise<void>;
    private discoverCore;
}
export interface FilesCollection {
    [filename: string]: HomeAssistantYamlFile;
}
export interface FileUpdateResult {
    isValidYaml: boolean;
    newFilesFound: boolean;
}
//# sourceMappingURL=haConfig.d.ts.map