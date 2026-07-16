<script lang="ts">
  // SimFrame — shared guided/explore chrome every Ch1+ sim mounts inside
  // (D-11, foundation exception). A Svelte component, not an Astro wrapper:
  // wrapping the canvas in an .astro shell would split the chrome and the
  // sim's own state across two separate hydration boundaries, so the Reset
  // control could never reach the sim's `step` state. Imported directly
  // inside each widget's own .svelte file instead (see 02-UI-SPEC.md).
  //
  // The Previous/Step/Reset icons below are inline SVG mirrors of the
  // shared icon-grammar files (ChevronLeft.astro / ChevronRight.astro /
  // RotateCcw.astro) rather than imports of those files: an .astro
  // component compiles to an Astro-runtime-only render function and has no
  // client-side representation a Svelte component can mount, so it cannot
  // be imported into a .svelte file. Reproducing the same path data here
  // keeps the glyphs visually identical without a broken cross-framework
  // import.
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;

    caption: string;

    totalSteps: number;

    step?: number;

    mode?: 'guided' | 'explore';

    reducedMotion?: boolean;

    children?: Snippet;
  }

  let {
    title,
    caption,
    totalSteps,
    step = $bindable(0),
    mode = $bindable('guided'),
    reducedMotion = false,
    children,
  }: Props = $props();

  // Explore unlocks the first time the reader reaches the final guided
  // step, then stays unlocked for the rest of the page's lifetime —
  // session-only state, never persisted to browser storage (D-11).
  let exploreUnlocked = $state(false);

  const isFinalStep = $derived(step === totalSteps - 1);

  $effect(() => {

    if (mode === 'guided' && isFinalStep) {

      exploreUnlocked = true;
    }
  });

  function goPrevious() {

    if (step > 0) {

      step -= 1;
    }
  }

  function goNext() {

    if (step < totalSteps - 1) {

      step += 1;
    }
  }

  function reset() {

    step = 0;

    mode = 'guided';
  }

  function selectMode(next: 'guided' | 'explore') {

    if (next === 'explore' && !exploreUnlocked) {

      return;
    }

    mode = next;
  }

  // Bonus keyboard layer beyond native <button> focus/Enter/Space (SimFrame
  // contract's "Keyboard" rule) — ArrowLeft/ArrowRight mirror Previous/Step,
  // Home mirrors Reset, while any control in the row has focus.
  function onControlsKeydown(event: KeyboardEvent) {

    if (event.key === 'ArrowLeft') {

      event.preventDefault();

      goPrevious();
    } else if (event.key === 'ArrowRight') {

      event.preventDefault();

      goNext();
    } else if (event.key === 'Home') {

      event.preventDefault();

      reset();
    }
  }
</script>

<div class="sim-frame">
  <div class="sim-frame__header">
    <p class="eyebrow">Simulation</p>

    <h3 class="sim-frame__title">{title}</h3>

    <p class="sim-frame__caption">{caption}</p>

    {#if reducedMotion}
      <p class="sim-frame__reduced-motion-notice">Reduced motion is on — steps update instantly.</p>
    {/if}
  </div>

  <div class="sim-frame__mode-toggle" role="radiogroup" aria-label="Simulation mode">
    <button
      type="button"
      role="radio"
      aria-checked={mode === 'guided'}
      class="sim-frame__mode-segment"
      class:sim-frame__mode-segment--active={mode === 'guided'}
      onclick={() => selectMode('guided')}
    >
      Guided
    </button>

    <button
      type="button"
      role="radio"
      aria-checked={mode === 'explore'}
      aria-disabled={!exploreUnlocked}
      class="sim-frame__mode-segment"
      class:sim-frame__mode-segment--active={mode === 'explore'}
      class:sim-frame__mode-segment--locked={!exploreUnlocked}
      onclick={() => selectMode('explore')}
    >
      Explore
    </button>
  </div>

  <div class="sim-frame__canvas">
    {@render children?.()}
  </div>

  <div class="sim-frame__step-strip">
    {#if mode === 'guided' && isFinalStep}
      <p class="sim-frame__step-complete">Sequence complete — switch to Explore to try it yourself.</p>
    {:else}
      <p class="eyebrow sim-frame__step-indicator">Step {step + 1} of {totalSteps}</p>
    {/if}
  </div>

  <div class="sim-frame__controls" role="group" aria-label="Simulation controls">
    <button
      type="button"
      class="sim-frame__control sim-frame__control--previous"
      onclick={goPrevious}
      onkeydown={onControlsKeydown}
      disabled={mode !== 'guided' || step === 0}
      aria-label="Go to previous step"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M15 6l-6 6 6 6" />
      </svg>

      <span>Previous</span>
    </button>

    <button
      type="button"
      class="sim-frame__control sim-frame__control--step"
      onclick={goNext}
      onkeydown={onControlsKeydown}
      disabled={mode !== 'guided' || isFinalStep}
      aria-label="Advance to next step"
    >
      <span>Step</span>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>

    <button
      type="button"
      class="sim-frame__control sim-frame__control--reset"
      onclick={reset}
      onkeydown={onControlsKeydown}
    >
      <!-- Reset glyph — inline mirror of RotateCcw.astro's path data (an
           .astro icon component cannot be imported into a .svelte file;
           see the script-block comment above). -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>

      <span>Reset</span>
    </button>
  </div>
</div>

<style>
  .sim-frame {
    margin: var(--space-lg) 0;

    border: 1px solid var(--color-border);

    border-radius: var(--radius-lg);

    background: var(--color-surface-raised);

    box-shadow: var(--shadow-sm);
  }

  .sim-frame__header {
    padding: var(--space-md);
  }

  .sim-frame__title {
    margin: var(--space-xs) 0 0 0;

    font-size: var(--font-size-heading);

    font-weight: var(--font-weight-semibold);

    line-height: var(--line-height-tight);

    color: var(--color-text);
  }

  .sim-frame__caption {
    margin: var(--space-xs) 0 0 0;

    font-size: var(--font-size-body);

    line-height: var(--line-height-relaxed);

    color: var(--color-text-muted);
  }

  .sim-frame__reduced-motion-notice {
    margin: var(--space-xs) 0 0 0;

    font-size: var(--font-size-label);

    line-height: var(--line-height-snug);

    color: var(--color-text-muted);
  }

  .sim-frame__mode-toggle {
    display: flex;

    justify-content: flex-end;

    gap: var(--space-xs);

    padding: 0 var(--space-md) var(--space-md);
  }

  .sim-frame__mode-segment {
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

  .sim-frame__mode-segment--active {
    border-color: var(--color-accent);

    background: var(--color-accent-wash);

    color: var(--color-text);

    font-weight: var(--font-weight-semibold);
  }

  .sim-frame__mode-segment--locked {
    color: var(--color-text-muted);

    opacity: 0.5;

    cursor: not-allowed;
  }

  .sim-frame__canvas {
    min-height: 320px;

    margin: 0 var(--space-md);

    padding: var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-md);

    background: var(--color-surface);
  }

  /* 1024px mirrors --bp-desktop (tokens.css) — media queries cannot
     reference a CSS custom property in their condition. */
  @media (min-width: 1024px) {
    .sim-frame__canvas {
      min-height: 380px;
    }
  }

  .sim-frame__step-strip {
    padding: var(--space-sm) var(--space-md) 0;
  }

  .sim-frame__step-indicator {
    margin: 0;
  }

  .sim-frame__step-complete {
    margin: 0;

    font-size: var(--font-size-body);

    line-height: var(--line-height-relaxed);

    color: var(--color-text-muted);
  }

  .sim-frame__controls {
    display: flex;

    gap: var(--space-sm);

    padding: var(--space-md);
  }

  .sim-frame__control {
    display: flex;

    align-items: center;

    justify-content: center;

    gap: var(--space-xs);

    min-width: 44px;

    min-height: 44px;

    padding: var(--space-sm) var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-sm);

    background: transparent;

    color: var(--color-text);

    font-size: var(--font-size-body);

    font-weight: var(--font-weight-regular);

    cursor: pointer;
  }

  .sim-frame__control:disabled {
    opacity: 0.5;

    cursor: not-allowed;
  }

  .sim-frame__control--step {
    flex: 1;

    border-color: var(--color-accent);

    background: var(--color-accent);

    color: var(--color-bg);

    font-weight: var(--font-weight-semibold);
  }

  .sim-frame__control--reset {
    border-color: transparent;

    color: var(--color-text-muted);
  }
</style>
