<script lang="ts">
  // ForkTree — the chapter's recurring exam question, drawn rather than computed
  // (slides 33-34). Guided walks the three unconditional fork() calls, 1 -> 2 -> 4 -> 8;
  // Explore adds `if (x == 0) fork();` and the count goes to 12.
  //
  // Everything except the markup lives outside this file: the tree itself comes from
  // src/lib/fork-tree (forkStages returns one immutable tree per step, so stepping
  // backwards is an array index — there is no inverse "unfork" to get wrong), the
  // geometry from src/lib/fork-tree-layout, and the captions from ./fork-program.
  // Both libraries are unit-tested; per docs/FIGURES.md that is how a sim canvas
  // satisfies the diagram rules by construction instead of by inspection.
  import SimFrame from '../../components/SimFrame.svelte';

  import { forkStages } from '../../lib/fork-tree';

  import { layoutForkTree } from '../../lib/fork-tree-layout';

  import { conditionalStep, forkProgramLines, forkSteps } from './fork-program';

  let step = $state(0);

  let mode = $state<'guided' | 'explore'>('guided');

  // Explore's toggle for the trailing conditional fork.
  let conditionalOn = $state(false);

  // Five stages: index 0-3 are the guided walk, index 4 adds the conditional fork.
  // Computed once — the program never changes, only which stage is on screen.
  const stages = forkStages({ calls: 3, conditional: true });

  const FINAL = stages.length - 1;

  // SimFrame's Reset snaps mode back to 'guided', which must also drop the
  // conditional — otherwise a reset tree would still be showing twelve processes.
  $effect(() => {

    if (mode !== 'explore') {

      conditionalOn = false;
    }
  });

  // Explore always shows the finished program, with the toggle moving between the 8-
  // and 12-process stages. It ignores `step` deliberately: Explore is unlocked for good
  // once reached, so a reader who steps back to 1 and re-enters would otherwise get a
  // two-process tree beside a switch that jumps it to twelve.
  const stageIndex = $derived(
    mode === 'explore' ? (conditionalOn ? FINAL : FINAL - 1) : Math.min(step, FINAL - 1),
  );

  // Anchored so neither the viewBox nor any box position changes as the reader steps —
  // processes appear, nothing moves. Guided reserves only the eight-process depth, since
  // reserving the conditional's extra row there would leave a fifth of the canvas empty
  // for the whole walk. Switching anchors costs nothing: both trees occupy the same four
  // columns, so entering Explore extends the canvas downward without shifting a box.
  const layout = $derived(
    layoutForkTree(stages[stageIndex], {
      reserveFor: mode === 'explore' ? stages[FINAL] : stages[FINAL - 1],
    }),
  );

  const current = $derived(stageIndex === FINAL ? conditionalStep : forkSteps[stageIndex]);

  // The call that produced the stage on screen — stage n was created by call n-1. It
  // lights both the source line that issued it and the processes it created, so the
  // reader's eye can pair them. The initial process's own bornAt of -1 makes step 0
  // highlight P0, which reads correctly as "this is what you start with".
  const activeCall = $derived(stageIndex - 1);

  const visibleLines = $derived(
    forkProgramLines.filter((line) => mode === 'explore' || !line.conditional),
  );
</script>

<SimFrame
  title="How many processes does this program create?"
  caption="Every fork() doubles the population, because the children created by earlier calls run the later ones too."
  totalSteps={FINAL}
  bind:step
  bind:mode
>
  <div class="fork">
    <div class="fork__readout">
      <span class="fork__count">{current.population}</span>

      <span class="fork__count-label">{current.population === 1 ? 'process' : 'processes'}</span>
    </div>

    <p class="fork__caption" aria-live="polite">{current.caption}</p>

    <div class="fork__panels">
      <div class="fork__tree">
        <svg
          class="fork__svg"
          viewBox={layout.viewBox}
          role="img"
          aria-label="Process tree with {current.population} processes, {layout.connectors
            .length} of them created by a fork() call."
        >
          <defs>
            <!-- Suffixed per docs/FIGURES.md rule 7: inline SVG shares one document
                 ID space with every other figure on the page. refX is the tip's own
                 x, so the arrowhead lands exactly on the path's last coordinate. -->
            <marker
              id="arw-ft"
              markerWidth="10"
              markerHeight="8"
              refX="9"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0,0 L9,4 L0,8 Z" class="fg-arrow" />
            </marker>
          </defs>

          {#each layout.connectors as connector (connector.to)}
            <path d={connector.d} class="fg-line" marker-end="url(#arw-ft)" />
          {/each}

          {#each layout.nodes as node (node.id)}
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              rx="8"
              class={node.bornAt === activeCall ? 'fg-node-accent' : 'fg-node'}
            />

            <text
              x={node.centreX}
              y={node.y + node.height / 2}
              class="fg-text fg-mono"
              font-size="15"
              text-anchor="middle"
              dominant-baseline="central"
            >
              {node.id}
            </text>
          {/each}
        </svg>
      </div>

      <div class="fork__code">
        <!-- Keyed by position, not by text: two of the fork() lines are character-for-
             character identical, and a duplicate key is a runtime error in Svelte. -->
        <pre class="fork__pre"><code
            >{#each visibleLines as line, index (index)}<span
              class="fork__line"
              class:fork__line--active={line.call !== null && line.call === activeCall}
              >{line.text}
</span>{/each}</code></pre>
      </div>
    </div>

    {#if mode === 'explore'}
      <div class="fork__explore">
        <button
          type="button"
          role="switch"
          aria-checked={conditionalOn}
          class="fork__toggle"
          class:fork__toggle--on={conditionalOn}
          onclick={() => (conditionalOn = !conditionalOn)}
        >
          <span class="fork__toggle-code">if (x == 0) fork();</span>

          <span class="fork__toggle-state">{conditionalOn ? 'running' : 'skipped'}</span>
        </button>
      </div>
    {/if}
  </div>
</SimFrame>

<style>
  .fork {
    display: flex;

    flex-direction: column;

    gap: var(--space-md);
  }

  .fork__readout {
    display: flex;

    align-items: baseline;

    gap: var(--space-xs);
  }

  .fork__count {
    font-family: var(--font-mono);

    font-size: var(--font-size-display);

    font-weight: var(--font-weight-semibold);

    line-height: 1;

    color: var(--color-accent);
  }

  .fork__count-label {
    font-size: var(--font-size-label);

    color: var(--color-text-muted);
  }

  .fork__caption {
    margin: 0;

    font-size: var(--font-size-body);

    line-height: var(--line-height-relaxed);

    color: var(--color-text-muted);

    text-wrap: pretty;
  }

  .fork__panels {
    display: flex;

    flex-direction: column;

    gap: var(--space-md);
  }

  .fork__svg {
    display: block;

    width: 100%;

    height: auto;

    /* Portrait at twelve processes (roughly 328 x 418 user units); the cap stops it
       from eating the whole viewport on a tall phone. */
    max-height: 60vh;

    margin: 0 auto;
  }

  .fork__pre {
    margin: 0;

    padding: var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-md);

    background: var(--color-surface-raised);

    overflow-x: auto;
  }

  .fork__pre code {
    font-family: var(--font-mono);

    font-size: var(--font-size-label);

    line-height: var(--line-height-relaxed);

    color: var(--color-text);
  }

  /* white-space: pre on the span (rather than the <pre>) keeps each line its own
     highlightable block while preserving the source indentation. */
  .fork__line {
    display: block;

    white-space: pre;

    padding: 0 var(--space-xs);

    margin: 0 calc(var(--space-xs) * -1);

    border-radius: var(--radius-sm);
  }

  .fork__line--active {
    background: var(--color-accent-wash-strong);

    color: var(--color-text);
  }

  .fork__explore {
    display: flex;

    justify-content: center;
  }

  .fork__toggle {
    display: flex;

    align-items: center;

    gap: var(--space-sm);

    min-height: 44px;

    padding: var(--space-sm) var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-sm);

    background: transparent;

    color: var(--color-text-muted);

    cursor: pointer;
  }

  .fork__toggle--on {
    border-color: var(--color-accent);

    background: var(--color-accent-wash);

    color: var(--color-text);
  }

  .fork__toggle-code {
    font-family: var(--font-mono);

    font-size: var(--font-size-label);

    font-weight: var(--font-weight-semibold);
  }

  .fork__toggle-state {
    font-size: var(--font-size-micro);

    letter-spacing: 0.04em;

    text-transform: uppercase;
  }

  /* 1024px mirrors --bp-desktop (tokens.css) — the tree and its program sit side by
     side once there is width, so the reader can match a call to its generation. */
  @media (min-width: 1024px) {
    .fork__panels {
      flex-direction: row;

      align-items: flex-start;
    }

    .fork__tree {
      flex: 1;

      min-width: 0;
    }

    .fork__code {
      flex: 1;

      min-width: 0;
    }
  }
</style>
