/**
 * Diverse Svelte 5 SFC templates + uniquify.
 *
 * Uniquify is critical: content-hash caches skip work on identical bodies under
 * different filenames, which would inflate ranking numbers.
 */

/** Replace __BENCH_ID__ or inject a unique token so every file has a unique body. */
export function uniquify(template, index) {
  const id = String(index).padStart(5, "0");
  if (template.includes("__BENCH_ID__")) {
    return template.replaceAll("__BENCH_ID__", id);
  }
  return `${template.trimEnd()}\n<!-- bench-unique:${id} -->\n`;
}

/**
 * Svelte 5 runes-mode templates covering common component shapes.
 * Targets official svelte@5, rsvelte, and Verter's experimental Svelte carrier.
 */
export function createTemplates() {
  return [
    // 0 simple
    `<script>
  let message = $state('Hello __BENCH_ID__')
</script>

<div class="hello-__BENCH_ID__">{message}</div>
`,
    // 1 with style
    `<script>
  let title = $state('Title __BENCH_ID__')
  let content = $state('Content for __BENCH_ID__')
</script>

<div class="container c-__BENCH_ID__">
  <h1>{title}</h1>
  <p>{content}</p>
</div>

<style>
  .container { padding: 20px; }
  h1 { color: #333; }
</style>
`,
    // 2 list + conditionals
    `<script>
  let title = $state('App __BENCH_ID__')
  let loading = $state(false)
  let items = $state([
    { id: 1, title: 'One', body: 'Body A __BENCH_ID__' },
    { id: 2, title: 'Two', body: 'Body B __BENCH_ID__' },
  ])
  let links = $state([
    { id: 1, url: '/', text: 'Home' },
    { id: 2, url: '/about', text: 'About' },
  ])
  function selectItem(item) {
    console.log('Selected', item.id, '__BENCH_ID__')
  }
</script>

<div class="app a-__BENCH_ID__">
  <header>
    <h1>{title}</h1>
    <nav>
      {#each links as link (link.id)}
        <a href={link.url}>{link.text}</a>
      {/each}
    </nav>
  </header>
  <main>
    {#if loading}
      <section>Loading...</section>
    {:else}
      <section>
        {#each items as item (item.id)}
          <article>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
            <button type="button" onclick={() => selectItem(item)}>Select</button>
          </article>
        {/each}
      </section>
    {/if}
  </main>
</div>

<style>
  .app { max-width: 1200px; margin: 0 auto; }
</style>
`,
    // 3 form
    `<script lang="ts">
  let name = $state('User __BENCH_ID__')
  let email = $state('user-__BENCH_ID__@example.com')
  let count = $state(1)
  let error = $state('')
  let valid = $derived(name.length > 0 && email.includes('@'))
  function submit(e: Event) {
    e.preventDefault()
    if (!valid) {
      error = 'invalid'
      return
    }
    error = ''
  }
</script>

<form class="form f-__BENCH_ID__" onsubmit={submit}>
  <label>Name <input bind:value={name} /></label>
  <label>Email <input bind:value={email} type="email" /></label>
  <label>Count <input bind:value={count} type="number" /></label>
  {#if error}
    <p class="err">{error}</p>
  {/if}
  <button type="submit" disabled={!valid}>Send {count}</button>
</form>

<style>
  .form { display: grid; gap: 8px; }
  .err { color: #b91c1c; }
</style>
`,
    // 4 dashboard-ish
    `<script lang="ts">
  let title = $state('Dashboard __BENCH_ID__')
  let offset = $state(3)
  let stats = $state([
    { id: 1, label: 'Users', value: '1,234', color: '#4CAF50' },
    { id: 2, label: 'Revenue', value: '$9k', color: '#2196F3' },
  ])
  let rows = $state(
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      name: 'Row ' + i + ' __BENCH_ID__',
      score: i * 3,
    })),
  )
  function refresh() {
    offset += 1
  }
</script>

<section class="dash d-__BENCH_ID__">
  <header>
    <h1>{title}</h1>
    <button type="button" onclick={refresh}>Refresh</button>
  </header>
  <div class="stats">
    {#each stats as stat (stat.id)}
      <article style:border-color={stat.color}>
        <h2>{stat.value}</h2>
        <p>{stat.label}</p>
      </article>
    {/each}
  </div>
  <ul>
    {#each rows as row (row.id)}
      <li>
        <span>{row.name}</span>
        <strong>{row.score + offset}</strong>
      </li>
    {/each}
  </ul>
</section>

<style>
  .dash { display: grid; gap: 12px; }
  .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
</style>
`,
    // 5 props + events (Svelte 5)
    `<script lang="ts">
  type Props = {
    label?: string
    count?: number
    onselect?: (id: number) => void
  }
  let { label = 'Label __BENCH_ID__', count = 0, onselect }: Props = $props()
  let local = $state(count)
  function bump() {
    local += 1
    onselect?.(local)
  }
</script>

<button type="button" class="btn b-__BENCH_ID__" onclick={bump}>
  {label}: {local}
</button>

<style>
  .btn { padding: 8px 12px; border-radius: 6px; }
</style>
`,
    // 6 typed heavy
    `<script lang="ts">
  type Item = { id: number; name: string; score: number; tags: string[] }
  let query = $state('')
  let items = $state<Item[]>(
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      name: 'Item ' + i + ' __BENCH_ID__',
      score: i * 7,
      tags: ['a', 'b-' + i],
    })),
  )
  let visible = $derived(
    items.filter((it) => !query || it.name.includes(query) || it.tags.some((t) => t.includes(query))),
  )
  let total = $derived(visible.reduce((n, it) => n + it.score, 0))
  function addTag(id: number, tag: string) {
    items = items.map((it) =>
      it.id === id ? { ...it, tags: [...it.tags, tag] } : it,
    )
  }
</script>

<section class="heavy h-__BENCH_ID__">
  <input bind:value={query} placeholder="filter __BENCH_ID__" />
  <p>Total score: {total}</p>
  <ul>
    {#each visible as item (item.id)}
      <li>
        <strong>{item.name}</strong>
        <span>{item.score}</span>
        <span>{item.tags.join(', ')}</span>
        <button type="button" onclick={() => addTag(item.id, 'x')}>+</button>
      </li>
    {/each}
  </ul>
</section>

<style>
  .heavy { display: grid; gap: 8px; }
</style>
`,
    // 7 snippet / slot-like
    `<script lang="ts">
  let open = $state(true)
  let heading = $state('Panel __BENCH_ID__')
</script>

<section class="panel p-__BENCH_ID__">
  <header>
    <h2>{heading}</h2>
    <button type="button" onclick={() => (open = !open)}>
      {open ? 'Hide' : 'Show'}
    </button>
  </header>
  {#if open}
    <div class="body">
      <p>Body content for __BENCH_ID__</p>
      {#snippet detail(label: string)}
        <em>{label} · __BENCH_ID__</em>
      {/snippet}
      {@render detail('detail')}
    </div>
  {/if}
</section>

<style>
  .panel { border: 1px solid #ddd; padding: 12px; }
</style>
`,
    // 8 effects + derived
    `<script lang="ts">
  let width = $state(320)
  let height = $state(180)
  let area = $derived(width * height)
  let ratio = $derived(height === 0 ? 0 : width / height)
  $effect(() => {
    if (area > 100_000) {
      console.log('large-__BENCH_ID__', area)
    }
  })
  function grow() {
    width += 10
    height += 5
  }
</script>

<div class="box box-__BENCH_ID__" style:width="{width}px" style:height="{height}px">
  <p>{width}×{height}</p>
  <p>area={area} ratio={ratio.toFixed(2)}</p>
  <button type="button" onclick={grow}>Grow</button>
</div>

<style>
  .box { border: 2px dashed #888; display: grid; place-items: center; }
</style>
`,
    // 9 class component-ish markup
    `<script>
  let tabs = $state(['overview', 'details', 'settings'])
  let active = $state('overview')
  let note = $state('Note __BENCH_ID__')
</script>

<div class="tabs t-__BENCH_ID__" role="tablist">
  {#each tabs as tab}
    <button
      type="button"
      role="tab"
      aria-selected={active === tab}
      class:active={active === tab}
      onclick={() => (active = tab)}
    >
      {tab}
    </button>
  {/each}
</div>
<div class="panel" role="tabpanel">
  {#if active === 'overview'}
    <p>Overview for __BENCH_ID__</p>
  {:else if active === 'details'}
    <p>Details: {note}</p>
  {:else}
    <input bind:value={note} />
  {/if}
</div>

<style>
  .tabs { display: flex; gap: 4px; }
  .active { font-weight: 700; }
</style>
`,
  ];
}

/** Identical body for cache-behavior demos (fixtures/N-repeated). */
export function repeatedBodyTemplate() {
  return `<script>
  let message = $state('Repeated cache-demo body')
</script>

<div class="repeated">{message}</div>
`;
}
