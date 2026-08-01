/**
 * LSP surface — apples-to-apples editor-server latency for Svelte tools.
 *
 * Tools (when available):
 *   - svelte-language-server (official)
 *   - verter-lsp (experimental Svelte carrier)
 *
 * Primary metric: didOpen → first hover on a known binding.
 */

import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  readFileSync,
} from "node:fs";
import { LspClient, pathToFileUri } from "../lsp-client.mjs";
import { measureVariants, resolveBin, median } from "../timing.mjs";
import { writeEnvDTs, writeSvelteConfig, writeTsconfig } from "../fixtures.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const WARM_HOVER_N = 5;
const HOVER_ATTEMPTS = 6;
const HOVER_ATTEMPT_TIMEOUT_MS = 60_000;
const HOVER_EXPECT_SYMBOL = "benchMarker";

const LSP_TARGET = `<script lang="ts">
  const benchMarker: string = 'lsp-probe-token'
  let count = $state(0)
</script>

<div class="lsp-target">
  <p>{benchMarker}</p>
  <button type="button" onclick={() => (count += 1)}>{count}</button>
</div>
`;

function tryResolveBin(name) {
  try {
    return resolveBin(name, rootDir);
  } catch {
    return null;
  }
}

function ensureLspWorkspace(workRoot) {
  const dir = join(workRoot, "lsp-workspace");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "LspTarget.svelte"), LSP_TARGET);
  writeEnvDTs(dir);
  writeTsconfig(dir, { include: ["LspTarget.svelte", "env.d.ts"] });
  writeSvelteConfig(dir);
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ private: true, type: "module", name: "lsp-workspace" }, null, 2)}\n`,
  );
  // line 1 (0-based): `  const benchMarker: string = 'lsp-probe-token'`
  // character ~8 points at benchMarker
  const scriptPos = { line: 1, character: 8 };
  // line 6: `  <p>{benchMarker}</p>`
  const templatePos = { line: 6, character: 6 };
  writeFileSync(
    join(dir, "lsp-probe.json"),
    `${JSON.stringify({ scriptPos, templatePos, symbol: HOVER_EXPECT_SYMBOL }, null, 2)}\n`,
  );
  return { dir, scriptPos, templatePos };
}

function hoverText(result) {
  if (!result) return "";
  const contents = result.contents ?? result;
  if (typeof contents === "string") return contents;
  if (Array.isArray(contents)) {
    return contents
      .map((c) => (typeof c === "string" ? c : (c?.value ?? "")))
      .join("\n");
  }
  if (contents?.value) return contents.value;
  return JSON.stringify(contents);
}

function hoverLooksValid(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return (
    lower.includes("benchmarker") ||
    lower.includes("string") ||
    /:\s*string\b/i.test(text)
  );
}

/**
 * @param {{ name: string, command: string, args: string[], options?: object }} spawn
 */
async function measureServer(spawn, workspaceDir, filePath, positions) {
  const client = new LspClient(spawn.name, spawn.command, spawn.args, {
    cwd: workspaceDir,
    shell: spawn.options?.shell ?? false,
    env: spawn.options?.env,
  });

  try {
    const rootUri = pathToFileUri(workspaceDir);
    const initStart = performance.now();
    await client.initialize(rootUri, {
      initializationOptions: {},
      timeoutMs: 60_000,
    });
    const initMs = performance.now() - initStart;

    const source = readFileSync(filePath, "utf8");
    const uri = pathToFileUri(filePath);
    const openStart = performance.now();
    client.sendNotification("textDocument/didOpen", {
      textDocument: {
        uri,
        languageId: "svelte",
        version: 1,
        text: source,
      },
    });

    let hover = null;
    let lastError = null;
    for (let attempt = 0; attempt < HOVER_ATTEMPTS; attempt++) {
      try {
        hover = await client.sendRequest(
          "textDocument/hover",
          {
            textDocument: { uri },
            position: positions.scriptPos,
          },
          HOVER_ATTEMPT_TIMEOUT_MS,
        );
        if (hover && hoverText(hover)) break;
      } catch (error) {
        lastError = error;
        await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
      }
    }
    const openToHoverMs = performance.now() - openStart;
    if (!hover) {
      throw lastError ?? new Error("hover returned null after retries");
    }

    const text = hoverText(hover);
    const contentOk = hoverLooksValid(text);

    const warm = [];
    for (let i = 0; i < WARM_HOVER_N; i++) {
      const t0 = performance.now();
      await client.sendRequest("textDocument/hover", {
        textDocument: { uri },
        position: positions.scriptPos,
      });
      warm.push(performance.now() - t0);
    }

    let completionMs = null;
    try {
      const t0 = performance.now();
      await client.sendRequest("textDocument/completion", {
        textDocument: { uri },
        position: positions.scriptPos,
      });
      completionMs = performance.now() - t0;
    } catch {
      // optional
    }

    let definitionMs = null;
    try {
      const t0 = performance.now();
      await client.sendRequest("textDocument/definition", {
        textDocument: { uri },
        position: positions.scriptPos,
      });
      definitionMs = performance.now() - t0;
    } catch {
      // optional
    }

    let templateOk = false;
    try {
      const th = await client.sendRequest("textDocument/hover", {
        textDocument: { uri },
        position: positions.templatePos,
      });
      templateOk = hoverLooksValid(hoverText(th));
    } catch {
      templateOk = false;
    }

    return {
      ms: openToHoverMs,
      artifact: text.length,
      meta: {
        artifact: text.length,
        initMs,
        openToHoverMs,
        hoverWarmMedian: median(warm),
        completionMs,
        definitionMs,
        contentOk,
        templateOk,
        hoverSample: text.slice(0, 120),
      },
      contentOk: contentOk && templateOk,
    };
  } finally {
    try {
      await client.shutdown();
    } catch {
      // ignore
    }
  }
}

export async function runLspSurface(_fixtureDir, options) {
  const workRoot = options.workRoot;
  const {
    dir: workspaceDir,
    scriptPos,
    templatePos,
  } = ensureLspWorkspace(workRoot);
  const filePath = join(workspaceDir, "LspTarget.svelte");
  const positions = { scriptPos, templatePos };
  const bytes = readFileSync(filePath).length;

  const variants = [];

  // Official svelte-language-server
  let svelteSpawn = null;
  try {
    const pkg = require.resolve("svelte-language-server/package.json", {
      paths: [rootDir],
    });
    const binJs = join(dirname(pkg), "bin", "server.js");
    if (existsSync(binJs)) {
      svelteSpawn = {
        name: "svelte-language-server",
        command: process.execPath,
        args: [binJs, "--stdio"],
      };
    }
  } catch {
    // try bin
  }
  if (!svelteSpawn) {
    const bin =
      tryResolveBin("svelteserver") ?? tryResolveBin("svelte-language-server");
    if (bin) {
      svelteSpawn = {
        name: "svelte-language-server",
        command: bin,
        args: ["--stdio"],
        options: {
          shell: process.platform === "win32" && bin.endsWith(".cmd"),
        },
      };
    }
  }

  if (svelteSpawn) {
    variants.push({
      id: "svelte-language-server",
      label: "svelte-language-server",
      package: "svelte-language-server",
      engine: "tsc-js",
      invocation: "cli",
      threading: "1t",
      notes: "Official Svelte language server (stdio)",
      artifactLabel: "Hover bytes",
      measure: async () => {
        const out = await measureServer(
          svelteSpawn,
          workspaceDir,
          filePath,
          positions,
        );
        return {
          ms: out.ms,
          artifact: out.artifact,
          meta: out.meta,
        };
      },
    });
  } else {
    variants.push({
      id: "svelte-language-server",
      label: "svelte-language-server",
      package: "svelte-language-server",
      notes: "Package/bin not found",
      skip: true,
    });
  }

  const verterLsp = tryResolveBin("verter-lsp");
  if (verterLsp) {
    variants.push({
      id: "verter-lsp",
      label: "Verter LSP",
      package: "verter-lsp",
      engine: "tsgo",
      invocation: "cli",
      threading: "1t",
      notes:
        "verter-lsp — native server (experimental Svelte carrier when enabled)",
      artifactLabel: "Hover bytes",
      measure: async () => {
        const out = await measureServer(
          {
            name: "verter-lsp",
            command: verterLsp,
            args: ["--stdio"],
            options: {
              shell: process.platform === "win32" && verterLsp.endsWith(".cmd"),
            },
          },
          workspaceDir,
          filePath,
          positions,
        );
        return {
          ms: out.ms,
          artifact: out.artifact,
          meta: out.meta,
        };
      },
    });
  } else {
    variants.push({
      id: "verter-lsp",
      label: "Verter LSP",
      package: "verter-lsp",
      notes: "Binary not found",
      skip: true,
    });
  }

  const measured = await measureVariants(variants, {
    runs: options.runs,
    warmups: options.warmups,
    fileCount: 1,
  });

  for (const row of measured) {
    if (row.status !== "ok") continue;
    const metas = row.metaSamples ?? [];
    const anyBad = metas.some(
      (m) => m.contentOk === false || m.templateOk === false,
    );
    if (anyBad && metas.length) {
      row.status = "unranked";
      row.throughput = "n/a";
      row.notes =
        `${row.notes ?? ""} | ⚠ FAILED VALIDATION — hover content gate`.trim();
    } else if (metas[0]) {
      const m = metas[0];
      row.notes =
        `${row.notes ?? ""} | init=${m.initMs?.toFixed?.(0) ?? "?"}ms · open→hover=${m.openToHoverMs?.toFixed?.(0) ?? "?"}ms · hoverWarm=${m.hoverWarmMedian?.toFixed?.(0) ?? "?"}ms`.trim();
    }
  }

  return {
    id: "lsp",
    label: "LSP (editor language server)",
    files: 1,
    bytes,
    variants: measured,
    methodology: [
      "Identical workspace, LspTarget.svelte, UTF-16 hover position on benchMarker.",
      "Hover content gated on script position and template {benchMarker}.",
      "Fresh language-server process per measured run.",
      "Primary ranking column: didOpen→hover latency (median of warmed runs).",
      "VS Code extension host overhead is NOT measured — only stdio LSP.",
    ],
  };
}
