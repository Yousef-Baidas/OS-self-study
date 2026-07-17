<script>
  // ExamShell — thin chapter switcher around the per-chapter QuizRunner engine.
  // The exam bank grows one chapter at a time, so this lets a student pick which
  // chapter's questions to practise while the runner itself stays single-chapter:
  // each chapter keeps its own localStorage progress (keys are derived from the
  // `chapter` prop). Switching chapters remounts the runner via {#key}, so its
  // onMount re-reads the selected chapter's saved session/last-score for free.
  import { onMount } from 'svelte';

  import QuizRunner from './QuizRunner.svelte';

  let { groups = [] } = $props();

  // Remembers the chapter a student last practised, so they return to it.
  const CHAPTER_KEY = 'os-exam-chapter';

  // Default to the first (lowest-numbered) chapter; onMount may restore the last.
  let selected = $state(groups[0]?.slug ?? '');

  const active = $derived(groups.find((group) => group.slug === selected) ?? groups[0]);

  onMount(() => {

    // Restore the last-practised chapter, but only if it still exists.
    try {

      const saved = localStorage.getItem(CHAPTER_KEY);

      if (saved && groups.some((group) => group.slug === saved)) {

        selected = saved;
      }
    } catch (_) {
      /* storage unavailable — fall back to the default chapter */
    }
  });

  function choose(slug) {

    selected = slug;

    try {

      localStorage.setItem(CHAPTER_KEY, slug);
    } catch (_) {
      /* storage unavailable — selection still works in-memory */
    }
  }
</script>

<div class="exam-shell">
  {#if groups.length > 1}
    <label class="exam-shell__field">
      <span class="exam-shell__label">Chapter</span>

      <select
        class="exam-shell__select"
        value={selected}
        onchange={(event) => choose(event.currentTarget.value)}
      >
        {#each groups as group (group.slug)}
          <option value={group.slug}>Chapter {group.number} — {group.title}</option>
        {/each}
      </select>
    </label>
  {/if}

  {#if active}
    {#key active.slug}
      <QuizRunner
        questions={active.questions}
        chapter={active.slug}
        chapterLabel={`Chapter ${active.number}`}
      />
    {/key}
  {/if}
</div>

<style>
  .exam-shell {
    display: flex;

    flex-direction: column;

    gap: var(--space-md);
  }

  .exam-shell__field {
    display: flex;

    flex-direction: column;

    gap: var(--space-xs);
  }

  .exam-shell__label {
    font-family: var(--font-mono);

    font-size: var(--font-size-micro);

    font-weight: var(--font-weight-semibold);

    letter-spacing: var(--tracking-caps);

    text-transform: uppercase;

    color: var(--color-text-muted);
  }

  .exam-shell__select {
    height: 48px;

    padding: 0 var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-md);

    background: var(--color-surface-raised);

    color: var(--color-text);

    font-family: var(--font-sans);

    font-size: var(--font-size-body);

    font-weight: var(--font-weight-semibold);
  }
</style>
