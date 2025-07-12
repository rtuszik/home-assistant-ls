"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesCompletionContribution = void 0;
class ServicesCompletionContribution {
    haConnection;
    static propertyMatches = ["service", "action"];
    constructor(haConnection) {
        this.haConnection = haConnection;
    }
    collectDefaultCompletions(_resource, _result) {
        return Promise.reject();
    }
    collectPropertyCompletions = async (_resource, location, _currentWord, _addValue, _isLast, result) => {
        if (location.length < 2) {
            return;
        }
        const currentNode = location[location.length - 1];
        const parentNode = location[location.length - 2]; // in case or arrays, currentNode is the indexer for the array position
        if (!ServicesCompletionContribution.propertyMatches.some((x) => x === currentNode || x === parentNode)) {
            return;
        }
        const actionsCompletions = await this.haConnection.getServiceCompletions();
        actionsCompletions.forEach((c) => {
            if (c.insertText === undefined) {
                c.insertText = c.label;
            }
            result.add(c);
        });
    };
    collectValueCompletions = async (_resource, _location, currentKey, result) => {
        if (!ServicesCompletionContribution.propertyMatches.some((x) => x === currentKey)) {
            return;
        }
        const actionsCompletions = await this.haConnection.getServiceCompletions();
        actionsCompletions.forEach((c) => {
            if (c.insertText === undefined) {
                c.insertText = c.label;
            }
            result.add(c);
        });
    };
    getInfoContribution(_resource, location) {
        return this.getActionHoverInfo(location);
    }
    async getActionHoverInfo(location) {
        try {
            // Get the current word/value at the location
            const actionId = this.extractActionIdFromLocation(location);
            if (!actionId) {
                return [];
            }
            // Get all actions from Home Assistant
            const services = await this.haConnection.getHassServices();
            if (!services) {
                return [];
            }
            // Parse domain and action name from the action ID (e.g., "light.turn_on")
            const [domain, serviceName] = actionId.split(".");
            if (!domain || !serviceName) {
                return [];
            }
            // Find the specific action
            const domainServices = services[domain];
            if (!domainServices) {
                return [];
            }
            const service = domainServices[serviceName];
            if (!service) {
                return [];
            }
            // Create hover information with action details
            const markdown = await this.createActionHoverMarkdown(domain, serviceName, service);
            return [markdown];
        }
        catch (error) {
            console.log("Error getting action hover info:", error);
            return [];
        }
    }
    extractActionIdFromLocation(location) {
        if (location.length === 0) {
            return null;
        }
        // Get the current value from the JSON path
        // The last element in the path should be the action ID value
        const currentValue = location[location.length - 1];
        if (typeof currentValue === "string" && this.isValidActionId(currentValue)) {
            return currentValue;
        }
        return null;
    }
    isValidActionId(value) {
        // Check if the value matches action ID pattern (domain.action_name)
        return /^[a-z_]+\.[a-z0-9_]+$/.test(value);
    }
    async createActionHoverMarkdown(domain, serviceName, service) {
        const actionId = `${domain}.${serviceName}`;
        // Use service.name if available, otherwise use the actionId
        const title = service.name || actionId;
        let markdown = `**${title}**\n\n`;
        // Add action description if available
        if (service.description) {
            markdown += `${service.description}\n\n`;
        }
        return markdown;
    }
}
exports.ServicesCompletionContribution = ServicesCompletionContribution;
//# sourceMappingURL=services.js.map