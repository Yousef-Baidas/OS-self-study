<script lang="ts">
  // StateTrace — slide 13's worked example as a scrubbable timeline (slides 13-14).
  //
  // The chapter already prints the answer table, so the sim's contribution is not the
  // data: it is being able to stop at a millisecond and read off what each process is
  // doing, which is what makes "ready" and "waiting" separable rather than two words.
  //
  // Nothing here computes the schedule. src/lib/round-robin derives it from the burst
  // specification in ./round-robin-trace and is checked against the chapter's published
  // table; src/lib/trace-layout turns it into tiled geometry per docs/FIGURES.md. This
  // file places the result and handles the scrubbing.
  import SimFrame from '../../components/SimFrame.svelte';

  import { stateAt } from '../../lib/round-robin';

  import { TRACE, layoutTrace, tickMarks } from '../../lib/trace-layout';

  import { ROUND_ROBIN_QUANTUM, roundRobinSchedule, traceNotes } from './round-robin-trace';

  let step = $state(0);

  let mode = $state<'guided' | 'explore'>('guided');

  // Explore's free scrub position, in milliseconds.
  let scrub = $state(0);

  // Keep the scrub parked on the guided position while Guided is active, so entering
  // Explore continues from the moment the reader was looking at rather than jumping to
  // zero — and so SimFrame's Reset (which snaps mode and step) also rewinds the scrub.
  $effect(() => {

    if (mode !== 'explore') {

      scrub = traceNotes[step].at;
    }
  });

  const time = $derived(mode === 'explore' ? scrub : traceNotes[step].at);

  const layout = $derived(layoutTrace(roundRobinSchedule, time));

  const ticks = tickMarks(roundRobinSchedule, ROUND_ROBIN_QUANTUM);

  // Derived rather than a plain const: `layout` is reactive, so reading it once would
  // capture only its first value — harmless while the row count is fixed at three, but
  // exactly the latent bug svelte-check is pointing at.
  const axisY = $derived(
    TRACE.top + layout.rows.length * TRACE.rowPitch - (TRACE.rowPitch - TRACE.rowHeight),
  );

  // The most recent note at or before the current moment — in Guided that is exactly
  // the step's own note; in Explore it is whichever one the reader has scrubbed past.
  const note = $derived(
    [...traceNotes].reverse().find((candidate) => candidate.at <= time) ?? traceNotes[0],
  );

  const onCpu = $derived(
    roundRobinSchedule.slices.find((slice) => time >= slice.from && time < slice.to)?.pid ?? null,
  );

  const states = $derived(
    layout.rows.map((row) => ({ pid: row.pid, state: stateAt(roundRobinSchedule, row.pid, time) })),
  );
</script>

<SimFrame
  title="Round-robin with a 4 ms quantum"
  caption="Three processes, one CPU. Stop anywhere in the run and read off what each process is doing — and why ready is not the same as waiting."
  totalSteps={traceNotes.length}
  bind:step
  bind:mode
>
  <div class="trace">
    <div class="trace__readout">
      <span class="trace__time">{time}<span class="trace__unit">ms</span></span>

      <span class="trace__cpu">on CPU: <strong>{onCpu ?? 'idle'}</strong></span>
    </div>

    <ul class="trace__states">
      {#each states as entry (entry.pid)}
        <li class="trace__state" data-state={entry.state}>
          <span class="trace__state-pid">{entry.pid}</span>

          <span class="trace__state-name">{entry.state}</span>
        </li>
      {/each}
    </ul>

    <svg
      class="trace__svg"
      viewBox={layout.viewBox}
      role="img"
      aria-label="Timeline of three processes over {roundRobinSchedule.endTime} milliseconds. At {time} milliseconds: {states
        .map((entry) => `${entry.pid} is ${entry.state}`)
        .join(', ')}."
    >
      <defs>
        <!-- Suffixed per docs/FIGURES.md rule 7 — inline SVG shares one document ID
             space with every figure on the page. Same hatch vocabulary memory-layout.svg
             uses for unallocated memory: a terminated process is the temporal version of
             a deliberately empty region. Texture rather than a fifth fill, because two
             more near-luminance greys are indistinguishable in dark mode. -->
        <pattern
          id="hatch-st"
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="7" class="fg-hatch" />
        </pattern>
      </defs>

      {#each layout.rows as row (row.pid)}
        <!-- Label in the left gutter, which no segment or connector crosses (rule 5). -->
        <text
          x={TRACE.left - 10}
          y={row.y + TRACE.rowHeight / 2}
          class="fg-text fg-mono"
          font-size="13"
          text-anchor="end"
          dominant-baseline="central"
        >
          {row.pid}
        </text>

        {#each row.segments as segment (segment.from)}
          <!-- Square corners and shared edges: a contiguous timeline tiles (rule 4).
               Width is derived from the two boundaries here rather than stored, so the
               seam between neighbours stays exact. -->
          <rect
            x={segment.x}
            y={row.y}
            width={segment.xEnd - segment.x}
            height={TRACE.rowHeight}
            class="seg seg--{segment.state}"
          />
        {/each}
      {/each}

      {#each ticks as tick (tick.t)}
        <line x1={tick.x} y1={axisY} x2={tick.x} y2={axisY + 5} class="trace__tick" />

        <text
          x={tick.x}
          y={axisY + 16}
          class="fg-text-muted"
          font-size="11"
          text-anchor="middle"
          dominant-baseline="hanging"
        >
          {tick.t}
        </text>
      {/each}

      <line
        x1={layout.playheadX}
        y1={TRACE.top - 6}
        x2={layout.playheadX}
        y2={axisY}
        class="trace__playhead"
      />
    </svg>

    <p class="trace__note" aria-live="polite">{note.text}</p>

    {#if mode === 'explore'}
      <label class="trace__scrub">
        <span class="trace__scrub-label">Scrub the run</span>

        <input
          type="range"
          min="0"
          max={roundRobinSchedule.endTime}
          step="1"
          bind:value={scrub}
          aria-valuetext="{scrub} milliseconds"
        />
      </label>
    {/if}
  </div>
</SimFrame>

<style>
  .trace {
    display: flex;

    flex-direction: column;

    gap: var(--space-md);
  }

  .trace__readout {
    display: flex;

    align-items: baseline;

    gap: var(--space-sm);
  }

  .trace__time {
    font-family: var(--font-mono);

    font-size: var(--font-size-display);

    font-weight: var(--font-weight-semibold);

    line-height: 1;

    color: var(--color-accent);
  }

  .trace__unit {
    margin-left: 0.15em;

    font-size: var(--font-size-label);

    color: var(--color-text-muted);
  }

  .trace__cpu {
    font-size: var(--font-size-label);

    color: var(--color-text-muted);
  }

  .trace__states {
    display: flex;

    flex-wrap: wrap;

    gap: var(--space-xs);

    margin: 0;

    padding: 0;

    list-style: none;
  }

  .trace__state {
    display: flex;

    align-items: baseline;

    gap: var(--space-xs);

    padding: var(--space-xs) var(--space-sm);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-sm);
  }

  .trace__state-pid {
    font-family: var(--font-mono);

    font-size: var(--font-size-label);

    font-weight: var(--font-weight-semibold);

    color: var(--color-text);
  }

  .trace__state-name {
    font-size: var(--font-size-micro);

    letter-spacing: 0.04em;

    text-transform: uppercase;

    color: var(--color-text-muted);
  }

  /* The chips carry the same four colours as the timeline, so a reader can match a
     band to a name without a separate legend. */
  .trace__state[data-state='running'] {
    border-color: var(--color-accent);

    background: var(--color-accent);
  }

  .trace__state[data-state='running'] .trace__state-pid,
  .trace__state[data-state='running'] .trace__state-name {
    color: var(--color-accent-ink);
  }

  .trace__state[data-state='ready'] {
    border-color: var(--color-accent);

    background: var(--color-accent-wash);
  }

  .trace__state[data-state='waiting'] {
    border-color: var(--color-warning);

    background: var(--color-warning-wash);
  }

  .trace__svg {
    display: block;

    width: 100%;

    height: auto;
  }

  /* Four distinct, fully tokenised fills. docs/FIGURES.md rule 8 bans hex values and
     opacity tints, not component-scoped classes — and the .fg-* set has no way to tell
     ready from waiting, which is precisely the distinction this figure exists to make.
     Running is solid accent because it is what the figure is about; ready shares the
     accent hue because a ready process is runnable; waiting takes the warning hue
     because a blocked process is not; terminated is inert surface. */
  .seg {
    stroke-width: 1;
  }

  .seg--running {
    fill: var(--color-accent);

    stroke: var(--color-accent);
  }

  .seg--ready {
    fill: var(--color-accent-wash);

    stroke: var(--color-border);
  }

  .seg--waiting {
    fill: var(--color-warning-wash);

    stroke: var(--color-warning);
  }

  /* Hatched rather than filled: ready and terminated as two flat tokens were nearly
     the same luminance in light mode and identical in dark. */
  .seg--terminated {
    fill: url(#hatch-st);

    stroke: var(--color-border);
  }

  .trace__tick {
    stroke: var(--color-text-muted);

    stroke-width: 1;
  }

  .trace__playhead {
    stroke: var(--color-text);

    stroke-width: 2;

    stroke-linecap: round;
  }

  .trace__note {
    margin: 0;

    font-size: var(--font-size-body);

    line-height: var(--line-height-relaxed);

    color: var(--color-text-muted);

    text-wrap: pretty;
  }

  .trace__scrub {
    display: flex;

    flex-direction: column;

    gap: var(--space-xs);
  }

  .trace__scrub-label {
    font-size: var(--font-size-micro);

    font-weight: var(--font-weight-semibold);

    letter-spacing: 0.04em;

    text-transform: uppercase;

    color: var(--color-text-muted);
  }

  .trace__scrub input {
    width: 100%;

    min-height: 44px;

    accent-color: var(--color-accent);
  }
</style>
