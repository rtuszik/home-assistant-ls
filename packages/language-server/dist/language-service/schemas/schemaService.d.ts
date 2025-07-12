import { HaFileInfo } from "../haConfig/dto";
export declare class SchemaServiceForIncludes {
    private mappings;
    constructor();
    getSchemaContributions(haFiles: HaFileInfo[]): any;
}
export interface PathToSchemaMapping {
    key: string;
    path: string;
    file: string;
    tsFile: string;
    fromType: string;
}
//# sourceMappingURL=schemaService.d.ts.map