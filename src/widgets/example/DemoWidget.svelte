<script lang="ts">
  // Throwaway walking-skeleton proof — deleted in Phase 2 with the example
  // chapter (D-07). Its only job is to prove @astrojs/svelte hydration works
  // on the live deploy. Svelte 5 runes only, no localStorage anywhere.
  let count = $state(0);

  function increment() {

    count += 1;
  }
</script>

<div class="demo-widget">
  <p class="demo-widget__label">Hydration proof — click to count:</p>

  <button type="button" onclick={increment}>
    Clicked {count} {count === 1 ? 'time' : 'times'}
  </button>
</div>

<style>
  .demo-widget {
    padding: var(--space-md);

    margin: var(--space-lg) 0;

    border: 1px dashed var(--color-border);

    border-radius: 4px;

    background: var(--color-surface);
  }

  .demo-widget__label {
    margin: 0 0 var(--space-sm) 0;

    color: var(--color-text-muted);

    font-size: 14px;
  }

  button {
    padding: var(--space-sm) var(--space-md);

    border: 1px solid var(--color-accent);

    border-radius: 4px;

    background: var(--color-accent);

    color: var(--color-bg);

    font-weight: 600;

    cursor: pointer;
  }

  button:hover {
    /* No --color-accent-hover token yet in the minimal Task 1 subset (Plan 04
       formalizes it) — opacity dip is a cheap stand-in for a hover state. */
    opacity: 0.85;
  }
</style>
