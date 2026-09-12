/**
 * Svelte 5 runtime semantic validity plants.
 *
 * Generated code is intentionally NEVER compared with svelte's output. Each
 * oracle observes the compiled component's observable behaviour instead: DOM,
 * events, exported functions, or rendered HTML. A plant protects a semantic
 * boundary — a faster compiler that drops the boundary cannot rank.
 *
 * Every plant is compiled through the exact public entrypoint the timed row
 * uses, then executed against the runtime matching its compatibility class.
 *
 * `assertClient`/`assertServer`/`assertCss` are excluded from SUITE_HASH so
 * refining an oracle's implementation does not invalidate stored evidence;
 * changing the source or coverage does.
 */
import { createHash } from "node:crypto";

function plant(id, coverage, source, oracles) {
  return { id, coverage, source, ...oracles };
}

/** Two-file plants exercise cross-module imports (parent -> Child.svelte). */
function multiPlant(id, coverage, files, oracles) {
  return { id, coverage, files, ...oracles };
}

const eq = (actual, expected, what) => {
  if (actual !== expected)
    throw new Error(`${what}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};
const ok = (value, what) => {
  if (!value) throw new Error(`${what}: assertion failed`);
};
const includes = (haystack, needle, what) => {
  if (!String(haystack).includes(needle))
    throw new Error(`${what}: missing ${JSON.stringify(needle)} in ${JSON.stringify(String(haystack).slice(0, 200))}`);
};

/* ------------------------------------------------------------------------- */
/* Runtime semantic plants                                                    */
/* ------------------------------------------------------------------------- */

export const COMPILE_VALIDITY_PLANTS = Object.freeze([
  plant(
    "props-defaults-interpolation",
    ["$props()", "prop defaults", "mustache interpolation"],
    `<script>
  let { name = 'World', count = 1 } = $props();
</script>

<h1 class="root">{name}:{count}</h1>`,
    {
      assertServer: ({ html }) => {
        includes(html, ">World:1</h1>", "server default props render");
      },
      assertClient: ({ mount, text }) => {
        mount({});
        eq(text(".root"), "World:1", "client default props render");
      },
    },
  ),

  plant(
    "state-derived-update",
    ["$state", "$derived", "reactive update", "DOM event handler"],
    `<script>
  let count = $state(2);
  let doubled = $derived(count * 2);
  export function step() { count += 3; }
</script>

<button class="btn" onclick={() => (count += 1)}>{doubled}</button>`,
    {
      assertServer: ({ html }) => {
        includes(html, ">4</button>", "server derived value");
      },
      assertClient: async ({ mount, fire, text, flush }) => {
        const app = mount({});
        eq(text(".btn"), "4", "initial derived");
        fire(".btn", "click");
        flush();
        eq(text(".btn"), "6", "derived after DOM handler");
        app.step();
        flush();
        eq(text(".btn"), "12", "derived after exported mutation");
      },
    },
  ),

  plant(
    "bindable-prop",
    ["$bindable", "two-way prop"],
    `<script>
  let { value = $bindable(10) } = $props();
  export function bump() { value += 5; }
</script>

<span class="v">{value}</span>`,
    {
      assertServer: ({ html }) => includes(html, ">10</span>", "bindable default"),
      assertClient: async ({ mount, text, flush }) => {
        const app = mount({});
        eq(text(".v"), "10", "bindable default");
        app.bump();
        flush();
        eq(text(".v"), "15", "bindable mutation is reactive");
      },
    },
  ),

  plant(
    "callback-prop-events",
    ["callback props", "component events", "payload"],
    `<script>
  let { onPing } = $props();
  let seen = $state('none');
  export function ping() {
    seen = onPing ? String(onPing(41)) : 'no-callback';
  }
</script>

<button class="b" onclick={ping}>{seen}</button>`,
    {
      assertServer: ({ html }) => includes(html, ">none</button>", "callback not invoked during SSR"),
      assertClient: async ({ mount, text, flush }) => {
        let payload = null;
        const app = mount({ onPing: (n) => (payload = n + 1) });
        app.ping();
        flush();
        eq(text(".b"), "42", "callback payload flowed back");
        eq(payload, 42, "callback received argument");
      },
    },
  ),

  plant(
    "bind-value-input",
    ["bind:value", "input events", "two-way binding"],
    `<script>
  let text = $state('start');
</script>

<input class="in" bind:value={text} />
<output class="out">{text}</output>`,
    {
      assertServer: ({ html }) => includes(html, ">start</output>", "server binding initial value"),
      assertClient: async ({ mount, q, fire, text, flush }) => {
        mount({});
        const input = q(".in");
        input.value = "typed";
        fire(input, "input");
        flush();
        eq(text(".out"), "typed", "input binding propagated to state");
      },
    },
  ),

  plant(
    "bind-checkbox-select",
    ["bind:checked", "bind:value select", "form bindings"],
    `<script>
  let checked = $state(false);
  let size = $state('m');
  const sizes = ['s', 'm', 'l'];
</script>

<input class="cb" type="checkbox" bind:checked />
<select class="sel" bind:value={size}>{#each sizes as s (s)}<option value={s}>{s}</option>{/each}</select>
<span class="state">{checked ? 'on' : 'off'}:{size}</span>`,
    {
      assertServer: ({ html }) => includes(html, ">off:m</span>", "server form defaults"),
      assertClient: async ({ mount, q, fire, text, flush }) => {
        mount({});
        const cb = q(".cb");
        cb.checked = true;
        fire(cb, "change");
        const select = q(".sel");
        select.value = "l";
        fire(select, "change");
        flush();
        eq(text(".state"), "on:l", "checkbox and select bindings observed");
      },
    },
  ),

  plant(
    "if-block-branches",
    ["{#if}", "branch switching"],
    `<script>
  let open = $state(false);
  export function toggle() { open = !open; }
</script>

{#if open}
  <p class="yes">open</p>
{:else}
  <p class="no">closed</p>
{/if}`,
    {
      assertServer: ({ html }) => includes(html, ">closed</p>", "server else branch"),
      assertClient: async ({ mount, text, q, flush }) => {
        const app = mount({});
        ok(q(".no"), "else branch rendered");
        app.toggle();
        flush();
        ok(q(".yes"), "then branch after toggle");
        eq(text(".yes"), "open", "branch content");
        ok(!q(".no"), "else branch removed");
      },
    },
  ),

  plant(
    "each-keyed-reorder",
    ["{#each}", "keyed lists", "DOM identity"],
    `<script>
  let items = $state([
    { id: 1, label: 'one' },
    { id: 2, label: 'two' },
    { id: 3, label: 'three' },
  ]);
  export function reverse() { items = [...items].reverse(); }
</script>

<ul class="list">
  {#each items as item (item.id)}
    <li data-id={item.id}>{item.label}</li>
  {/each}
</ul>`,
    {
      assertServer: ({ html }) => {
        includes(html, "data-id=\"1\"", "keyed list item 1");
        includes(html, ">three</li>", "keyed list item 3");
      },
      assertClient: async ({ mount, q, flush }) => {
        const app = mount({});
        const first = q('[data-id="1"]');
        app.reverse();
        flush();
        const ids = [...q(".list").children].map((li) => li.dataset.id);
        if (ids.join(",") !== "3,2,1")
          throw new Error(`keyed reorder produced ${ids.join(",")}`);
        // Keyed semantics: nodes are moved, not recreated — same node object
        // must now sit at the end.
        if (q(".list").children[2] !== first)
          throw new Error("keyed reorder recreated DOM nodes instead of moving them");
      },
    },
  ),

  plant(
    "await-block-promise",
    ["{#await}", "async resolution"],
    `<script>
  let promise = $state(Promise.resolve('resolved-value'));
  export function fail() { promise = Promise.reject(new Error('boom')); }
</script>

{#await promise}
  <p class="loading">loading…</p>
{:then value}
  <p class="done">{value}</p>
{:catch error}
  <p class="err">{error.message}</p>
{/await}`,
    {
      assertServer: ({ html }) => includes(html, ">loading…</p>", "server renders pending branch"),
      assertClient: async ({ mount, text, q, wait }) => {
        mount({});
        await wait();
        ok(q(".done"), "resolved branch rendered");
        eq(text(".done"), "resolved-value", "awaited value");
      },
    },
  ),

  plant(
    "snippets-render",
    ["{#snippet}", "{@render}", "snippets"],
    `<script>
  let { label = 'L' } = $props();
</script>

{#snippet cell(value, idx)}
  <td class="cell">{label}{idx}:{value}</td>
{/snippet}

<table><tbody><tr class="row">
  {@render cell('a', 1)}
  {@render cell('b', 2)}
</tr></tbody></table>`,
    {
      assertServer: ({ html }) => {
        includes(html, ">L1:a</td>", "rendered snippet 1");
        includes(html, ">L2:b</td>", "rendered snippet 2");
      },
      assertClient: async ({ mount, q }) => {
        mount({});
        eq(q(".row").children.length, 2, "snippet rendered per call");
        includes(q(".row").children[0].textContent, "L1:a", "snippet arguments");
      },
    },
  ),

  plant(
    "store-auto-subscription",
    ["$store", "svelte/store", "auto-subscription"],
    `<script>
  import { writable } from 'svelte/store';
  let counter = writable(5);
  export function setCounter(n) { counter.set(n); }
</script>

<b class="s">{$counter}</b>`,
    {
      assertServer: ({ html }) => includes(html, ">5</b>", "server store value"),
      assertClient: async ({ mount, text, flush }) => {
        const app = mount({});
        eq(text(".s"), "5", "store initial value");
        app.setCounter(9);
        flush();
        eq(text(".s"), "9", "store subscription updated");
      },
    },
  ),

  plant(
    "action-directive",
    ["use: action", "actions"],
    `<script>
  function mark(node) {
    node.dataset.actionRan = 'yes';
    return { destroy() { node.dataset.actionRan = 'destroyed'; } };
  }
</script>

<div class="act" use:mark>host</div>`,
    {
      assertServer: ({ html }) => includes(html, ">host</div>", "server action host rendered"),
      assertClient: async ({ mount, q }) => {
        mount({});
        eq(q(".act").dataset.actionRan, "yes", "action ran on mount");
      },
    },
  ),

  plant(
    "html-block",
    ["{@html}", "raw HTML"],
    `<script>
  let { markup = '<em class="em">raw</em>' } = $props();
</script>

<div class="host">{@html markup}</div>`,
    {
      assertServer: ({ html }) => includes(html, '<em class="em">raw</em>', "server @html"),
      assertClient: async ({ mount, q }) => {
        mount({});
        const em = q(".em");
        ok(em, "@html injected real elements");
        eq(em.textContent, "raw", "@html content");
      },
    },
  ),

  plant(
    "class-directive-and-style",
    ["class:", "style:", "class/style handling"],
    `<script>
  let active = $state(true);
  let color = $state('red');
  export function flip() { active = !active; color = 'blue'; }
</script>

<p class="p base" class:active style:color={color}>x</p>`,
    {
      assertServer: ({ html }) => {
        includes(html, 'class="p base active"', "server class directive");
        includes(
          String(html).replaceAll(" ", ""),
          "color:red",
          "server style directive (spacing-normalized)",
        );
      },
      assertClient: async ({ mount, q, styleOf, flush }) => {
        const app = mount({});
        eq(q(".p").className, "p base active", "class directive on");
        includes(styleOf(".p"), "color:red", "style directive");
        app.flip();
        flush();
        eq(q(".p").className, "p base", "class directive off");
        includes(styleOf(".p"), "color:blue", "style directive update");
      },
    },
  ),

  plant(
    "svg-namespace",
    ["SVG", "namespace behaviour"],
    `<svg class="svg" width="40" height="40">
  <circle class="circle" cx="20" cy="20" r="18" />
</svg>`,
    {
      assertServer: ({ html }) => {
        includes(html, "<svg", "server svg element");
        includes(html, "<circle", "server circle element");
      },
      assertClient: async ({ mount, q }) => {
        mount({});
        const svg = q(".svg");
        const circle = q(".circle");
        includes(svg.namespaceURI, "svg", "svg namespace");
        includes(circle.namespaceURI, "svg", "circle inherits svg namespace");
      },
    },
  ),

  plant(
    "module-script-instance",
    ["<script module>", "module/instance interaction", "exports"],
    `<script module>
  export const MAGIC = 7;
  export function twice(n) { return n * 2; }
</script>

<script>
  let base = $state(1);
  export function grow() { base += 1; }
</script>

<i class="m">{MAGIC + twice(base)}</i>`,
    {
      assertServer: ({ html }) => includes(html, ">9</i>", "module constant used by instance"),
      assertClient: async ({ mount, text, flush, module }) => {
        const app = mount({});
        eq(text(".m"), "9", "module+instance composition");
        app.grow();
        flush();
        eq(text(".m"), "11", "instance state with module helper");
        eq(module.MAGIC, 7, "module export surfaced");
        eq(module.twice(4), 8, "module function surfaced");
      },
    },
  ),

  plant(
    "legacy-event-directive",
    ["on: directive", "legacy syntax still valid in Svelte 5"],
    `<script>
  let hits = $state(0);
</script>

<button class="legacy" on:click={() => (hits += 1)}>{hits}</button>`,
    {
      assertServer: ({ html }) => includes(html, ">0</button>", "legacy handler SSR"),
      assertClient: async ({ mount, fire, text, flush }) => {
        mount({});
        fire(".legacy", "click");
        flush();
        eq(text(".legacy"), "1", "legacy on:click fired");
      },
    },
  ),

  multiPlant(
    "reactive-props-destructure-shadowing",
    ["$props() destructure", "function parameter scope", "arrow parameter scope", "prop update", "lexical shadowing"],
    [
      {
        name: "Parent.svelte",
        source: `<script>
  import Child from './Child.svelte';
  let label = $state('outer');
  export function setLabel(value) { label = value; }
</script>

<output class="shadow"><Child {label} /></output>`,
      },
      {
        name: "Child.svelte",
        source: `<script>
  let { label = 'outer' } = $props();
  function local(label) { return label; }
  const inner = ['arrow'].map((label) => label).join(',');
</script>

<span>{label}|{local('parameter')}|{inner}</span>`,
      },
    ],
    {
      assertServer: ({ html }) => includes(html, ">outer|parameter|arrow</span>", "server destructured default with shadowing"),
      assertClient: async ({ mount, text, flush }) => {
        const app = mount({});
        eq(text(".shadow span"), "outer|parameter|arrow", "lexical shadowing");
        app.setLabel("updated");
        flush();
        eq(text(".shadow span"), "updated|parameter|arrow", "prop update reaches only the outer binding");
      },
    },
  ),

  multiPlant(
    "reactive-props-destructure-alias-default",
    ["$props() destructure", "alias", "destructure default", "$derived", "default restoration"],
    [
      {
        name: "Parent.svelte",
        source: `<script>
  import Child from './Child.svelte';
  let label = $state(undefined);
  let count = $state(undefined);
  export function setProps(nextLabel, nextCount) { label = nextLabel; count = nextCount; }
</script>

<output class="destructure"><Child label={label} count={count} /></output>`,
      },
      {
        name: "Child.svelte",
        source: `<script>
  let { label: caption = 'fallback', count = 2 } = $props();
  const summary = $derived(caption + ':' + count);
</script>

<b>{caption}|{summary}</b>`,
      },
    ],
    {
      assertServer: ({ html }) => includes(html, ">fallback|fallback:2</b>", "server destructure defaults"),
      assertClient: async ({ mount, text, flush }) => {
        const app = mount({});
        eq(text(".destructure b"), "fallback|fallback:2", "destructure defaults");
        app.setProps("next", 7);
        flush();
        eq(text(".destructure b"), "next|next:7", "aliased prop and derived update");
        app.setProps(undefined, undefined);
        flush();
        eq(text(".destructure b"), "fallback|fallback:2", "defaults restored after props become undefined");
      },
    },
  ),
  multiPlant(
    "component-props-child-binding",
    ["component props", "child components", "$bindable across modules"],
    [
      {
        name: "Parent.svelte",
        source: `<script>
  import Child from './Child.svelte';
  let total = $state(3);
  export function passToChild() { total = 10; }
</script>

<div class="parent">
  <Child value={total} label="total" />
  <Child bind:value={total} label="mirror" />
</div>`,
      },
      {
        name: "Child.svelte",
        source: `<script>
  let { value = $bindable(0), label = 'c' } = $props();
</script>

<span class="child" data-label={label}>{value}</span>`,
      },
    ],
    {
      assertServer: ({ html }) => {
        includes(html, 'data-label="total">3</span>', "child rendered props");
      },
      assertClient: async ({ mount, qa, flush }) => {
        const app = mount({});
        eq(qa(".child")[0].textContent, "3", "child received prop");
        eq(qa(".child")[1].textContent, "3", "bound child mirrored value");
        app.passToChild();
        flush();
        eq(qa(".child")[0].textContent, "10", "prop update flowed to child");
        eq(qa(".child")[1].textContent, "10", "bound child tracked update");
      },
    },
  ),

  multiPlant(
    "context-parent-child",
    ["setContext", "getContext", "context"],
    [
      {
        name: "Parent.svelte",
        source: `<script>
  import { setContext } from 'svelte';
  import Leaf from './Leaf.svelte';
  setContext('theme', 'dark');
</script>

<section class="ctx"><Leaf /></section>`,
      },
      {
        name: "Leaf.svelte",
        source: `<script>
  import { getContext } from 'svelte';
  const theme = getContext('theme');
</script>

<b class="leaf">{theme}</b>`,
      },
    ],
    {
      assertServer: ({ html }) => includes(html, ">dark</b>", "server context"),
      assertClient: async ({ mount, text }) => {
        mount({});
        eq(text(".leaf"), "dark", "context reached child");
      },
    },
  ),

  multiPlant(
    "dynamic-component-switch",
    ["dynamic components", "<Component />"],
    [
      {
        name: "Parent.svelte",
        source: `<script>
  import Alpha from './Alpha.svelte';
  import Beta from './Beta.svelte';
  let Current = $state(Alpha);
  export function swap() { Current = Current === Alpha ? Beta : Alpha; }
</script>

<div class="dyn"><Current label="d" /></div>`,
      },
      {
        name: "Alpha.svelte",
        source: `<script>
  let { label = '' } = $props();
</script>

<p class="alpha">{label}A</p>`,
      },
      {
        name: "Beta.svelte",
        source: `<script>
  let { label = '' } = $props();
</script>

<p class="beta">{label}B</p>`,
      },
    ],
    {
      assertServer: ({ html }) => includes(html, ">dA</p>", "server dynamic component"),
      assertClient: async ({ mount, q, flush }) => {
        const app = mount({});
        ok(q(".alpha"), "initial dynamic component");
        app.swap();
        flush();
        ok(q(".beta"), "swapped dynamic component");
        ok(!q(".alpha"), "previous component removed");
      },
    },
  ),
]);

/* ------------------------------------------------------------------------- */
/* CSS semantic plants (structural assertions on emitted CSS, never equality)  */
/* ------------------------------------------------------------------------- */

export const CSS_VALIDITY_PLANTS = Object.freeze([
  plant(
    "css-scoped-selector",
    ["scoped styles", "scoping hash"],
    `<script>let v = $state(1);</script>
<p class="box">{v}</p>
<style>.box { color: red; }</style>`,
    {
      assertCss: ({ css }) => {
        ok(/\.box\.svelte-[a-z0-9]+/i.test(css), "selector must carry a scoping class");
      },
    },
  ),
  plant(
    "css-global-selector",
    [":global"],
    `<p class="g">x</p>
<style>:global(.g) { color: blue; }</style>`,
    {
      assertCss: ({ css }) => {
        includes(css, ".g", ":global selector kept");
        ok(!/\.g\.svelte-[a-z0-9]+/.test(css), ":global selector must not be scoped");
      },
    },
  ),
  plant(
    "css-selector-list",
    ["selector lists"],
    `<p class="a">x</p><p class="b">y</p>
<style>.a, .b { color: green; }</style>`,
    {
      assertCss: ({ css }) => {
        ok(/\.a(\.svelte-[a-z0-9]+)?\s*,\s*\.b(\.svelte-[a-z0-9]+)?/.test(css), "selector list preserved");
      },
    },
  ),
  plant(
    "css-media-at-rule",
    ["at-rules", "@media"],
    `<p class="m">x</p>
<style>@media (min-width: 1px) { .m { color: teal; } }</style>`,
    {
      assertCss: ({ css }) => {
        includes(css, "@media", "@media preserved");
        includes(css, "teal", "inner declaration preserved");
      },
    },
  ),
  plant(
    "css-keyframes",
    ["@keyframes", "animation references"],
    `<p class="k">x</p>
<style>@keyframes slide { from { opacity: 0; } to { opacity: 1; } }
.k { animation: slide 2s; }</style>`,
    {
      assertCss: ({ css }) => {
        ok(/@keyframes\s+[a-zA-Z-]/.test(css), "keyframes block emitted");
        ok(/animation:[^;}]*slide/.test(css) || /animation[^;}]*svelte/.test(css), "animation references the (scoped) keyframes name");
      },
    },
  ),
  plant(
    "css-custom-properties",
    ["custom properties", "var()"],
    `<p class="cp">x</p>
<style>.cp { --local-pad: 4px; padding: var(--local-pad); }</style>`,
    {
      assertCss: ({ css }) => {
        includes(css, "--local-pad", "custom property declared");
        includes(css, "var(--local-pad)", "custom property referenced");
      },
    },
  ),
  plant(
    "css-unused-selector-pruned",
    ["unused CSS pruning", "compiler semantics"],
    `<p class="used">x</p>
<style>.used { color: red; }
.never-used-class { color: blue; }</style>`,
    {
      assertCss: ({ css }) => {
        includes(css, ".used", "used selector kept");
        // Official Svelte 5 either drops unused selectors entirely or parks
        // them inside a `/* (unused) … */` comment — both mean the selector is
        // not live CSS. An active rule (outside comments) is a semantics gap.
        const active = String(css).replace(/\/\*[\s\S]*?\*\//g, "");
        ok(!active.includes("never-used-class"), "unused selector must not survive as live CSS");
      },
    },
  ),
  plant(
    "css-cascade-order",
    ["cascade", "declaration order"],
    `<script>let v = $state(1);</script>
<p class="casc">{v}</p>
<style>.casc { color: red; }
.other-casc { color: blue; }
.casc { padding: 1px; }</style>`,
    {
      assertCss: ({ css }) => {
        // Both USED .casc rules survive and keep their document order — a
        // reordering or dropped rule changes the cascade. The unused rule
        // must not be live CSS (official parks it in an (unused) comment,
        // removing it entirely is equally correct).
        const active = String(css).replace(/\/\*[\s\S]*?\*\//g, "");
        const firstColor = active.indexOf("color: red");
        const pad = active.indexOf("padding: 1px");
        if (firstColor < 0 || pad < 0) throw new Error("expected both .casc declarations to survive");
        if (pad < firstColor) throw new Error("second .casc rule must come after the first (cascade order)");
        if (active.includes(".other-casc")) throw new Error("unused selector must not survive as live CSS");
      },
    },
  ),
  plant(
    "css-duplicate-declarations",
    ["duplicate declarations", "last-wins order"],
    `<script>let v = $state(1);</script>
<p class="dupe">{v}</p>
<style>.dupe { color: red; color: blue; }</style>`,
    {
      assertCss: ({ css }) => {
        const red = css.indexOf("color: red");
        const blue = css.indexOf("color: blue");
        if (red < 0 || blue < 0) throw new Error("duplicate declarations must both be preserved");
        if (blue < red) throw new Error("declaration order must be preserved (last-wins semantics)");
      },
    },
  ),
  plant(
    "css-custom-property-wiring",
    ["custom properties", "var() consumption"],
    `<script>let v = $state(1);</script>
<p class="cp">{v}</p>
<style>.cp { --plant-pad: 4px; padding: var(--plant-pad); }</style>`,
    {
      assertCss: ({ css }) => {
        includes(css, "--plant-pad: 4px", "custom property declaration preserved");
        includes(css, "var(--plant-pad)", "custom property consumed via var()");
      },
    },
  ),
  plant(
    "css-external-extraction",
    ["css: 'external'", "style extraction"],
    `<p class="e">x</p>
<style>.e { color: maroon; }</style>`,
    {
      assertCss: ({ css, result }) => {
        ok(css && css.length > 0, "external CSS must be extracted into result.css");
        includes(css, "maroon", "external CSS carries declarations");
      },
    },
  ),
]);

/* ------------------------------------------------------------------------- */
/* Suite identity                                                             */
/* ------------------------------------------------------------------------- */

export const COMPILE_VALIDITY_SUITE_VERSION = "2026-09-12.2";

function semanticFields(plants) {
  return plants.map(({ id, coverage, source, files }) => ({
    id,
    coverage,
    source,
    ...(files ? { files } : {}),
  }));
}

export const COMPILE_VALIDITY_SUITE_HASH = createHash("sha256")
  .update(
    JSON.stringify({
      runtime: semanticFields(COMPILE_VALIDITY_PLANTS),
      css: semanticFields(CSS_VALIDITY_PLANTS),
    }),
  )
  .digest("hex");

/** One UNKNOWN row per plant — used when the suite could not run at all. */
export function unknownCompileValidityResults(reason) {
  return [
    ...COMPILE_VALIDITY_PLANTS.map((p) => ({
      id: p.id,
      coverage: p.coverage,
      status: "UNKNOWN",
      phase: "not-run",
      detail: reason,
    })),
    ...CSS_VALIDITY_PLANTS.map((p) => ({
      id: p.id,
      coverage: p.coverage,
      status: "UNKNOWN",
      phase: "not-run",
      detail: reason,
    })),
  ];
}
