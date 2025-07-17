import { resolve } from "path";
import * as TJS from "typescript-json-schema";
import * as fs from "fs";
import * as path from "path";
import { PathToSchemaMapping } from "./schemaService";
import { exit } from "process";

const settings: TJS.PartialArgs = {
    required: true,
    noExtraProps: true,
};

const compilerOptions: TJS.CompilerOptions = {
    strictNullChecks: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    moduleResolution: "node",
    resolveJsonModule: true,
};

const jsonPath = path.join(__dirname, "mappings.json");
const filecontents = fs.readFileSync(jsonPath, "utf-8");

const outputFolder = path.join(__dirname, "json");

const srcDir = path.join(__dirname, "../../../src/language-service/schemas");

if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
}

if (fs.readdirSync(outputFolder).length > 0 && process.argv[2] === "--quick") {
    console.debug("Skipping schema generation because there already schema files");
} else {
    console.log("Generating schemas...");
    const pathToSchemaMappings: PathToSchemaMapping[] = JSON.parse(filecontents);

    const allFiles = pathToSchemaMappings.map((mapping) =>
        resolve(path.join(srcDir, mapping.tsFile)),
    );

    const additionalFiles = [
        resolve(path.join(srcDir, "integrations/index.d.ts")),
        resolve(path.join(srcDir, "integrations/core/index.d.ts")),
        resolve(path.join(srcDir, "integrations/custom/index.d.ts")),
        resolve(path.join(srcDir, "types.ts")),
    ].filter((file) => fs.existsSync(file));

    const program = TJS.getProgramFromFiles(
        [...new Set([...allFiles, ...additionalFiles])],
        compilerOptions,
    );

    pathToSchemaMappings.forEach((mapping) => {
        console.log(mapping.path);
        const schema = TJS.generateSchema(program, mapping.fromType, settings);
        if (schema === null) {
            console.error(`Schema generation failed for ${mapping.fromType} in ${mapping.tsFile}`);
            exit(1);
        }
        fs.writeFileSync(path.join(outputFolder, mapping.file), JSON.stringify(schema, null, 2));
    });

    console.log("Schema generation completed successfully!");
}
