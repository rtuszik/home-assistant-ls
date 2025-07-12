import { MarkedString } from "vscode-languageserver-protocol";
import { JSONWorkerContribution, JSONPath, CompletionsCollector } from "vscode-json-languageservice";
export declare class UuidCompletionContribution implements JSONWorkerContribution {
    static propertyMatches: string[];
    collectDefaultCompletions(_resource: string, _result: CompletionsCollector): Thenable<any>;
    collectPropertyCompletions: (_resource: string, location: JSONPath, _currentWord: string, _addValue: boolean, _isLast: boolean, result: CompletionsCollector) => Promise<any>;
    collectValueCompletions: (_resource: string, _location: JSONPath, currentKey: string, result: CompletionsCollector) => Promise<any>;
    getInfoContribution(_resource: string, _location: JSONPath): Thenable<MarkedString[]>;
    /**
     * Generate UUID v4 for any key type
     * @param _key The property key (id or unique_id) - not used but kept for interface consistency
     * @returns Generated UUID v4 string
     */
    generateUuid(_key: string): string;
}
//# sourceMappingURL=uuids.d.ts.map