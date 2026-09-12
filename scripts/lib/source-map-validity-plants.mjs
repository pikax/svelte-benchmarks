/**
 * Source-map coordinate-tracing plants for Svelte compilers.
 *
 * Every compared Svelte 5 compiler ALWAYS emits js.map/css.map from compile()
 * (there is no off/on flag), so mapping CORRECTNESS is a gate on the regular
 * compile rows rather than a separate dimension. Plants pin tokens in script,
 * template and style — including a CRLF variant and a non-BMP marker (🧪)
 * before targets, which shifts UTF-16 columns — and the oracle traces each
 * generated token back to its exact source position.
 *
 * Unlike Vue (multiple <style> blocks per SFC), Svelte allows exactly ONE
 * top-level <style> element (compile error style_duplicate otherwise), so the
 * styles workload anchors two rules inside that single block.
 */
import { createHash } from "node:crypto";

export const SOURCE_MAP_SUITE_VERSION = "2026-09-12.1";

const SCRIPT_TOKEN = "mapProbeToken";
const TEMPLATE_TOKEN = "Math";
const CSS_TOKENS = ["color", "padding"];

const body = `<script>
  /* 🧪 */ const ${SCRIPT_TOKEN} = 7;
  let { value = 3 } = $props();
</script>

<p class="mapTarget" title="🧪">{${TEMPLATE_TOKEN}.max(value, ${SCRIPT_TOKEN}, 0)}</p>
<span class="mapTail">t</span>
`;
const styles = `<style>
  /* 🧪 */ .mapTarget { ${CSS_TOKENS[0]}: red; }
  .mapTail { ${CSS_TOKENS[1]}: 7px; }
</style>
`;

function anchorsFor(withStyles) {
  return [
    { id: "script", generatedToken: SCRIPT_TOKEN, sourceToken: SCRIPT_TOKEN },
    { id: "template", generatedToken: TEMPLATE_TOKEN, sourceToken: TEMPLATE_TOKEN },
    ...(withStyles
      ? CSS_TOKENS.map((token, index) => ({
          id: `css-${index}`,
          generatedToken: token,
          sourceToken: token,
        }))
      : []),
  ];
}

export const SOURCE_MAP_PLANTS = Object.freeze(
  ["lf", "crlf"].flatMap((ending) =>
    [false, true].map((withStyles) => {
      const source = (body + (withStyles ? styles : "")).replaceAll(
        "\n",
        ending === "crlf" ? "\r\n" : "\n",
      );
      return {
        id: `${ending}-${withStyles ? "styles" : "raw"}`,
        workload: withStyles ? "styles" : "raw",
        source,
        // Original offsets are computed at load: the anchor's sourceToken
        // first occurrence in the exact source bytes (UTF-16 offsets).
        anchors: anchorsFor(withStyles).map((anchor) => ({
          ...anchor,
          originalOffset: source.indexOf(anchor.sourceToken),
        })),
      };
    }),
  ),
);

for (const plant of SOURCE_MAP_PLANTS) {
  for (const anchor of plant.anchors) {
    if (anchor.originalOffset < 0) {
      throw new Error(`source-map plant ${plant.id}: token ${anchor.sourceToken} missing from source`);
    }
  }
}

export const SOURCE_MAP_SUITE_HASH = createHash("sha256")
  .update(
    JSON.stringify(
      SOURCE_MAP_PLANTS.map(({ id, workload, source, anchors }) => ({
        id,
        workload,
        source,
        anchors: anchors.map(({ id: anchorId, sourceToken, originalOffset }) => ({
          id: anchorId,
          sourceToken,
          originalOffset,
        })),
      })),
    ),
  )
  .digest("hex");
