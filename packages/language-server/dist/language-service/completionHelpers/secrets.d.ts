import { MarkedString } from "vscode-languageserver-protocol";
import { JSONWorkerContribution, JSONPath, CompletionsCollector } from "vscode-json-languageservice";
import { CompletionItem } from "vscode-languageserver-protocol";
import { FileAccessor } from "../fileAccessor";
export declare class SecretsCompletionContribution implements JSONWorkerContribution {
    private fileAccessor;
    static propertyMatches: string[];
    constructor(fileAccessor: FileAccessor);
    collectDefaultCompletions(_resource: string, _result: CompletionsCollector): Thenable<any>;
    collectPropertyCompletions: (_resource: string, _location: JSONPath, _currentWord: string, _addValue: boolean, _isLast: boolean, _result: CompletionsCollector) => Promise<any>;
    collectValueCompletions: (_resource: string, _location: JSONPath, _currentKey: string, _result: CompletionsCollector) => Promise<any>;
    getInfoContribution(_resource: string, _location: JSONPath): Thenable<MarkedString[]>;
    /**
     * Get secrets completions by reading and parsing the secrets.yaml file
     */
    getSecretsCompletions(): Promise<CompletionItem[]>;
    /**
     * Get all available secret keys from the secrets.yaml file
     */
    getAvailableSecrets(): Promise<string[]>;
}
//# sourceMappingURL=secrets.d.ts.map