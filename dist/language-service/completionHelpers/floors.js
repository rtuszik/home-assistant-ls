"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FloorCompletionContribution = void 0;
class FloorCompletionContribution {
    haConnection;
    static propertyMatches = ["floor_id", "floor"];
    constructor(haConnection) {
        this.haConnection = haConnection;
    }
    collectDefaultCompletions(_resource, _result) {
        return Promise.resolve(null);
    }
    collectPropertyCompletions = async (_resource, location, _currentWord, _addValue, _isLast, result) => {
        if (location.length < 2) {
            return;
        }
        const currentNode = location[location.length - 1];
        const parentNode = location[location.length - 2]; // in case or arrays, currentNode is the indexer for the array position
        if (!FloorCompletionContribution.propertyMatches.some((x) => x === currentNode ||
            (!Number.isNaN(+currentNode) && x === parentNode))) {
            return;
        }
        const floorCompletions = await this.haConnection.getFloorCompletions();
        floorCompletions.forEach((c) => {
            if (c.insertText === undefined) {
                c.insertText = c.label;
            }
            result.add(c);
        });
    };
    collectValueCompletions = async (_resource, _location, currentKey, result) => {
        if (!FloorCompletionContribution.propertyMatches.some((x) => x === currentKey)) {
            return;
        }
        const floorCompletions = await this.haConnection.getFloorCompletions();
        floorCompletions.forEach((c) => {
            if (c.insertText === undefined) {
                c.insertText = c.label;
            }
            result.add(c);
        });
    };
    getInfoContribution(_resource, _location) {
        return Promise.resolve([]);
    }
}
exports.FloorCompletionContribution = FloorCompletionContribution;
//# sourceMappingURL=floors.js.map