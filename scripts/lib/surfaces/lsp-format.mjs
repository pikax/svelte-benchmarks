import { createRequire } from "node:module";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LspClient, pathToFileUri } from "../lsp-client.mjs";
import { measureVariants, resolveBin } from "../timing.mjs";
import { writeEnvDTs, writeSvelteConfig, writeTsconfig } from "../fixtures.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const SOURCE = `<script lang="ts">let { value = 1 }: { value?: number } = $props()</script>
<div class="outer"><span>{value}</span><button onclick={() => value++}>add</button></div>
`;

function tryResolveBin(name) {
  try {
    return resolveBin(name, rootDir);
  } catch {
    return null;
  }
}

function officialSpawn() {
  try {
    const pkg = require.resolve("svelte-language-server/package.json", {
      paths: [rootDir],
    });
    const server = join(dirname(pkg), "bin", "server.js");
    if (existsSync(server)) {
      return {
        name: "svelte-language-server",
        command: process.execPath,
        args: [server, "--stdio"],
      };
    }
  } catch {
    // fall through to package bin
  }
  const bin =
    tryResolveBin("svelteserver") ?? tryResolveBin("svelte-language-server");
  return bin
    ? {
        name: "svelte-language-server",
        command: bin,
        args: ["--stdio"],
        shell: process.platform === "win32" && bin.endsWith(".cmd"),
      }
    : null;
}

function packageSpawn(binName, label) {
  const bin = tryResolveBin(binName);
  return bin
    ? {
        name: label,
        command: bin,
        args: ["--stdio"],
        shell: process.platform === "win32" && bin.endsWith(".cmd"),
      }
    : null;
}

function offsetAt(text, position) {
  const lines = text.split("\n");
  let offset = 0;
  for (let line = 0; line < position.line; line++)
    offset += lines[line].length + 1;
  return offset + position.character;
}

function applyEdits(text, edits) {
  const sorted = [...edits].sort(
    (a, b) => offsetAt(text, b.range.start) - offsetAt(text, a.range.start),
  );
  let output = text;
  for (const edit of sorted) {
    const start = offsetAt(text, edit.range.start);
    const end = offsetAt(text, edit.range.end);
    output = `${output.slice(0, start)}${edit.newText}${output.slice(end)}`;
  }
  return output;
}

function formattingGate(output) {
  const changed = output !== SOURCE;
  const markupExpanded = /<div class="outer">\s*\n\s*<span>/.test(output);
  const scriptExpanded = /<script lang="ts">\s*\n/.test(output);
  return {
    ok: changed && markupExpanded && scriptExpanded,
    detail: `changed=${changed} script=${scriptExpanded} markup=${markupExpanded}`,
  };
}

function prepareWorkspace(workRoot) {
  const dir = join(workRoot, "lsp-format-workspace");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "FormatTarget.svelte"), SOURCE);
  writeEnvDTs(dir);
  writeTsconfig(dir, { include: ["FormatTarget.svelte", "env.d.ts"] });
  writeSvelteConfig(dir);
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ name: "svelte-bench-lsp-format", private: true, type: "module" }, null, 2)}\n`,
  );
  return dir;
}

async function requestFormatting(spawn, workspaceDir) {
  const client = new LspClient(spawn.name, spawn.command, spawn.args, {
    cwd: workspaceDir,
    shell: spawn.shell ?? false,
  });
  try {
    await client.initialize(pathToFileUri(workspaceDir), { timeoutMs: 60_000 });
    const file = join(workspaceDir, "FormatTarget.svelte");
    const uri = pathToFileUri(file);
    const source = readFileSync(file, "utf8");
    client.sendNotification("textDocument/didOpen", {
      textDocument: { uri, languageId: "svelte", version: 1, text: source },
    });
    const started = performance.now();
    const edits = await client.sendRequest(
      "textDocument/formatting",
      { textDocument: { uri }, options: { tabSize: 2, insertSpaces: true } },
      60_000,
    );
    const ms = performance.now() - started;
    const output = applyEdits(source, Array.isArray(edits) ? edits : []);
    return { ms, output, edits: Array.isArray(edits) ? edits.length : 0 };
  } finally {
    try {
      await client.shutdown();
    } catch {
      // ignore shutdown failures after a completed request
    }
  }
}

export async function runLspFormatSurface(_fixtureDir, options) {
  const workspaceDir = prepareWorkspace(options.workRoot);
  const candidates = [
    {
      id: "svelte-ls-format",
      label: "svelte-language-server",
      package: "svelte-language-server",
      spawn: officialSpawn(),
    },
    {
      id: "rsvelte-ls-format",
      label: "rsvelte-language-server",
      package: "@rsvelte/language-server",
      spawn: packageSpawn("rsvelte-language-server", "rsvelte-language-server"),
    },
    {
      id: "verter-ls-format",
      label: "Verter LSP",
      package: "verter-lsp",
      spawn: packageSpawn("verter-lsp", "verter-lsp"),
    },
  ];
  const variants = [];

  for (const candidate of candidates) {
    if (!candidate.spawn) {
      variants.push({
        id: candidate.id,
        label: candidate.label,
        package: candidate.package,
        skip: true,
        notes: "Package binary not found",
      });
      continue;
    }
    let gate;
    try {
      const probe = await requestFormatting(candidate.spawn, workspaceDir);
      gate = formattingGate(probe.output);
    } catch (error) {
      gate = {
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
    variants.push({
      id: candidate.id,
      label: candidate.label,
      package: candidate.package,
      threading: "server",
      invocation: "cli",
      artifactLabel: "Formatted bytes",
      unranked: !gate.ok,
      notes: `Fresh stdio server; didOpen→formatting | gate: ${gate.ok ? "✓" : "✗"} ${gate.detail}`,
      measure: async () => {
        const result = await requestFormatting(candidate.spawn, workspaceDir);
        return { ms: result.ms, artifact: result.output.length };
      },
    });
  }

  return {
    id: "lsp-format",
    label: "LSP formatting",
    files: 1,
    bytes: Buffer.byteLength(SOURCE),
    variants: await measureVariants(variants, {
      runs: options.runs,
      warmups: options.warmups,
      fileCount: 1,
    }),
    methodology: [
      "This surface exists separately from hover: rsvelte-language-server implements formatting and lint diagnostics, not TypeScript hover.",
      "Every pass starts a fresh stdio server, opens the same valid Svelte 5 component, and times textDocument/formatting.",
      "The output must rewrite both script and nested markup; a server that returns no edits or formats only one region is unranked.",
      "Server initialization is completed before the primary interval and is therefore not included in didOpen→formatting.",
    ],
  };
}
