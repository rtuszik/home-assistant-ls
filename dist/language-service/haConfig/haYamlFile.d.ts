import { FileAccessor } from "../fileAccessor";
import { IncludeReferences, ScriptReferences } from "./dto";
export declare class HomeAssistantYamlFile {
    private fileAccessor;
    private filename;
    path: string;
    private yaml;
    private lineCounter;
    private currentPath;
    private includes;
    private scripts;
    constructor(fileAccessor: FileAccessor, filename: string, path: string);
    private parse;
    isValid: () => Promise<ValidationResults>;
    getIncludes: () => Promise<IncludeReferences>;
    getScripts: () => Promise<ScriptReferences>;
    private getCustomTags;
    private parseAstRecursive;
    private getKeyName;
    private getIncludeType;
    private collectInclude;
    private collectScripts;
}
export interface ValidationResults {
    isValid: boolean;
    errors?: string[];
    warnings?: string[];
}
//# sourceMappingURL=haYamlFile.d.ts.map