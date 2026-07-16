<script lang="ts">
  // InterruptCycle -- supporting sim (SIM-02, slides 29-32). Mounts SimFrame
  // (D-11) and renders the exact 6-step interrupt-driven I/O cycle across
  // three actor boxes (Device, CPU, Interrupt Handler). Guided mode steps
  // through the sequence one at a time; Explore mode exposes a single
  // "Trigger interrupt" button that replays the full cycle on demand. The
  // ISR box is a text-driven synthesis of slide 31, not an invented actor
  // (02-RESEARCH.md SIM-02 note).
  import { onMount } from 'svelte';

  import SimFrame from '../../components/SimFrame.svelte';

  import { interruptSteps } from './interrupt-steps';

  let step = $state(0);

  let mode = $state<'guided' | 'explore'>('guided');

  let reducedMotion = $state(false);

  onMount(() => {

    // Checked once at mount, never at module top level (SSR-at-build-time
    // gotcha) -- gates both SimFrame's reduced-motion notice and this
    // widget's own JS-driven signal-pulse animation below.
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const activeActor = $derived(interruptSteps[step].activeActor);

  // "State saved" badge on the CPU box: appears once the CPU saves state
  // (step 3, index 2) and clears again once it resumes (step 6, index 5) --
  // UI-SPEC "Simulation 2" step-by-step spec.
  const stateSavedVisible = $derived(step >= 2 && step <= 4);

  // Which connecting line (if any) carries the in-flight signal at the
  // current step, and which direction it travels -- the interrupt request
  // (Device -> CPU, step 2), the hand-off to the ISR (CPU -> Handler, step
  // 4), and the resume hand-off (Handler -> CPU, step 6). Null on every
  // other step (no signal in flight).
  type SignalLine = { line: 'device-cpu' | 'cpu-handler'; direction: 'forward' | 'reverse' } | null;

  const signal = $derived.by((): SignalLine => {

    if (step === 1) {

      return { line: 'device-cpu', direction: 'forward' };
    }

    if (step === 3) {

      return { line: 'cpu-handler', direction: 'forward' };
    }

    if (step === 5) {

      return { line: 'cpu-handler', direction: 'reverse' };
    }

    return null;
  });

  // Explore mode's own free-exploration affordance (SimFrame's own Previous/
  // Step remain visible but disabled outside Guided mode) -- replays the
  // full 6-step sequence from the top at a fixed pace. `replaying` guards
  // against a second trigger overlapping an in-progress replay.
  let replaying = $state(false);

  async function triggerInterrupt() {

    if (replaying) {

      return;
    }

    replaying = true;

    step = 0;

    // Reduced motion: jump straight through with no animated delay between
    // steps (SimFrame contract's JS-level reduced-motion rule) -- the
    // signal pulse itself is also skipped entirely via the template below.
    const stepDelayMs = reducedMotion ? 0 : 900;

    for (let index = 1; index < interruptSteps.length; index += 1) {

      if (stepDelayMs > 0) {

        await new Promise((resolve) => setTimeout(resolve, stepDelayMs));
      }

      step = index;
    }

    replaying = false;
  }
</script>

<SimFrame
  title="Interrupt-driven I/O cycle"
  caption="Step through how a device interrupt pulls the CPU away from what it's doing, and back again."
  totalSteps={interruptSteps.length}
  bind:step
  bind:mode
  {reducedMotion}
>
  <div class="interrupt-cycle">
    <div
      class="interrupt-cycle__actor"
      class:interrupt-cycle__actor--active={activeActor === 'device'}
    >
      <p class="interrupt-cycle__label">Device</p>
    </div>

    <div class="interrupt-cycle__line">
      {#if !reducedMotion && signal?.line === 'device-cpu'}
        <div class="interrupt-cycle__pulse interrupt-cycle__pulse--device-cpu"></div>
      {/if}
    </div>

    <div
      class="interrupt-cycle__actor"
      class:interrupt-cycle__actor--active={activeActor === 'cpu'}
    >
      <p class="interrupt-cycle__label">CPU</p>

      {#if stateSavedVisible}
        <p class="interrupt-cycle__badge">State saved</p>
      {/if}
    </div>

    <div class="interrupt-cycle__line">
      {#if !reducedMotion && signal?.line === 'cpu-handler'}
        <div
          class="interrupt-cycle__pulse interrupt-cycle__pulse--cpu-handler"
          class:interrupt-cycle__pulse--reverse={signal.direction === 'reverse'}
        ></div>
      {/if}
    </div>

    <div
      class="interrupt-cycle__actor"
      class:interrupt-cycle__actor--active={activeActor === 'handler'}
    >
      <p class="interrupt-cycle__label">Interrupt handler (ISR)</p>
    </div>
  </div>

  {#if mode === 'explore'}
    <div class="interrupt-cycle__explore">
      <button
        type="button"
        class="interrupt-cycle__trigger"
        onclick={triggerInterrupt}
        disabled={replaying}
      >
        Trigger interrupt
      </button>
    </div>
  {/if}
</SimFrame>

<style>
  .interrupt-cycle {
    display: flex;

    flex-direction: column;

    align-items: stretch;
  }

  .interrupt-cycle__actor {
    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

    gap: var(--space-xs);

    min-height: 44px;

    padding: var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-md);

    background: var(--color-surface-raised);

    text-align: center;
  }

  .interrupt-cycle__actor--active {
    border-color: var(--color-accent);

    background: var(--color-accent-wash);
  }

  .interrupt-cycle__label {
    margin: 0;

    font-size: var(--font-size-heading);

    font-weight: var(--font-weight-semibold);

    line-height: var(--line-height-tight);

    color: var(--color-text);
  }

  .interrupt-cycle__badge {
    margin: 0;

    font-size: var(--font-size-label);

    line-height: var(--line-height-snug);

    color: var(--color-text-muted);
  }

  .interrupt-cycle__line {
    position: relative;

    align-self: center;

    width: 2px;

    height: var(--space-lg);

    background: var(--color-border);
  }

  .interrupt-cycle__pulse {
    position: absolute;

    top: 0;

    left: 50%;

    width: 8px;

    height: 8px;

    border-radius: 50%;

    background: var(--color-accent);

    transform: translateX(-50%);

    animation: interrupt-cycle-pulse-vertical 900ms ease-in-out;
  }

  .interrupt-cycle__pulse--reverse {
    animation-direction: reverse;
  }

  @keyframes interrupt-cycle-pulse-vertical {
    from {
      top: 0;
    }

    to {
      top: 100%;
    }
  }

  .interrupt-cycle__explore {
    display: flex;

    justify-content: center;

    margin-top: var(--space-md);
  }

  .interrupt-cycle__trigger {
    min-width: 44px;

    min-height: 44px;

    padding: var(--space-sm) var(--space-lg);

    border: 1px solid var(--color-accent);

    border-radius: var(--radius-sm);

    background: var(--color-accent);

    color: var(--color-bg);

    font-size: var(--font-size-body);

    font-weight: var(--font-weight-semibold);

    cursor: pointer;
  }

  .interrupt-cycle__trigger:disabled {
    opacity: 0.5;

    cursor: not-allowed;
  }

  /* 1024px mirrors --bp-desktop (tokens.css) -- media queries cannot
     reference a CSS custom property in their condition (see SimFrame.svelte
     precedent). Horizontal row layout: Device -- CPU -- Handler, with the
     connecting lines running left-to-right instead of top-to-bottom. */
  @media (min-width: 1024px) {
    .interrupt-cycle {
      flex-direction: row;

      align-items: center;
    }

    .interrupt-cycle__actor {
      flex: 1;
    }

    .interrupt-cycle__line {
      flex: 0 0 var(--space-xl);

      width: auto;

      height: 2px;
    }

    .interrupt-cycle__pulse {
      top: 50%;

      left: 0;

      transform: translateY(-50%);

      animation-name: interrupt-cycle-pulse-horizontal;
    }

    @keyframes interrupt-cycle-pulse-horizontal {
      from {
        left: 0;
      }

      to {
        left: 100%;
      }
    }
  }
</style>
