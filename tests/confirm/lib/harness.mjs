/** Minimal confirmation-suite harness. Nothing here is timed or ranked. */

export function createSuite(name) {
  const results = [];
  return {
    name,
    results,
    pass: (caseId, tool, message = "") =>
      results.push({ suite: name, caseId, tool, status: "pass", message }),
    fail: (caseId, tool, message = "") =>
      results.push({
        suite: name,
        caseId,
        tool,
        status: "fail",
        message: String(message).slice(0, 600),
      }),
    skip: (caseId, tool, message) =>
      results.push({ suite: name, caseId, tool, status: "skip", message }),
    /**
     * `warn` is extra harness behaviour for one tool (not a pass, not a fail).
     * It must never be used to hide a silent config special-case — an
     * unexpected pass/fail goes through the known-failure allowlist instead.
     */
    warn: (caseId, tool, message) =>
      results.push({ suite: name, caseId, tool, status: "warn", message }),
    run: async (caseId, tool, fn) => {
      try {
        await fn();
        results.push({ suite: name, caseId, tool, status: "pass", message: "" });
      } catch (error) {
        results.push({
          suite: name,
          caseId,
          tool,
          status: "fail",
          message: String(
            error instanceof Error ? error.message : error,
          ).slice(0, 600),
        });
      }
    },
  };
}

export function formatReport(suites) {
  const lines = [];
  for (const suite of suites) {
    if (suite.results.length === 0) continue;
    lines.push(`## ${suite.name}`);
    lines.push("");
    lines.push("| Case | Tool | Status | Detail |");
    lines.push("| --- | --- | --- | --- |");
    for (const r of suite.results) {
      const detail = String(r.message ?? "")
        .replaceAll("|", "\\|")
        .replaceAll("\n", " ");
      lines.push(`| ${r.caseId} | ${r.tool} | ${r.status} | ${detail} |`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
