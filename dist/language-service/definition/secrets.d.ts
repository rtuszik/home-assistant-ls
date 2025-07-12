import { Definition } from "vscode-languageserver-protocol";
import { FileAccessor } from "../fileAccessor";
import { DefinitionProvider } from "./definition";
export declare class SecretsDefinitionProvider implements DefinitionProvider {
    private fileAccessor;
    constructor(fileAccessor: FileAccessor);
    onDefinition: (line: string, uri: string) => Promise<Definition[]>;
}
//# sourceMappingURL=secrets.d.ts.map