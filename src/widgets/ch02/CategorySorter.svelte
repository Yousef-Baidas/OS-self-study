<script lang="ts">
  // CategorySorter — a tap-to-classify self-quiz (Ch2). Serves two sections
  // via its `dataset` prop: "services" (user-helpful vs system-helpful, slide 3)
  // and "syscalls" (the five system-call categories, slides 28-33). Presents one
  // item at a time, gives instant feedback with a one-line justification, and
  // scores the run — a low-stakes way to rehearse two taxonomies the exam leans
  // on. Not a SimFrame stepper: there is no linear "sequence", so it owns its own
  // card chrome. Data lives in category-data.ts (framework-free, testable).
  import { sorterDatasets, type SorterDatasetKey } from './category-data';

  interface Props {
    dataset: SorterDatasetKey;
  }

  let { dataset }: Props = $props();

  // Derived (not a plain const) so the widget tracks `dataset` reactively rather
  // than capturing only its initial value — matches the runes dependency model.
  const data = $derived(sorterDatasets[dataset]);

  const total = $derived(data.items.length);

  // Which item we're on, the bucket the reader tapped for it (null until they
  // answer), how many they've gotten right, and whether the run is over.
  let index = $state(0);

  let picked = $state<string | null>(null);

  let correctCount = $state(0);

  let finished = $state(false);

  const current = $derived(data.items[index]);

  const answered = $derived(picked !== null);

  const isCorrect = $derived(picked === current.bucket);

  function choose(bucketId: string) {

    // Ignore extra taps once this item is answered — the first choice stands.
    if (picked !== null) {

      return;
    }

    picked = bucketId;

    if (bucketId === current.bucket) {

      correctCount += 1;
    }
  }

  function next() {

    if (index < total - 1) {

      index += 1;

      picked = null;
    } else {

      finished = true;
    }
  }

  function restart() {

    index = 0;

    picked = null;

    correctCount = 0;

    finished = false;
  }

  // Label lookup for the feedback line ("The answer is …") — buckets is short,
  // so a find() per render is cheaper than maintaining a second map.
  function bucketLabel(id: string): string {

    return data.buckets.find((bucket) => bucket.id === id)?.label ?? id;
  }
</script>

<div class="sorter">
  <div class="sorter__header">
    <p class="eyebrow">Check yourself</p>

    <p class="sorter__prompt">{data.prompt}</p>
  </div>

  {#if finished}
    <div class="sorter__result" role="status">
      <p class="sorter__score">{correctCount} / {total} correct</p>

      <p class="sorter__score-note">
        {#if correctCount === total}
          Perfect — you have this taxonomy down.
        {:else if correctCount >= total - 1}
          Almost perfect — one to revisit.
        {:else}
          Worth another pass — re-read the section, then try again.
        {/if}
      </p>

      <button type="button" class="sorter__again" onclick={restart}>Try again</button>
    </div>
  {:else}
    <div class="sorter__progress">
      <p class="eyebrow">Item {index + 1} of {total}</p>

      <p class="eyebrow sorter__running">Score {correctCount}</p>
    </div>

    <div class="sorter__item">
      <span class="sorter__item-label">{current.label}</span>
    </div>

    <div class="sorter__buckets" role="group" aria-label="Categories">
      {#each data.buckets as bucket (bucket.id)}
        <button
          type="button"
          class="sorter__bucket"
          class:sorter__bucket--correct={answered && bucket.id === current.bucket}
          class:sorter__bucket--wrong={answered && bucket.id === picked && !isCorrect}
          class:sorter__bucket--dim={answered && bucket.id !== current.bucket && bucket.id !== picked}
          disabled={answered}
          onclick={() => choose(bucket.id)}
        >
          {bucket.label}
        </button>
      {/each}
    </div>

    <div class="sorter__feedback" aria-live="polite">
      {#if answered}
        <p
          class="sorter__verdict"
          class:sorter__verdict--correct={isCorrect}
          class:sorter__verdict--wrong={!isCorrect}
        >
          {#if isCorrect}
            Correct.
          {:else}
            Not quite — the answer is <strong>{bucketLabel(current.bucket)}</strong>.
          {/if}
        </p>

        <p class="sorter__why">{current.why}</p>

        <button type="button" class="sorter__next" onclick={next}>
          {index < total - 1 ? 'Next' : 'See score'}
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .sorter {
    margin: var(--space-lg) 0;

    padding: var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-lg);

    background: var(--color-surface-raised);

    box-shadow: var(--shadow-sm);
  }

  .sorter__prompt {
    margin: var(--space-xs) 0 0 0;

    font-size: var(--font-size-heading);

    font-weight: var(--font-weight-semibold);

    line-height: var(--line-height-tight);

    color: var(--color-text);
  }

  .sorter__progress {
    display: flex;

    justify-content: space-between;

    align-items: baseline;

    margin-top: var(--space-md);
  }

  .sorter__running {
    margin: 0;
  }

  .sorter__item {
    display: flex;

    align-items: center;

    justify-content: center;

    min-height: 88px;

    margin-top: var(--space-sm);

    padding: var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-md);

    background: var(--color-surface);

    text-align: center;
  }

  .sorter__item-label {
    font-family: var(--font-mono);

    font-size: var(--font-size-heading);

    font-weight: var(--font-weight-semibold);

    line-height: var(--line-height-snug);

    color: var(--color-text);
  }

  .sorter__buckets {
    display: grid;

    grid-template-columns: 1fr;

    gap: var(--space-sm);

    margin-top: var(--space-md);
  }

  /* At 640px (a comfortable large-phone/tablet width) buckets sit two-up, so the
     five-category syscall set doesn't become a tall single column. Below that
     they stay full-width and easy to tap. */
  @media (min-width: 640px) {
    .sorter__buckets {
      grid-template-columns: 1fr 1fr;
    }
  }

  .sorter__bucket {
    min-height: 44px;

    padding: var(--space-sm) var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-sm);

    background: transparent;

    color: var(--color-text);

    font-size: var(--font-size-body);

    font-weight: var(--font-weight-regular);

    line-height: var(--line-height-snug);

    text-align: center;

    cursor: pointer;
  }

  .sorter__bucket:disabled {
    cursor: default;
  }

  .sorter__bucket--correct {
    border-color: var(--color-success);

    background: var(--color-success-wash);

    color: var(--color-text);

    font-weight: var(--font-weight-semibold);
  }

  .sorter__bucket--wrong {
    border-color: var(--color-destructive);

    background: var(--color-destructive-wash);

    color: var(--color-text);
  }

  .sorter__bucket--dim {
    opacity: 0.5;
  }

  .sorter__feedback {
    margin-top: var(--space-md);
  }

  .sorter__verdict {
    margin: 0;

    font-size: var(--font-size-body);

    font-weight: var(--font-weight-semibold);

    line-height: var(--line-height-snug);
  }

  .sorter__verdict--correct {
    color: var(--color-success);
  }

  .sorter__verdict--wrong {
    color: var(--color-destructive);
  }

  .sorter__why {
    margin: var(--space-xs) 0 0 0;

    font-size: var(--font-size-body);

    line-height: var(--line-height-relaxed);

    color: var(--color-text-muted);

    text-wrap: pretty;
  }

  .sorter__next,
  .sorter__again {
    min-height: 44px;

    margin-top: var(--space-md);

    padding: var(--space-sm) var(--space-lg);

    border: 1px solid var(--color-accent);

    border-radius: var(--radius-sm);

    background: var(--color-accent);

    color: var(--color-bg);

    font-size: var(--font-size-body);

    font-weight: var(--font-weight-semibold);

    cursor: pointer;
  }

  .sorter__result {
    margin-top: var(--space-md);

    padding: var(--space-lg) var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-md);

    background: var(--color-surface);

    text-align: center;
  }

  .sorter__score {
    margin: 0;

    font-size: var(--font-size-display);

    font-weight: var(--font-weight-semibold);

    line-height: var(--line-height-tight);

    color: var(--color-text);
  }

  .sorter__score-note {
    margin: var(--space-xs) 0 0 0;

    font-size: var(--font-size-body);

    line-height: var(--line-height-relaxed);

    color: var(--color-text-muted);

    text-wrap: pretty;
  }
</style>
