<script lang="ts">
  import { onMount } from "svelte";
  import { Converter } from "../lib/client/converter.svelte";

  const c = new Converter();
  let url = $state("");
  let name = $state("");

  onMount(() => {
    c.init().then(() => {
      if (!url) url = c.lastInput;
    });
  });

  $effect(() => {
    if (c.playlist && !name) name = c.playlist.title;
  });

  const busy = $derived(c.phase === "fetching" || c.phase === "creating");
</script>

<div class="page">
  <header>
    <a
      href="/"
      class="brand"
      onclick={(e) => {
        e.preventDefault();
        c.reset();
      }}
    >
      Crossfade
    </a>
    {#if c.authenticated === true}
      <button class="text-btn" onclick={() => c.logout()}>
        Spotify connected · disconnect
      </button>
    {:else if c.authenticated === false}
      <button class="text-btn" onclick={() => c.login()}>Connect Spotify</button>
    {/if}
  </header>

  <main>
    {#if c.phase === "idle" || c.phase === "fetching"}
      <h1>Move a playlist from <em>YouTube</em> to <em>Spotify</em>.</h1>
      <p class="lede">
        Paste a public YouTube playlist below. Each video is matched against
        the Spotify catalogue; you review the matches before anything is
        created.
      </p>
      <form
        onsubmit={(e) => {
          e.preventDefault();
          if (url.trim()) c.load(url);
        }}
      >
        <label for="url">Playlist URL</label>
        <div class="input-row">
          <input
            id="url"
            type="url"
            bind:value={url}
            placeholder="https://youtube.com/playlist?list=…"
            required
          />
          <button class="action" disabled={busy}>
            {c.phase === "fetching" ? "Fetching…" : "Fetch"}
          </button>
        </div>
      </form>
    {:else if c.phase === "done" && c.created}
      <h1>Done.</h1>
      <p class="lede">
        <em>{c.created.name}</em> now lives on Spotify —
        {c.selectedRows.length} tracks.
      </p>
      <p class="actions">
        <a class="action" href={c.created.url} target="_blank" rel="noopener">
          Open in Spotify ↗
        </a>
        <button class="text-btn" onclick={() => c.reset()}>
          Convert another
        </button>
      </p>
    {:else if c.playlist}
      <div class="playlist-head">
        <h2>{c.playlist.title}</h2>
        <span class="count">{c.rows.length} tracks</span>
      </div>

      {#if c.phase === "loaded"}
        <p class="actions">
          {#if c.authenticated}
            <button class="action" onclick={() => c.convert()}>
              Match on Spotify
            </button>
          {:else}
            <button class="action" onclick={() => c.login()}>
              Connect Spotify to continue
            </button>
          {/if}
          <button class="text-btn" onclick={() => c.reset()}>Back</button>
        </p>
      {:else if c.phase === "matching"}
        <p class="progress">Matching {c.processed} of {c.rows.length}…</p>
        <div class="bar">
          <div
            class="bar-fill"
            style:width={`${(c.processed / c.rows.length) * 100}%`}
          ></div>
        </div>
      {:else if c.phase === "matched" || c.phase === "creating"}
        <p class="summary">
          {c.matchedRows.length} matched
          {#if c.rows.length - c.matchedRows.length > 0}
            · {c.rows.length - c.matchedRows.length} not found
          {/if}
        </p>
        <form
          class="create-row"
          onsubmit={(e) => {
            e.preventDefault();
            if (name.trim() && c.selectedRows.length) c.create(name.trim());
          }}
        >
          <input id="name" bind:value={name} placeholder="Playlist name" required />
          <button class="action" disabled={busy || c.selectedRows.length === 0}>
            {c.phase === "creating"
              ? "Creating…"
              : `Create playlist (${c.selectedRows.length})`}
          </button>
        </form>
      {/if}

      <ol>
        {#each c.rows as row, i}
          <li class={row.status}>
            <span class="num">{String(i + 1).padStart(2, "0")}</span>
            <span class="titles">
              <span class="src">{row.track.title}</span>
              {#if row.match}
                <span class="match">
                  {row.match.name} — {row.match.artists.join(", ")}
                </span>
              {/if}
            </span>
            <span class="status">
              {#if row.status === "searching"}
                <em>searching…</em>
              {:else if row.status === "unmatched"}
                <em>no match</em>
              {:else if row.status === "matched" && (c.phase === "matched" || c.phase === "creating")}
                <label class="keep">
                  <input type="checkbox" bind:checked={row.included} />
                  keep
                </label>
              {/if}
            </span>
          </li>
        {/each}
      </ol>
    {/if}

    {#if c.error}
      <p class="error">{c.error}</p>
    {/if}
  </main>

  <footer>
    <span>A small tool for moving music between places.</span>
    <nav>
      <a href="https://github.com/davidumoru/crossfade" target="_blank" rel="noopener">source</a>
      <a href="https://x.com/theumoru" target="_blank" rel="noopener">x</a>
      <a href="https://buymeacoffee.com/theumoru" target="_blank" rel="noopener">buy me a coffee</a>
      <span class="sep" aria-hidden="true"></span>
      <a href="/terms">terms</a>
      <a href="/privacy">privacy</a>
    </nav>
  </footer>
</div>

<style>
  .page {
    --paper: #f6f3ec;
    --ink: #211d18;
    --faint: #797162;
    --rule: #d9d2c3;
    --green: #2f6b4f;
    --red: #a33d2e;

    min-height: 100vh;
    background: var(--paper);
    color: var(--ink);
    font-family: "Newsreader", georgia, serif;
    font-size: 17px;
    line-height: 1.55;
    display: flex;
    flex-direction: column;
  }

  header,
  footer {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 1.5rem 2rem;
  }

  .brand {
    font-family: "Fraunces", serif;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-size: 0.8rem;
    color: inherit;
    text-decoration: none;
    user-select: none;
    -webkit-user-select: none;
  }

  main {
    width: min(40rem, calc(100% - 3rem));
    margin: 0 auto;
    flex: 1;
    padding: 3rem 0 5rem;
  }

  h1 {
    font-family: "Fraunces", serif;
    font-size: clamp(2.2rem, 5.5vw, 3.4rem);
    font-weight: 380;
    line-height: 1.08;
    letter-spacing: -0.01em;
    margin: 0 0 1.25rem;
  }

  h1 em,
  .lede em {
    font-style: italic;
    font-weight: 420;
  }

  .lede {
    color: var(--faint);
    max-width: 32rem;
    margin: 0 0 3rem;
  }

  label[for="url"] {
    display: block;
    font-size: 0.72rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--faint);
    margin-bottom: 0.5rem;
  }

  .input-row,
  .create-row {
    display: flex;
    gap: 1rem;
    align-items: stretch;
  }

  input:not([type="checkbox"]) {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--ink);
    padding: 0.5rem 0;
    font-family: inherit;
    font-size: 1rem;
  }

  input:not([type="checkbox"]):focus {
    outline: none;
    border-bottom-width: 2px;
  }

  .action {
    background: var(--ink);
    color: var(--paper);
    border: none;
    padding: 0.55rem 1.4rem;
    font-family: "Fraunces", serif;
    font-size: 0.95rem;
    cursor: pointer;
    text-decoration: none;
    white-space: nowrap;
  }

  .action:hover:not(:disabled) {
    background: var(--green);
  }

  .action:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .text-btn {
    background: none;
    border: none;
    padding: 0;
    font-family: inherit;
    font-style: italic;
    color: var(--faint);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .text-btn:hover {
    color: var(--ink);
  }

  .playlist-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    border-bottom: 1px solid var(--ink);
    padding-bottom: 0.75rem;
  }

  h2 {
    font-family: "Fraunces", serif;
    font-weight: 420;
    font-size: 1.6rem;
    margin: 0;
  }

  .count {
    color: var(--faint);
    font-style: italic;
    white-space: nowrap;
  }

  .actions {
    display: flex;
    gap: 1.5rem;
    align-items: center;
    margin: 1.5rem 0;
  }

  .progress {
    font-style: italic;
    color: var(--faint);
    margin: 1.5rem 0 0.5rem;
  }

  .bar {
    height: 2px;
    background: var(--rule);
    margin-bottom: 1.5rem;
  }

  .bar-fill {
    height: 100%;
    background: var(--green);
    transition: width 0.3s ease;
  }

  .summary {
    margin: 1.5rem 0 0.75rem;
    font-style: italic;
    color: var(--faint);
  }

  .create-row {
    margin-bottom: 2rem;
  }

  ol {
    list-style: none;
    margin: 1rem 0 0;
    padding: 0;
    font-feature-settings: "onum";
  }

  li {
    display: flex;
    gap: 1rem;
    padding: 0.65rem 0;
    border-bottom: 1px solid var(--rule);
    animation: rise 0.4s ease both;
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
  }

  .num {
    font-family: "Fraunces", serif;
    color: var(--faint);
    min-width: 1.8rem;
  }

  .titles {
    flex: 1;
    min-width: 0;
  }

  .src {
    display: block;
  }

  li.unmatched .src {
    color: var(--faint);
    text-decoration: line-through;
    text-decoration-color: var(--red);
  }

  .match {
    display: block;
    font-size: 0.85rem;
    color: var(--green);
    font-style: italic;
  }

  .status {
    white-space: nowrap;
    font-size: 0.85rem;
    color: var(--faint);
  }

  .keep {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    font-style: italic;
    cursor: pointer;
  }

  .keep input {
    accent-color: var(--green);
  }

  .error {
    color: var(--red);
    font-style: italic;
    margin-top: 1.5rem;
  }

  footer {
    color: var(--faint);
    font-style: italic;
    font-size: 0.85rem;
    border-top: 1px solid var(--rule);
    gap: 1rem;
    flex-wrap: wrap;
  }

  footer nav {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  footer .sep {
    width: 1px;
    height: 0.85em;
    background: var(--rule);
  }

  footer a {
    color: var(--faint);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  footer a:hover {
    color: var(--ink);
  }
</style>
