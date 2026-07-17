<script lang="ts">
  // SyscallJourney — traces fork() → exec() → wait() → exit() as a live,
  // running-process sequence (slides 22-36), with the CPU mode bit flipping on
  // every trap. Mounts SimFrame (D-11) for the shared Guided/Explore chrome:
  // Guided steps through the sequence; Explore replays the whole thing on demand.
  // The concrete counterpart to Chapter 1's static mode-transition figure. Step
  // data lives in syscall-journey-steps.ts (framework-free, testable).
  import { onMount } from 'svelte';

  import SimFrame from '../../components/SimFrame.svelte';

  import { syscallJourneySteps } from './syscall-journey-steps';

  let step = $state(0);

  let mode = $state<'guided' | 'explore'>('guided');

  let reducedMotion = $state(false);

  onMount(() => {

    // Checked once at mount, never at module top level (SSR-at-build-time
    // gotcha) — gates SimFrame's reduced-motion notice and this widget's
    // replay pacing below.
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const current = $derived(syscallJourneySteps[step]);

  const parentActive = $derived(current.active === 'parent' || current.active === 'both');

  const childActive = $derived(current.active === 'child' || current.active === 'both');

  // Explore-mode replay — mirrors InterruptCycle's cancellable loop. `replaying`
  // guards against overlapping triggers; `replayToken` is a monotonic id the
  // loop re-reads after every await, bailing before mutating `step` once its own
  // token is stale (Reset/leaving Explore bumps it).
  let replaying = $state(false);

  let replayToken = 0;

  function cancelReplay() {

    replayToken += 1;

    replaying = false;
  }

  // Leaving Explore — including SimFrame's Reset, which snaps `mode` back to
  // 'guided' — must stop an in-flight replay at once, or the two-way-bound
  // `step` would keep advancing on its own.
  $effect(() => {

    if (mode !== 'explore') {

      cancelReplay();
    }
  });

  async function runSequence() {

    if (replaying) {

      return;
    }

    replaying = true;

    const token = (replayToken += 1);

    step = 0;

    // Reduced motion: jump straight to the end state with no per-step delay.
    const stepDelayMs = reducedMotion ? 0 : 1100;

    for (let index = 1; index < syscallJourneySteps.length; index += 1) {

      if (stepDelayMs > 0) {

        await new Promise((resolve) => setTimeout(resolve, stepDelayMs));
      }

      // Cancelled (Reset / left Explore) or superseded by a newer run — never
      // mutate `step` once our token is stale.
      if (token !== replayToken) {

        return;
      }

      step = index;
    }

    replaying = false;
  }
</script>

<SimFrame
  title="From fork() to a running program"
  caption="Step through how a shell launches a program — and watch the CPU mode bit flip on every system call."
  totalSteps={syscallJourneySteps.length}
  bind:step
  bind:mode
  {reducedMotion}
>
  <div class="journey">
    <div class="journey__mode" data-mode={current.mode}>
      <span class="journey__mode-label">CPU mode</span>

      <span class="journey__mode-value">{current.mode === 'kernel' ? 'KERNEL' : 'USER'}</span>
    </div>

    <div class="journey__processes">
      <div class="journey__proc" class:journey__proc--active={parentActive}>
        <p class="journey__proc-name">Parent — shell</p>

        <p class="journey__proc-status">{current.parentStatus}</p>
      </div>

      {#if current.childPresent}
        <div class="journey__proc" class:journey__proc--active={childActive}>
          <p class="journey__proc-name">{current.childLabel}</p>

          <p class="journey__proc-status">{current.childStatus}</p>
        </div>
      {:else}
        <div class="journey__proc journey__proc--empty">
          <p class="journey__proc-status">no child process yet</p>
        </div>
      {/if}
    </div>

    <div class="journey__trap" class:journey__trap--active={current.mode === 'kernel'}>
      {#if current.syscall}
        <span class="journey__syscall">{current.syscall}</span>

        <span class="journey__trap-note">traps into the kernel</span>
      {:else}
        <span class="journey__trap-note">running in user mode — no trap</span>
      {/if}
    </div>

    {#if mode === 'explore'}
      <div class="journey__explore">
        <button type="button" class="journey__run" onclick={runSequence} disabled={replaying}>
          Run sequence
        </button>
      </div>
    {/if}
  </div>
</SimFrame>

<style>
  .journey {
    display: flex;

    flex-direction: column;

    gap: var(--space-md);
  }

  .journey__mode {
    display: flex;

    align-items: center;

    justify-content: space-between;

    padding: var(--space-sm) var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-md);

    background: var(--color-surface-raised);
  }

  .journey__mode-label {
    font-size: var(--font-size-micro);

    font-weight: var(--font-weight-semibold);

    letter-spacing: 0.04em;

    text-transform: uppercase;

    color: var(--color-text-muted);
  }

  .journey__mode-value {
    font-family: var(--font-mono);

    font-size: var(--font-size-heading);

    font-weight: var(--font-weight-semibold);

    letter-spacing: 0.04em;

    color: var(--color-text-muted);
  }

  /* Kernel mode lights the indicator accent; user mode stays neutral. The
     data-attribute selector keeps the two states declarative. */
  .journey__mode[data-mode='kernel'] {
    border-color: var(--color-accent);

    background: var(--color-accent-wash);
  }

  .journey__mode[data-mode='kernel'] .journey__mode-value {
    color: var(--color-accent);
  }

  .journey__processes {
    display: flex;

    flex-direction: column;

    gap: var(--space-sm);
  }

  .journey__proc {
    padding: var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-md);

    background: var(--color-surface-raised);
  }

  .journey__proc--active {
    border-color: var(--color-accent);

    background: var(--color-accent-wash);
  }

  .journey__proc--empty {
    border-style: dashed;

    background: transparent;

    text-align: center;
  }

  .journey__proc-name {
    margin: 0;

    font-size: var(--font-size-body);

    font-weight: var(--font-weight-semibold);

    line-height: var(--line-height-tight);

    color: var(--color-text);
  }

  .journey__proc-status {
    margin: var(--space-xs) 0 0 0;

    font-size: var(--font-size-label);

    line-height: var(--line-height-snug);

    color: var(--color-text-muted);

    text-wrap: pretty;
  }

  .journey__proc--empty .journey__proc-status {
    margin: 0;
  }

  .journey__trap {
    display: flex;

    flex-wrap: wrap;

    align-items: baseline;

    gap: var(--space-sm);

    padding: var(--space-sm) var(--space-md);

    border: 1px dashed var(--color-border);

    border-radius: var(--radius-md);

    background: var(--color-surface);
  }

  .journey__trap--active {
    border-style: solid;

    border-color: var(--color-accent);

    background: var(--color-accent-wash-strong);
  }

  .journey__syscall {
    font-family: var(--font-mono);

    font-size: var(--font-size-body);

    font-weight: var(--font-weight-semibold);

    color: var(--color-text);
  }

  .journey__trap-note {
    font-size: var(--font-size-label);

    line-height: var(--line-height-snug);

    color: var(--color-text-muted);
  }

  .journey__explore {
    display: flex;

    justify-content: center;
  }

  .journey__run {
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

  .journey__run:disabled {
    opacity: 0.5;

    cursor: not-allowed;
  }

  /* 1024px mirrors --bp-desktop — the two process boxes sit side by side once
     there's width, echoing InterruptCycle's row layout. */
  @media (min-width: 1024px) {
    .journey__processes {
      flex-direction: row;
    }

    .journey__proc {
      flex: 1;
    }
  }
</style>
