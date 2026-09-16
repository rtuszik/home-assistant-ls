const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { URI } = require("vscode-uri");
const { StandaloneFileAccessor } = require("../dist/fileAccessor");
const {
  HomeAssistantConfiguration,
} = require("../dist/language-service/src/haConfig/haConfig");

async function main() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "home-assistant-ls-"));

  try {
    fs.mkdirSync(path.join(workspace, "includes"));
    fs.writeFileSync(path.join(workspace, "configuration.yaml"), "homeassistant:\n");
    fs.writeFileSync(path.join(workspace, "includes", "lights.yaml"), "[]\n");

    const accessor = new StandaloneFileAccessor(URI.file(workspace).toString(), {
      get: () => undefined,
    });

    const discovered = await accessor.getFilesInFolder("");
    assert.deepStrictEqual(discovered.sort(), [
      path.join(workspace, "configuration.yaml"),
      path.join(workspace, "includes", "lights.yaml"),
    ]);

    const configurationUri = URI.file(
      path.join(workspace, "configuration.yaml"),
    ).toString();
    assert.strictEqual(
      accessor.fromUriToLocalPath(configurationUri),
      path.join(workspace, "configuration.yaml"),
    );
    assert.strictEqual(
      await accessor.getFileContents("configuration.yaml"),
      "homeassistant:\n",
    );

    const included = await accessor.getFilesInFolderRelativeFrom(
      "includes",
      "configuration.yaml",
    );
    assert.deepStrictEqual(included, [path.join(workspace, "includes", "lights.yaml")]);

    const configuration = new HomeAssistantConfiguration(accessor);
    await configuration.discoverFiles();
    assert.deepStrictEqual(await configuration.updateFile(configurationUri), {
      isValidYaml: true,
      newFilesFound: false,
    });
    configuration.removeFile(configurationUri);
    assert.deepStrictEqual(await configuration.updateFile(configurationUri), {
      isValidYaml: true,
      newFilesFound: true,
    });

    console.log("ok - discovery, updates, and removals use consistent paths");
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
