export declare enum Includetype {
    include = 0,
    include_dir_list = 1,
    include_dir_named = 2,
    include_dir_merge_list = 3,
    include_dir_merge_named = 4
}
export interface HaFileInfo {
    filename: string;
    path: string;
}
export interface IncludeReferences {
    [filename: string]: {
        path: string;
        includeType: Includetype;
        start: number;
        end: number;
    };
}
export interface ScriptReferences {
    [scriptFilename: string]: {
        fileUri: string;
        start: [number, number];
        end: [number, number];
    };
}
export interface YamlIncludePlaceholder {
    isInclude: boolean;
    fromFile: string;
    includeType: Includetype;
    toFileOrFolder: string;
    start: number;
    end: number;
}
//# sourceMappingURL=dto.d.ts.map