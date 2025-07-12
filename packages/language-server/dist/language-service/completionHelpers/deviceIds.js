"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceCompletionContribution = void 0;
class DeviceCompletionContribution {
    haConnection;
    static propertyMatches = ["device_id", "device"];
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
        if (!DeviceCompletionContribution.propertyMatches.some((x) => x === currentNode ||
            (!Number.isNaN(+currentNode) && x === parentNode))) {
            return;
        }
        const deviceCompletions = await this.haConnection.getDeviceCompletions();
        deviceCompletions.forEach((c) => {
            if (c.insertText === undefined) {
                c.insertText = c.label;
            }
            result.add(c);
        });
    };
    collectValueCompletions = (_resource, _location, _propertyKey, _result) => {
        return Promise.resolve(null);
    };
    getInfoContribution = (_resource, _location) => {
        return Promise.resolve(null);
    };
}
exports.DeviceCompletionContribution = DeviceCompletionContribution;
//# sourceMappingURL=deviceIds.js.map