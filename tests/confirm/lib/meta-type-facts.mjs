/**
 * Structured type facts for component-metadata expectations.
 *
 * `typeIncludes` is deliberately coarse (substring tokens); these checks pin
 * STRUCTURE: a callback's parameter count, each parameter's type text and
 * optionality. Dropping an argument or changing a parameter's type must fail
 * even when the blob still mentions every word somewhere.
 */
import ts from "typescript";

function parseType(text) {
  const source = ts.createSourceFile(
    "fact.ts",
    `type Fact = ${text};`,
    ts.ScriptTarget.Latest,
    true,
  );
  if (source.parseDiagnostics.length || source.statements.length !== 1)
    return null;
  return ts.isTypeAliasDeclaration(source.statements[0]) ? source.statements[0].type : null;
}

/** Parameter descriptors of a function-type text, or null when not callable. */
export function callableParameters(typeText) {
  const node = parseType(String(typeText ?? ""));
  if (!node) return null;
  if (ts.isFunctionTypeNode(node) || ts.isCallSignatureDeclaration(node)) {
    return node.parameters.map((parameter) => ({
      type: parameter.type?.getText(sourceOf(parameter)) ?? "",
      optional: Boolean(parameter.questionToken || parameter.initializer),
      rest: Boolean(parameter.dotDotDotToken),
    }));
  }
  return null;
}

function sourceOf() {
  // getText() without a source file returns the node text; sufficient here.
  return undefined;
}

/**
 * facts: { paramCount?, params?: [{ includes?, optional? }] }.
 * Returns failure strings (empty = pass).
 */
export function checkMetaTypeFacts(typeText, facts) {
  if (!facts) return [];
  const failures = [];
  const params = callableParameters(typeText);
  if (params == null) {
    return [`type ${JSON.stringify(String(typeText).slice(0, 60))} is not a callable type`];
  }
  if (Number.isInteger(facts.paramCount) && params.length !== facts.paramCount) {
    failures.push(`expected ${facts.paramCount} parameter(s), got ${params.length}`);
  }
  (facts.params ?? []).forEach((expected, index) => {
    const actual = params[index];
    if (!actual) {
      failures.push(`parameter ${index + 1} missing (got ${params.length})`);
      return;
    }
    if (expected.includes && !actual.type.replace(/\s+/g, "").toLowerCase().includes(expected.includes.toLowerCase())) {
      failures.push(`parameter ${index + 1} type "${actual.type}" does not include "${expected.includes}"`);
    }
    if (typeof expected.optional === "boolean" && actual.optional !== expected.optional) {
      failures.push(`parameter ${index + 1} optional=${actual.optional}, expected ${expected.optional}`);
    }
  });
  return failures;
}
