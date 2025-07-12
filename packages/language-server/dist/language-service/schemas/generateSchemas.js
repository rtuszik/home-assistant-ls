"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const TJS = __importStar(require("typescript-json-schema"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const process_1 = require("process");
const settings = {
    required: true,
    noExtraProps: true,
};
const compilerOptions = {
    strictNullChecks: true,
};
const jsonPath = path.join(__dirname, "mappings.json");
const filecontents = fs.readFileSync(jsonPath, "utf-8");
const outputFolder = path.join(__dirname, "json");
if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
}
if (fs.readdirSync(outputFolder).length > 0 && process.argv[2] === "--quick") {
    console.debug("Skipping schema generation because there already schema files");
}
else {
    console.log("Generating schemas...");
    const pathToSchemaMappings = JSON.parse(filecontents);
    pathToSchemaMappings.forEach((mapping) => {
        console.log(mapping.path);
        const program = TJS.getProgramFromFiles([(0, path_1.resolve)(path.join(__dirname, mapping.tsFile))], compilerOptions);
        const schema = TJS.generateSchema(program, mapping.fromType, settings);
        if (schema === null) {
            console.error("Schema generation failed");
            (0, process_1.exit)(1);
        }
        fs.writeFileSync(path.join(outputFolder, mapping.file), JSON.stringify(schema));
    });
}
//# sourceMappingURL=generateSchemas.js.map