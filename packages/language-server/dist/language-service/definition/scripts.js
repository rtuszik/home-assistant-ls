"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptDefinitionProvider = void 0;
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
class ScriptDefinitionProvider {
    haConfig;
    constructor(haConfig) {
        this.haConfig = haConfig;
    }
    onDefinition = async (line, _uri) => {
        const matches = /(.*)(script\.([\S]*))([\s]*)*(.*)/.exec(line);
        if (!matches || matches.length !== 6) {
            return [];
        }
        const scripts = await this.haConfig.getScripts();
        const scriptName = matches[3].replace(":", ""); // might be possible in regex!?
        const ourScript = scripts[scriptName];
        if (!ourScript) {
            return [];
        }
        return [
            vscode_languageserver_protocol_1.Location.create(ourScript.fileUri, {
                start: { line: ourScript.start[0], character: ourScript.start[1] },
                end: { line: ourScript.end[0], character: ourScript.end[1] },
            }),
        ];
    };
}
exports.ScriptDefinitionProvider = ScriptDefinitionProvider;
//# sourceMappingURL=scripts.js.map