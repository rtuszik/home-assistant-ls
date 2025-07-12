import { JSONWorkerContribution, JSONPath, CompletionsCollector } from "vscode-json-languageservice";
import { IHaConnection } from "../home-assistant/haConnection";
export declare class DeviceCompletionContribution implements JSONWorkerContribution {
    private haConnection;
    static propertyMatches: string[];
    constructor(haConnection: IHaConnection);
    collectDefaultCompletions(_resource: string, _result: CompletionsCollector): Thenable<any>;
    collectPropertyCompletions: (_resource: string, location: JSONPath, _currentWord: string, _addValue: boolean, _isLast: boolean, result: CompletionsCollector) => Promise<any>;
    collectValueCompletions: (_resource: string, _location: JSONPath, _propertyKey: string, _result: CompletionsCollector) => Thenable<any>;
    getInfoContribution: (_resource: string, _location: JSONPath) => Thenable<any>;
}
//# sourceMappingURL=deviceIds.d.ts.map