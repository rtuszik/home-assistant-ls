import { MarkedString } from "vscode-languageserver-protocol";
import { JSONWorkerContribution, JSONPath, CompletionsCollector } from "vscode-json-languageservice";
import { IHaConnection } from "../home-assistant/haConnection";
export declare class EntityIdCompletionContribution implements JSONWorkerContribution {
    private haConnection;
    static propertyMatches: string[];
    constructor(haConnection: IHaConnection);
    collectDefaultCompletions(_resource: string, _result: CompletionsCollector): Thenable<any>;
    collectPropertyCompletions: (_resource: string, location: JSONPath, _currentWord: string, _addValue: boolean, _isLast: boolean, result: CompletionsCollector) => Promise<any>;
    collectValueCompletions: (_resource: string, _location: JSONPath, currentKey: string, result: CompletionsCollector) => Promise<any>;
    getInfoContribution(_resource: string, location: JSONPath): Thenable<MarkedString[]>;
    private getEntityHoverInfo;
    private extractEntityIdFromLocation;
    private isValidEntityId;
    private createEntityHoverMarkdown;
    private getAreaName;
    private getFloorName;
    private getDeviceForEntity;
}
//# sourceMappingURL=entityIds.d.ts.map