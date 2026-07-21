<script lang="ts">
  // RaceCondition — slide 42's shared counter, executed rather than narrated.
  //
  // Guided walks the interleaving the chapter prints (S0-S5, ending at 4). Explore
  // hands the scheduler to the reader: pick which process runs its next instruction and
  // watch which of 4, 5 and 6 you land on. That is the chapter's actual claim — the
  // value depends on the order — and it is only convincing if you can steer it.
  //
  // The machine itself is src/lib/race-condition, where a test runs all twenty possible
  // interleavings and checks the outcomes are exactly the three the chapter names.
  import SimFrame from '../../components/SimFrame.svelte';

  import {
    CONSUMER,
    INITIAL_COUNTER,
    PRODUCER,
    SLIDE_42_ORDER,
    remainingFor,
    runInterleaving,
    type Actor,
  } from '../../lib/race-condition';

  let step = $state(0);

  let mode = $state<'guided' | 'explore'>('guided');

  // The interleaving the reader is building in Explore, one choice at a time.
  let exploreOrder = $state<Actor[]>([]);

  // Reset (and any return to Guided) clears the reader's interleaving, so Explore
  // always starts from an empty schedule rather than a half-finished one.
  $effect(() => {

    if (mode !== 'explore') {

      exploreOrder = [];
    }
  });

  const order = $derived(mode === 'explore' ? exploreOrder : SLIDE_42_ORDER);

  const trace = $derived(runInterleaving(order));

  // How many instructions have executed. In Guided that is the step; in Explore it is
  // however many choices the reader has made.
  const cursor = $derived(mode === 'explore' ? exploreOrder.length : step);

  const machine = $derived(trace.states[cursor]);

  const justRan = $derived(cursor > 0 ? trace.instructions[cursor - 1] : null);

  const total = $derived(PRODUCER.length + CONSUMER.length);

  const complete = $derived(cursor === total);

  // Each process's program counter: the index of the instruction it will run next.
  const producerPc = $derived(order.slice(0, cursor).filter((actor) => actor === 'producer').length);

  const consumerPc = $derived(order.slice(0, cursor).filter((actor) => actor === 'consumer').length);

  const programs = $derived([
    { actor: 'producer' as Actor, label: 'Producer — counter++', ops: PRODUCER, pc: producerPc },

    { actor: 'consumer' as Actor, label: 'Consumer — counter--', ops: CONSUMER, pc: consumerPc },
  ]);

  function schedule(actor: Actor) {

    if (remainingFor(exploreOrder, actor) > 0) {

      exploreOrder = [...exploreOrder, actor];
    }
  }
</script>

<SimFrame
  title="One counter, two processes, three outcomes"
  caption="counter++ and counter-- are three instructions each, so they can interleave — and what the counter ends up holding depends on how."
  totalSteps={total + 1}
  bind:step
  bind:mode
>
  <div class="race">
    <div class="race__counter" class:race__counter--wrong={complete && machine.counter !== INITIAL_COUNTER}>
      <span class="race__counter-label">shared counter</span>

      <span class="race__counter-value">{machine.counter}</span>
    </div>

    <ul class="race__registers">
      <li class="race__register">
        <span class="race__register-name">register1</span>

        <span class="race__register-value">{machine.register1 ?? '—'}</span>
      </li>

      <li class="race__register">
        <span class="race__register-name">register2</span>

        <span class="race__register-value">{machine.register2 ?? '—'}</span>
      </li>
    </ul>

    <div class="race__programs">
      {#each programs as program (program.actor)}
        <div class="race__program">
          <p class="race__program-title">{program.label}</p>

          <ol class="race__ops">
            {#each program.ops as op, index (op.text)}
              <li
                class="race__op"
                class:race__op--done={index < program.pc}
                class:race__op--current={justRan === op}
                class:race__op--next={index === program.pc}
              >
                {op.text}
              </li>
            {/each}
          </ol>
        </div>
      {/each}
    </div>

    <p class="race__narration" aria-live="polite">
      {#if !justRan}
        The counter starts at {INITIAL_COUNTER}. Neither process has read it yet.
      {:else}
        <strong>S{cursor - 1}</strong>
        — the {justRan.actor} ran
        <code>{justRan.text}</code>{#if justRan.effect === 'load'}, taking a private copy of a counter the other process may still change{:else if justRan.effect === 'store'}, overwriting whatever the counter held{/if}.
      {/if}
    </p>

    {#if complete}
      <p
        class="race__verdict"
        class:race__verdict--wrong={machine.counter !== INITIAL_COUNTER}
        aria-live="polite"
      >
        {#if machine.counter === INITIAL_COUNTER}
          counter = {machine.counter}. Correct — one increment and one decrement cancel out. Neither
          process was interrupted between its load and its store.
        {:else}
          counter = {machine.counter}, but one increment and one decrement should leave {INITIAL_COUNTER}.
          A stale value was read before the other process stored its result.
        {/if}
      </p>
    {/if}

    {#if mode === 'explore'}
      <div class="race__schedule">
        <p class="race__schedule-label">You are the scheduler — who runs next?</p>

        <div class="race__buttons">
          {#each programs as program (program.actor)}
            <button
              type="button"
              class="race__button"
              onclick={() => schedule(program.actor)}
              disabled={remainingFor(exploreOrder, program.actor) === 0}
            >
              {program.actor}

              <span class="race__button-left">
                {remainingFor(exploreOrder, program.actor)} left
              </span>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</SimFrame>

<style>
  .race {
    display: flex;

    flex-direction: column;

    gap: var(--space-md);
  }

  .race__counter {
    display: flex;

    align-items: baseline;

    justify-content: space-between;

    padding: var(--space-sm) var(--space-md);

    border: 1px solid var(--color-accent);

    border-radius: var(--radius-md);

    background: var(--color-accent-wash);
  }

  /* A finished run that did not land on 5 is the whole point of the figure, so it is
     the one state that changes the panel's colour. */
  .race__counter--wrong {
    border-color: var(--color-destructive);

    background: var(--color-destructive-wash);
  }

  .race__counter-label {
    font-size: var(--font-size-micro);

    font-weight: var(--font-weight-semibold);

    letter-spacing: 0.04em;

    text-transform: uppercase;

    color: var(--color-text-muted);
  }

  .race__counter-value {
    font-family: var(--font-mono);

    font-size: var(--font-size-display);

    font-weight: var(--font-weight-semibold);

    line-height: 1;

    color: var(--color-text);
  }

  .race__registers {
    display: flex;

    gap: var(--space-sm);

    margin: 0;

    padding: 0;

    list-style: none;
  }

  .race__register {
    display: flex;

    flex: 1;

    align-items: baseline;

    justify-content: space-between;

    gap: var(--space-xs);

    padding: var(--space-xs) var(--space-sm);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-sm);

    background: var(--color-surface-raised);
  }

  .race__register-name {
    font-family: var(--font-mono);

    font-size: var(--font-size-micro);

    color: var(--color-text-muted);
  }

  .race__register-value {
    font-family: var(--font-mono);

    font-size: var(--font-size-body);

    font-weight: var(--font-weight-semibold);

    color: var(--color-text);
  }

  .race__programs {
    display: flex;

    flex-direction: column;

    gap: var(--space-sm);
  }

  .race__program {
    padding: var(--space-sm) var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-md);

    background: var(--color-surface-raised);
  }

  .race__program-title {
    margin: 0 0 var(--space-xs) 0;

    font-size: var(--font-size-micro);

    font-weight: var(--font-weight-semibold);

    letter-spacing: 0.04em;

    text-transform: uppercase;

    color: var(--color-text-muted);
  }

  .race__ops {
    margin: 0;

    padding: 0;

    list-style: none;
  }

  .race__op {
    padding: 2px var(--space-xs);

    border-radius: var(--radius-sm);

    font-family: var(--font-mono);

    font-size: var(--font-size-label);

    line-height: var(--line-height-relaxed);

    color: var(--color-text-muted);
  }

  /* Already executed: full-strength text, but no fill — the eye should land on the
     instruction that just ran, not on the history. */
  .race__op--done {
    color: var(--color-text);
  }

  .race__op--next {
    color: var(--color-text);

    text-decoration: underline;

    text-decoration-style: dotted;

    text-underline-offset: 3px;
  }

  .race__op--current {
    background: var(--color-accent-wash-strong);

    color: var(--color-text);

    text-decoration: none;
  }

  .race__narration {
    margin: 0;

    font-size: var(--font-size-body);

    line-height: var(--line-height-relaxed);

    color: var(--color-text-muted);

    text-wrap: pretty;
  }

  .race__narration code {
    font-family: var(--font-mono);

    font-size: 0.95em;

    color: var(--color-text);
  }

  .race__verdict {
    margin: 0;

    padding: var(--space-sm) var(--space-md);

    border: 1px solid var(--color-success);

    border-radius: var(--radius-md);

    background: var(--color-success-wash);

    font-size: var(--font-size-body);

    line-height: var(--line-height-relaxed);

    color: var(--color-text);

    text-wrap: pretty;
  }

  .race__verdict--wrong {
    border-color: var(--color-destructive);

    background: var(--color-destructive-wash);
  }

  .race__schedule-label {
    margin: 0 0 var(--space-xs) 0;

    font-size: var(--font-size-micro);

    font-weight: var(--font-weight-semibold);

    letter-spacing: 0.04em;

    text-transform: uppercase;

    color: var(--color-text-muted);
  }

  .race__buttons {
    display: flex;

    gap: var(--space-sm);
  }

  .race__button {
    display: flex;

    flex: 1;

    flex-direction: column;

    align-items: center;

    gap: 2px;

    min-height: 44px;

    padding: var(--space-sm) var(--space-md);

    border: 1px solid var(--color-accent);

    border-radius: var(--radius-sm);

    background: var(--color-accent);

    color: var(--color-accent-ink);

    font-size: var(--font-size-body);

    font-weight: var(--font-weight-semibold);

    cursor: pointer;
  }

  .race__button:disabled {
    border-color: var(--color-border);

    background: transparent;

    color: var(--color-text-muted);

    cursor: not-allowed;
  }

  .race__button-left {
    font-size: var(--font-size-micro);

    font-weight: var(--font-weight-regular);

    letter-spacing: 0.04em;

    text-transform: uppercase;
  }

  /* 1024px mirrors --bp-desktop (tokens.css) — the two programs sit side by side once
     there is width, which is what makes an interleaving legible as two columns. */
  @media (min-width: 1024px) {
    .race__programs {
      flex-direction: row;
    }

    .race__program {
      flex: 1;
    }
  }
</style>
