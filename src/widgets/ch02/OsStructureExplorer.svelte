<script lang="ts">
  // OsStructureExplorer — the chapter's marquee comparison (slides 40-53).
  // A segmented radiogroup switches between the five ways to structure an OS;
  // the diagram below re-renders to show where each model's components sit
  // relative to the user/kernel boundary, and the panel explains how they
  // communicate, an example OS, and the trade-offs. Not a SimFrame stepper —
  // there is no sequence, just a live side-by-side you drive. Data (and the
  // three render `kind`s) live in os-structures.ts.
  import { osStructures } from './os-structures';

  import { nextRovingIndex } from '../../lib/roving-index';

  let selectedId = $state(osStructures[0].id);

  // Non-null: selectedId only ever holds an id from the same array.
  const current = $derived(osStructures.find((structure) => structure.id === selectedId)!);

  // Split each trade-off's leading +/− marker from its text so the sign can be
  // coloured (strength vs cost) independently of the wording.
  const tradeoffs = $derived(
    current.tradeoffs.map((line) => ({ positive: line.startsWith('+'), text: line.slice(1).trim() })),
  );

  // Refs for roving-tabindex focus movement across the segmented control.
  let segments = $state<HTMLButtonElement[]>([]);

  function onSegmentKeydown(event: KeyboardEvent, index: number) {

    const nextIndex = nextRovingIndex(event.key, index, osStructures.length);

    if (nextIndex === null) {

      return;
    }

    // Radiogroup convention: moving selection also moves focus onto the newly
    // selected segment, and arrow keys don't scroll the page.
    event.preventDefault();

    selectedId = osStructures[nextIndex].id;

    segments[nextIndex]?.focus();
  }
</script>

<div class="osx">
  <div class="osx__header">
    <p class="eyebrow">Explore</p>

    <h3 class="osx__title">Operating-system structure</h3>

    <p class="osx__caption">Switch between the five models — watch where the components move and how they talk.</p>
  </div>

  <div class="osx__segments" role="radiogroup" aria-label="Operating-system structure">
    {#each osStructures as structure, index (structure.id)}
      <button
        type="button"
        role="radio"
        bind:this={segments[index]}
        tabindex={structure.id === selectedId ? 0 : -1}
        aria-checked={structure.id === selectedId}
        class="osx__segment"
        class:osx__segment--active={structure.id === selectedId}
        onclick={() => (selectedId = structure.id)}
        onkeydown={(event) => onSegmentKeydown(event, index)}
      >
        {structure.name}
      </button>
    {/each}
  </div>

  <p class="osx__tagline">{current.tagline}</p>

  <div class="osx__diagram">
    {#if current.kind === 'split'}
      <div class="osx-band osx-band--user">
        <p class="osx-band__label">User space</p>

        <div class="osx-chips">
          {#each current.userspace ?? [] as block (block)}
            <span class="osx-chip">{block}</span>
          {/each}
        </div>
      </div>

      <div class="osx-divider"><span>system-call interface</span></div>

      <div class="osx-band osx-band--kernel">
        <p class="osx-band__label">{current.kernelLabel ?? 'Kernel'}</p>

        <div class="osx-chips">
          {#each current.kernelspace ?? [] as block (block)}
            <span class="osx-chip osx-chip--kernel">{block}</span>
          {/each}
        </div>
      </div>
    {:else if current.kind === 'layered'}
      <div class="osx-layers">
        {#each [...(current.layers ?? [])].reverse() as layer, index (layer)}
          <div
            class="osx-layer"
            class:osx-layer--base={index === (current.layers?.length ?? 0) - 1}
          >
            {layer}
          </div>
        {/each}
      </div>

      <p class="osx-hint">each layer uses only the layer directly below it</p>
    {:else}
      <div class="osx-modular">
        <div class="osx-core">{current.core}</div>

        <div class="osx-chips osx-chips--modules">
          {#each current.modules ?? [] as module (module)}
            <span class="osx-chip osx-chip--module">{module}</span>
          {/each}
        </div>

        <p class="osx-hint">loadable modules, linked over known interfaces</p>
      </div>
    {/if}
  </div>

  <dl class="osx-info">
    <div class="osx-info__row">
      <dt>Communication</dt>

      <dd>{current.comm}</dd>
    </div>

    <div class="osx-info__row">
      <dt>Example</dt>

      <dd>{current.example}</dd>
    </div>
  </dl>

  <ul class="osx-tradeoffs">
    {#each tradeoffs as tradeoff (tradeoff.text)}
      <li class="osx-tradeoff">
        <span
          class="osx-tradeoff__sign"
          class:osx-tradeoff__sign--plus={tradeoff.positive}
          class:osx-tradeoff__sign--minus={!tradeoff.positive}
          aria-hidden="true"
        >
          {tradeoff.positive ? '+' : '−'}
        </span>

        <span>{tradeoff.text}</span>
      </li>
    {/each}
  </ul>
</div>

<style>
  .osx {
    margin: var(--space-lg) 0;

    border: 1px solid var(--color-border);

    border-radius: var(--radius-lg);

    background: var(--color-surface-raised);

    box-shadow: var(--shadow-sm);
  }

  .osx__header {
    padding: var(--space-md) var(--space-md) 0;
  }

  .osx__title {
    margin: var(--space-xs) 0 0 0;

    font-size: var(--font-size-heading);

    font-weight: var(--font-weight-semibold);

    line-height: var(--line-height-tight);

    color: var(--color-text);
  }

  .osx__caption {
    margin: var(--space-xs) 0 0 0;

    font-size: var(--font-size-body);

    line-height: var(--line-height-relaxed);

    color: var(--color-text-muted);

    text-wrap: pretty;
  }

  .osx__segments {
    display: flex;

    flex-wrap: wrap;

    gap: var(--space-xs);

    padding: var(--space-md);
  }

  .osx__segment {
    flex: 1 1 auto;

    min-width: 44px;

    min-height: 44px;

    padding: var(--space-sm) var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-sm);

    background: transparent;

    color: var(--color-text-muted);

    font-size: var(--font-size-label);

    font-weight: var(--font-weight-regular);

    cursor: pointer;
  }

  .osx__segment--active {
    border-color: var(--color-accent);

    background: var(--color-accent-wash);

    color: var(--color-text);

    font-weight: var(--font-weight-semibold);
  }

  .osx__tagline {
    margin: 0;

    padding: 0 var(--space-md);

    font-size: var(--font-size-body);

    font-weight: var(--font-weight-semibold);

    line-height: var(--line-height-snug);

    color: var(--color-text);
  }

  .osx__diagram {
    margin: var(--space-md);

    padding: var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-md);

    background: var(--color-surface);
  }

  /* split layout — user band over kernel band, with the syscall boundary between */
  .osx-band {
    padding: var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-md);

    background: var(--color-surface-raised);
  }

  .osx-band--kernel {
    border-color: var(--color-accent);

    background: var(--color-accent-wash);
  }

  .osx-band__label {
    margin: 0 0 var(--space-sm) 0;

    font-size: var(--font-size-label);

    font-weight: var(--font-weight-semibold);

    line-height: var(--line-height-snug);

    color: var(--color-text);
  }

  .osx-chips {
    display: flex;

    flex-wrap: wrap;

    gap: var(--space-xs);
  }

  .osx-chip {
    padding: var(--space-xs) var(--space-sm);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-sm);

    background: var(--color-surface);

    font-size: var(--font-size-label);

    line-height: var(--line-height-snug);

    color: var(--color-text);
  }

  .osx-chip--kernel {
    border-color: var(--color-accent);

    background: var(--color-accent-wash-strong);
  }

  .osx-chip--module {
    border-color: var(--color-accent);
  }

  .osx-divider {
    display: flex;

    align-items: center;

    justify-content: center;

    margin: var(--space-sm) 0;

    color: var(--color-text-muted);

    font-family: var(--font-mono);

    font-size: var(--font-size-micro);

    letter-spacing: 0.04em;

    text-transform: uppercase;
  }

  .osx-divider span {
    padding: 0 var(--space-sm);
  }

  .osx-divider::before,
  .osx-divider::after {
    content: '';

    flex: 1;

    height: 1px;

    background: var(--color-border);
  }

  /* layered layout — full-width bands, hardware/kernel emphasised at the base */
  .osx-layers {
    display: flex;

    flex-direction: column;

    gap: var(--space-xs);
  }

  .osx-layer {
    padding: var(--space-sm) var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-sm);

    background: var(--color-surface-raised);

    font-size: var(--font-size-label);

    line-height: var(--line-height-snug);

    color: var(--color-text);

    text-align: center;
  }

  .osx-layer--base {
    border-color: var(--color-accent);

    background: var(--color-accent-wash);

    font-weight: var(--font-weight-semibold);
  }

  /* modular layout — a core with modules ringed below it */
  .osx-modular {
    display: flex;

    flex-direction: column;

    align-items: center;

    gap: var(--space-sm);
  }

  .osx-core {
    padding: var(--space-sm) var(--space-lg);

    border: 1px solid var(--color-accent);

    border-radius: var(--radius-sm);

    background: var(--color-accent-wash-strong);

    font-size: var(--font-size-body);

    font-weight: var(--font-weight-semibold);

    color: var(--color-text);
  }

  .osx-chips--modules {
    justify-content: center;
  }

  .osx-hint {
    margin: var(--space-sm) 0 0 0;

    font-size: var(--font-size-micro);

    line-height: var(--line-height-snug);

    color: var(--color-text-muted);

    text-align: center;
  }

  .osx-info {
    margin: 0;

    padding: 0 var(--space-md);
  }

  .osx-info__row {
    display: grid;

    grid-template-columns: 1fr;

    gap: 2px;

    padding: var(--space-sm) 0;

    border-top: 1px solid var(--color-border);
  }

  .osx-info dt {
    font-size: var(--font-size-micro);

    font-weight: var(--font-weight-semibold);

    letter-spacing: 0.04em;

    text-transform: uppercase;

    color: var(--color-text-muted);
  }

  .osx-info dd {
    margin: 0;

    font-size: var(--font-size-body);

    line-height: var(--line-height-relaxed);

    color: var(--color-text);

    text-wrap: pretty;
  }

  .osx-tradeoffs {
    margin: 0;

    padding: var(--space-md);

    list-style: none;
  }

  .osx-tradeoff {
    display: flex;

    gap: var(--space-sm);

    padding: var(--space-xs) 0;

    font-size: var(--font-size-body);

    line-height: var(--line-height-relaxed);

    color: var(--color-text);

    text-wrap: pretty;
  }

  .osx-tradeoff__sign {
    flex: none;

    width: 1.4em;

    font-family: var(--font-mono);

    font-weight: var(--font-weight-semibold);

    text-align: center;
  }

  .osx-tradeoff__sign--plus {
    color: var(--color-success);
  }

  .osx-tradeoff__sign--minus {
    color: var(--color-destructive);
  }

  /* 640px — the info rows can afford a label column once there's width. */
  @media (min-width: 640px) {
    .osx-info__row {
      grid-template-columns: 160px 1fr;

      gap: var(--space-md);

      align-items: baseline;
    }
  }
</style>
