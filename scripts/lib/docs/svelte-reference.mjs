const RETIRED_REFERENCE = "svelte-mrwaip-reference";
const RERUN_NOTE = "Awaiting rerun against the current Svelte reference. This historical result used a retired reference; its original samples and validation remain in the source JSON.";
const VERTER_RERUN_NOTE = "This snapshot predates the Verter compileMany diagnostic pass. That published entrypoint now runs unranked; timings will appear after a new benchmark run.";

/**
 * Present historical two-reference snapshots under the single-reference policy.
 * Never relabel old-runtime measurements as current-runtime evidence. The raw
 * snapshot stays intact; only rows measured with its main `svelte` package keep
 * their numbers. Version labels come from recorded metadata, not today's install.
 */
export function singleSvelteReference(snapshot) {
  const data = structuredClone(snapshot);
  const version = data.versions?.svelte;
  if (data.versions) delete data.versions[RETIRED_REFERENCE];

  function pending(row, comparisonClass) {
    return {
      id: row.id, label: row.label, package: row.package,
      surface: row.surface, target: row.target, env: row.env,
      threading: row.threading, invocation: row.invocation,
      comparisonClass, status: "skipped", skip: RERUN_NOTE, notes: RERUN_NOTE,
    };
  }

  function rowsForReference(rows, comparisonClass) {
    const reference = rows.find((r) => r.package === "svelte");
    const referenceClass = reference?.comparisonClass;
    const retiredClasses = new Set(rows.filter((r) => r.package === RETIRED_REFERENCE).map((r) => r.comparisonClass));
    return rows.filter((r) => r.package !== RETIRED_REFERENCE).map((row) => {
      if (retiredClasses.has(row.comparisonClass)) return pending(row, comparisonClass);
      if (reference && row.comparisonClass === referenceClass) row.comparisonClass = comparisonClass;
      if (row.package === "svelte" && version) {
        row.label = `svelte/compiler ${version}${row.threading === "1t" ? " (1T)" : ""}`;
        if (row.baseline) row.baselineLabel = `Svelte ${version} (official)`;
      }
      if (row.package === "@verter/native" && row.status === "skipped" && /No public Svelte runtime compile API/.test(row.notes ?? "")) {
        row.notes = VERTER_RERUN_NOTE;
      }
      return row;
    });
  }

  for (const surface of data.surfaces ?? []) {
    if (surface.id !== "compile") continue;
    const cells = surface.groups?.length ? surface.groups : [surface];
    const referenceClass = cells.flatMap((c) => c.variants ?? []).find((r) => r.package === "svelte")?.comparisonClass;
    const hadRetiredReference = cells.some((c) => c.variants?.some((r) => r.package === RETIRED_REFERENCE));
    for (const cell of cells) cell.variants = rowsForReference(cell.variants ?? [], "svelte");
    if (!hadRetiredReference) continue;

    // Keep the actual primary corpus counts; never combine the two accepted sets.
    const corpus = surface.corpus;
    if (corpus?.measuredFilesByClass?.[referenceClass] != null) {
      corpus.measuredFiles = corpus.measuredFilesByClass[referenceClass];
      corpus.excluded = corpus.excludedByClass?.[referenceClass] ?? 0;
      corpus.exclusionExamples = corpus.exclusionExamplesByClass?.[referenceClass] ?? [];
      corpus.exclusionRule = "Inputs rejected by the snapshot's main official Svelte compiler are excluded equally for the displayed measurements.";
      delete corpus.measuredFilesByClass;
      delete corpus.excludedByClass;
      delete corpus.exclusionExamplesByClass;
    }
    surface.methodology = [
      "Only the snapshot's main official Svelte reference is shown. Its label uses the recorded package version. Retired-reference results require a rerun; original timings, corpus scopes and methodology remain in the source JSON.",
      ...(surface.methodology ?? []).filter((note) => !/pinned compiler.version|pinned svelte-|svelte-\d|compatibility class/.test(note))
        .map((note) => /Verter exposes no public Svelte runtime compile API/.test(note) ? VERTER_RERUN_NOTE : note),
    ];
    for (const cell of Object.values(surface.validation?.compileSemantics?.matrix ?? {})) {
      const entrypoints = cell.entrypoints ?? {};
      delete entrypoints[RETIRED_REFERENCE];
      if (entrypoints["svelte-official"] && version) entrypoints["svelte-official"].label = `svelte/compiler ${version}`;
      if (entrypoints["mrwaip-svelte-rs"]) entrypoints["mrwaip-svelte-rs"] = { status: "UNKNOWN", reason: RERUN_NOTE };
      const statuses = Object.values(entrypoints).map((r) => r.status);
      cell.status = statuses.includes("FAIL") ? "FAIL" : statuses.includes("UNKNOWN") ? "UNKNOWN" : "PASS";
    }
  }

  if (data.rows) {
    const compile = rowsForReference(data.rows.filter((r) => r.surface === "compile"), "svelte-client-production");
    data.rows = [...compile, ...data.rows.filter((r) => r.surface !== "compile")];
  }
  if (data.results?.some((r) => r.suite === "compile" && r.tool === RETIRED_REFERENCE)) {
    data.results = data.results.filter((r) => r.tool !== RETIRED_REFERENCE).map((row) =>
      row.suite === "compile" && row.tool === "mrwaip-svelte-rs"
        ? { ...row, status: "skip", message: RERUN_NOTE }
        : row,
    );
  }
  if (snapshot.versions?.[RETIRED_REFERENCE] && data.methodology) {
    data.methodology = data.methodology.filter((note) => !/pinned version class/.test(note));
  }
  return data;
}
