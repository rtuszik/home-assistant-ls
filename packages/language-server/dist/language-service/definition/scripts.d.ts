import { Definition } from "vscode-languageserver-protocol";
import { HomeAssistantConfiguration } from "../haConfig/haConfig";
import { DefinitionProvider } from "./definition";
export declare class ScriptDefinitionProvider implements DefinitionProvider {
    private haConfig;
    constructor(haConfig: HomeAssistantConfiguration);
    onDefinition: (line: string, _uri: string) => Promise<Definition[]>;
}
//# sourceMappingURL=scripts.d.ts.map