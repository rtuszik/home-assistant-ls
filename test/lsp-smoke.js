// LSP smoke test: starts the built server over stdio, opens a fixture
// Home Assistant workspace and asserts that the core features respond:
// initialize, schema diagnostics (via !include discovery), completion and
// document symbols. Runs offline - no Home Assistant instance required.
//
// Usage: node test/lsp-smoke.js [path-to-server-entry]
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const WS = path.join(__dirname, "fixture");
const SERVER =
  process.argv[2] || path.join(__dirname, "..", "dist", "bin", "home-assistant-ls.js");

const srv = spawn("node", [SERVER, "--stdio"], {
  stdio: ["pipe", "pipe", "inherit"],
});

let buf = Buffer.alloc(0);
const received = [];
let nextId = 1;

function send(method, params, isRequest = true) {
  const msg = { jsonrpc: "2.0", method, params };
  if (isRequest) msg.id = nextId++;
  const body = Buffer.from(JSON.stringify(msg), "utf8");
  srv.stdin.write(`Content-Length: ${body.length}\r\n\r\n`);
  srv.stdin.write(body);
  return msg.id;
}

srv.stdout.on("data", (chunk) => {
  buf = Buffer.concat([buf, chunk]);
  for (;;) {
    const headerEnd = buf.indexOf("\r\n\r\n");
    if (headerEnd === -1) return;
    const header = buf.slice(0, headerEnd).toString();
    const m = header.match(/Content-Length: (\d+)/i);
    if (!m) return;
    const len = parseInt(m[1], 10);
    if (buf.length < headerEnd + 4 + len) return;
    const body = buf.slice(headerEnd + 4, headerEnd + 4 + len).toString();
    buf = buf.slice(headerEnd + 4 + len);
    received.push(JSON.parse(body));
  }
});

async function wait(pred, ms) {
  const start = Date.now();
  for (;;) {
    const hit = received.find(pred);
    if (hit) return hit;
    if (Date.now() - start > ms) return null;
    await new Promise((r) => setTimeout(r, 100));
  }
}

const failures = [];
function check(name, ok, detail) {
  console.log(`${ok ? "ok" : "FAIL"} - ${name}${detail ? `: ${detail}` : ""}`);
  if (!ok) failures.push(name);
}

(async () => {
  const rootUri = "file://" + WS;
  const autoUri = rootUri + "/automations.yaml";
  const autoText = fs.readFileSync(path.join(WS, "automations.yaml"), "utf8");

  const initId = send("initialize", {
    processId: process.pid,
    rootUri,
    workspaceFolders: [{ uri: rootUri, name: "fixture" }],
    capabilities: { textDocument: { publishDiagnostics: {} } },
  });
  const initResp = await wait((r) => r.id === initId && r.result, 20000);
  check("initialize returns capabilities", !!(initResp && initResp.result.capabilities));
  send("initialized", {}, false);

  send(
    "textDocument/didOpen",
    { textDocument: { uri: autoUri, languageId: "yaml", version: 1, text: autoText } },
    false,
  );

  const diag = await wait(
    (r) =>
      r.method === "textDocument/publishDiagnostics" &&
      r.params.uri === autoUri &&
      r.params.diagnostics.length > 0,
    30000,
  );
  const messages = diag ? diag.params.diagnostics.map((d) => d.message) : [];
  check(
    "schema diagnostic flags bad property",
    messages.some((msg) => msg.includes("triggerz")),
    JSON.stringify(messages),
  );
  check(
    "diagnostic messages are human-readable (l10n bundle loaded)",
    messages.every((msg) => !/^[A-Za-z]+Warning$/.test(msg)),
    JSON.stringify(messages),
  );

  const compId = send("textDocument/completion", {
    textDocument: { uri: autoUri },
    position: { line: 4, character: 4 },
  });
  const compResp = await wait((r) => r.id === compId, 20000);
  const items = compResp && compResp.result && (compResp.result.items || compResp.result);
  check("completion returns items", Array.isArray(items) && items.length > 0);

  const symId = send("textDocument/documentSymbol", { textDocument: { uri: autoUri } });
  const symResp = await wait((r) => r.id === symId, 10000);
  check(
    "documentSymbol returns symbols",
    !!(symResp && Array.isArray(symResp.result) && symResp.result.length > 0),
  );

  srv.kill();
  if (failures.length) {
    console.error(`\n${failures.length} smoke check(s) failed`);
    process.exit(1);
  }
  console.log("\nall smoke checks passed");
  process.exit(0);
})();
