"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UuidCompletionContribution = void 0;
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const uuid_1 = require("uuid");
class UuidCompletionContribution {
    static propertyMatches = ["unique_id", "id"];
    collectDefaultCompletions(_resource, _result) {
        return Promise.resolve(null);
    }
    collectPropertyCompletions = async (_resource, location, _currentWord, _addValue, _isLast, result) => {
        if (location.length < 2) {
            return;
        }
        const currentNode = location[location.length - 1];
        const parentNode = location[location.length - 2]; // in case of arrays, currentNode is the indexer for the array position
        if (!UuidCompletionContribution.propertyMatches.some((x) => x === currentNode ||
            (!Number.isNaN(+currentNode) && x === parentNode))) {
            return;
        }
        // Generate appropriate UUID based on the key
        const key = typeof currentNode === "string" ? currentNode : String(parentNode);
        const generatedValue = this.generateUuid(key);
        const completionItem = {
            label: "Generate unique identifier",
            kind: vscode_languageserver_protocol_1.CompletionItemKind.Function,
            insertText: generatedValue,
            detail: "Generate a random unique UUID for the property",
            documentation: {
                kind: "markdown",
                value: `Generates a proper UUID: \`${generatedValue}\``
            },
            sortText: "0000", // High priority to appear at top
        };
        result.add(completionItem);
    };
    collectValueCompletions = async (_resource, _location, currentKey, result) => {
        if (!UuidCompletionContribution.propertyMatches.some((x) => x === currentKey)) {
            return;
        }
        // Generate appropriate UUID based on the key
        const generatedValue = this.generateUuid(currentKey);
        const completionItem = {
            label: "Generate unique identifier",
            kind: vscode_languageserver_protocol_1.CompletionItemKind.Function,
            insertText: generatedValue,
            detail: "Generate a random unique UUID for the property",
            documentation: {
                kind: "markdown",
                value: `Generates a proper UUID: \`${generatedValue}\``
            },
            sortText: "0000", // High priority to appear at top
        };
        result.add(completionItem);
    };
    getInfoContribution(_resource, _location) {
        return Promise.resolve([]);
    }
    /**
     * Generate UUID v4 for any key type
     * @param _key The property key (id or unique_id) - not used but kept for interface consistency
     * @returns Generated UUID v4 string
     */
    generateUuid(_key) {
        return (0, uuid_1.v4)();
    }
}
exports.UuidCompletionContribution = UuidCompletionContribution;
//# sourceMappingURL=uuids.js.map