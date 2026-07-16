<script lang="ts">
  // StorageHierarchy — flagship sim (SIM-01, slide 16). Mounts SimFrame
  // (D-11) and renders the exact 7-tier slide-16 hierarchy as a flipped
  // pyramid via CSS width (no new color tokens). Guided mode steps
  // tier-by-tier top-to-bottom; Explore mode lets the reader tap any tier
  // directly. No numeric speed/size/cost values are ever rendered — the
  // deck states none (D-02/D-03, RESEARCH Pitfall 2); Cost is a qualitative
  // inverse-of-speed corollary explicitly flagged [ASSUMED].
  import { onMount } from 'svelte';

  import SimFrame from '../../components/SimFrame.svelte';

  import { storageTiers } from './storage-tiers';

  let step = $state(0);

  let mode = $state<'guided' | 'explore'>('guided');

  // Explore-mode selection is independent of the guided `step` counter —
  // tapping a tier in Explore mode must not perturb SimFrame's own
  // Previous/Step bookkeeping. `activeIndex` is what the canvas actually
  // renders as "selected".
  let activeIndex = $state(0);

  // While in Guided mode, the selected tier always tracks the current step
  // (Registers selected on mount, advancing top-to-bottom); Reset (which
  // snaps `mode` back to 'guided' and `step` to 0) is naturally covered by
  // this same effect.
  $effect(() => {

    if (mode === 'guided') {

      activeIndex = step;
    }
  });

  let reducedMotion = $state(false);

  onMount(() => {

    // Checked once at mount, never at module top level (SSR-at-build-time
    // gotcha) — only used here to surface SimFrame's reduced-motion notice;
    // this widget's own accordion transition is pure CSS, already zeroed by
    // the sitewide tokens.css reduced-motion rule.
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Geometric width scale: 34% (Registers, index 0) -> 100% (Magnetic
  // tapes, last index) — produces the flipped-pyramid silhouette purely
  // via CSS width, zero new color tokens (UI-SPEC "Simulation 1 — Layout").
  const MIN_WIDTH_PERCENT = 34;

  const MAX_WIDTH_PERCENT = 100;

  function tierWidthPercent(index: number, total: number): number {

    if (total <= 1) {

      return MAX_WIDTH_PERCENT;
    }

    const ratio = Math.pow(MAX_WIDTH_PERCENT / MIN_WIDTH_PERCENT, index / (total - 1));

    return MIN_WIDTH_PERCENT * ratio;
  }

  function selectTier(index: number) {

    if (mode === 'explore') {

      activeIndex = index;
    }
  }
</script>

<SimFrame
  title="Storage-device hierarchy"
  caption="Step through the hierarchy from fastest to slowest, or explore any tier."
  totalSteps={storageTiers.length}
  bind:step
  bind:mode
  {reducedMotion}
>
  <div class="storage-hierarchy">
    {#each storageTiers as tier, index (tier.name)}
      {@const selected = index === activeIndex}

      {@const widthPercent = tierWidthPercent(index, storageTiers.length)}

      <div class="storage-hierarchy__row-wrap">
        <button
          type="button"
          class="storage-hierarchy__row"
          class:storage-hierarchy__row--selected={selected}
          style={`width: ${widthPercent}%;`}
          disabled={mode !== 'explore'}
          aria-pressed={selected}
          aria-label={`${tier.name}${selected ? ', selected' : ''}`}
          onclick={() => selectTier(index)}
        >
          {tier.name}
        </button>

        {#if selected}
          <div class="storage-hierarchy__detail" style={`width: ${widthPercent}%;`}>
            <div class="storage-hierarchy__stat">
              <p class="eyebrow">Speed</p>

              <p class="storage-hierarchy__stat-value">{tier.speed}</p>
            </div>

            <div class="storage-hierarchy__stat">
              <p class="eyebrow">Size</p>

              <p class="storage-hierarchy__stat-value">{tier.size}</p>
            </div>

            <div class="storage-hierarchy__stat">
              <p class="eyebrow">Cost</p>

              <p class="storage-hierarchy__stat-value">{tier.cost}</p>
            </div>

            <div class="storage-hierarchy__stat">
              <p class="eyebrow">Volatility</p>

              <p class="storage-hierarchy__stat-value">{tier.volatile ? 'Volatile' : 'Nonvolatile'}</p>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</SimFrame>

<style>
  .storage-hierarchy {
    display: flex;

    flex-direction: column;

    align-items: center;

    gap: var(--space-sm);
  }

  .storage-hierarchy__row-wrap {
    display: flex;

    flex-direction: column;

    align-items: center;

    width: 100%;
  }

  .storage-hierarchy__row {
    display: flex;

    align-items: center;

    justify-content: center;

    min-height: 44px;

    padding: var(--space-sm) var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-sm);

    background: var(--color-surface-raised);

    color: var(--color-text);

    font-size: var(--font-size-body);

    font-weight: var(--font-weight-regular);

    line-height: var(--line-height-relaxed);

    cursor: pointer;
  }

  .storage-hierarchy__row:disabled {
    cursor: default;
  }

  /* Desktop-only hover, non-selected rows: border-only recipe (matches the
     existing chapter-nav-link hover) — no background change, keeps hover
     visually distinct from the selected/accent-wash state. */
  @media (hover: hover) {
    .storage-hierarchy__row:not(.storage-hierarchy__row--selected):not(:disabled):hover {
      border-color: color-mix(in srgb, var(--color-text) 30%, var(--color-border));
    }
  }

  .storage-hierarchy__row--selected {
    border-color: var(--color-accent);

    background: var(--color-accent-wash);

    font-weight: var(--font-weight-semibold);
  }

  .storage-hierarchy__detail {
    display: grid;

    grid-template-columns: 1fr 1fr;

    gap: var(--space-sm);

    margin-top: var(--space-xs);

    padding: var(--space-sm) var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-sm);

    background: var(--color-surface);
  }

  .storage-hierarchy__stat-value {
    margin: 0;

    font-size: var(--font-size-body);

    line-height: var(--line-height-relaxed);

    color: var(--color-text);
  }
</style>
