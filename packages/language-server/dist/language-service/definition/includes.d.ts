import { Definition } from "vscode-languageserver-protocol";
import { FileAccessor } from "../fileAccessor";
import { DefinitionProvider } from "./definition";
export declare class IncludeDefinitionProvider implements DefinitionProvider {
    private fileAccessor;
    constructor(fileAccessor: FileAccessor);
    onDefinition: (line: string, uri: string) => Promise<Definition[]>;
}
//# sourceMappingURL=includes.d.ts.map