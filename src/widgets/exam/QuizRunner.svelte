<script>
  // Exam-mode engine. One self-contained island (client:only="svelte") that runs
  // a practice session over the questions passed in, grades each answer type,
  // shows the worked solution + slide citation, and persists progress to
  // localStorage so a session can be resumed. No backend, no server state.
  import { onMount } from 'svelte';

  let { questions = [], chapter = 'introduction' } = $props();

  const SESSION_KEY = `os-exam-${chapter}-session`;

  const LAST_KEY = `os-exam-${chapter}-last`;

  const byId = new Map(questions.map((q) => [q.id, q]));

  // ---- state ----
  let phase = $state('setup'); // 'setup' | 'quiz' | 'results'

  let topicFilter = $state('all');

  let difficultyFilter = $state('all');

  let queue = $state([]);

  let index = $state(0);

  let answers = $state([]); // { id, correct }

  let selected = $state(null); // current input (mcq index | 'true'/'false' | numeric string)

  let revealed = $state(false); // feedback panel shown

  let recorded = $state(false); // answer counted (Next unlocks)

  let currentCorrect = $state(false);

  let lastResult = $state(null);

  let session = $state(null);

  // ---- derived ----
  const topics = $derived([...new Set(questions.map((q) => q.topic))]);

  const current = $derived(queue[index] ?? null);

  const score = $derived(answers.filter((a) => a.correct).length);

  const filteredCount = $derived(filtered().length);

  const progressPct = $derived(queue.length ? Math.round((index / queue.length) * 100) : 0);

  const review = $derived(
    answers
      .map((a) => ({ q: byId.get(a.id), correct: a.correct }))
      .filter((r) => r.q),
  );

  // ---- helpers ----
  function filtered() {
    return questions.filter(
      (q) =>
        (topicFilter === 'all' || q.topic === topicFilter) &&
        (difficultyFilter === 'all' || q.difficulty === difficultyFilter),
    );
  }

  function shuffle(arr) {
    const a = arr.slice();

    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [a[i], a[j]] = [a[j], a[i]];
    }

    return a;
  }

  function answerText(q) {
    if (q.type === 'mcq') return q.choices?.[q.answer] ?? '—';

    if (q.type === 'true-false') return String(q.answer) === 'true' ? 'True' : 'False';

    return String(q.answer);
  }

  function evaluate(q, given) {
    if (q.type === 'mcq') return given === q.answer;

    if (q.type === 'true-false') return given === String(q.answer);

    if (q.type === 'numeric') {
      const n = parseFloat(given);

      return !Number.isNaN(n) && n === Number(q.answer);
    }

    return false; // 'short' is self-graded
  }

  // ---- flow ----
  function resetQuestion() {
    selected = null;

    revealed = false;

    recorded = false;

    currentCorrect = false;
  }

  function startRun() {
    queue = shuffle(filtered());

    index = 0;

    answers = [];

    resetQuestion();

    phase = 'quiz';

    saveSession();
  }

  function submit() {
    if (!current || current.type === 'short') return;

    if (selected === null || selected === '') return;

    currentCorrect = evaluate(current, selected);

    recordAnswer(currentCorrect);
  }

  function revealShort() {
    revealed = true;
  }

  function selfGrade(ok) {
    currentCorrect = ok;

    recordAnswer(ok);
  }

  function recordAnswer(ok) {
    answers = [...answers, { id: current.id, correct: ok }];

    revealed = true;

    recorded = true;
  }

  function next() {
    if (index + 1 >= queue.length) {
      finish();

      return;
    }

    index += 1;

    resetQuestion();

    saveSession();
  }

  function finish() {
    const result = {
      correct: score,

      total: queue.length,

      pct: queue.length ? Math.round((score / queue.length) * 100) : 0,
    };

    lastResult = result;

    phase = 'results';

    persist(LAST_KEY, result);

    clearSession();
  }

  function restart() {
    phase = 'setup';

    resetQuestion();

    clearSession();
  }

  function retrySame() {
    startRun();
  }

  // ---- persistence (session is saved only when the current question is fresh,
  // so `answers.length === index` always holds on resume — no double counting) ----
  function persist(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      /* storage unavailable — degrade to in-memory only */
    }
  }

  function read(key) {
    try {
      const raw = localStorage.getItem(key);

      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function saveSession() {
    if (phase !== 'quiz') return;

    persist(SESSION_KEY, {
      queueIds: queue.map((q) => q.id),

      index,

      answers,

      topicFilter,

      difficultyFilter,
    });
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (_) {
      /* ignore */
    }

    session = null;
  }

  function resumeSession() {
    if (!session) return;

    const restored = session.queueIds.map((id) => byId.get(id)).filter(Boolean);

    if (restored.length !== session.queueIds.length) {
      clearSession();

      return;
    }

    queue = restored;

    answers = session.answers ?? [];

    index = Math.min(session.index ?? 0, restored.length - 1);

    topicFilter = session.topicFilter ?? 'all';

    difficultyFilter = session.difficultyFilter ?? 'all';

    resetQuestion();

    phase = 'quiz';
  }

  onMount(() => {
    lastResult = read(LAST_KEY);

    const s = read(SESSION_KEY);

    if (s && Array.isArray(s.queueIds) && s.queueIds.length) {
      session = s;
    }
  });
</script>

<section class="quiz" aria-live="polite">
  {#if phase === 'setup'}
    <header class="quiz__head">
      <p class="eyebrow">Exam mode · Chapter 1</p>

      <h2 class="quiz__title">Practice questions</h2>

      <p class="quiz__sub">
        {questions.length} questions with worked solutions and slide citations. Filter the set,
        then work through them one at a time — you get instant feedback on every answer.
      </p>
    </header>

    {#if session}
      <button class="resume" onclick={resumeSession}>
        <span class="resume__label">Resume your session</span>

        <span class="resume__meta">Question {(session.index ?? 0) + 1} of {session.queueIds.length}</span>
      </button>
    {/if}

    {#if lastResult}
      <p class="last">Last attempt: <strong>{lastResult.pct}%</strong> ({lastResult.correct}/{lastResult.total})</p>
    {/if}

    <div class="filters">
      <label class="field">
        <span class="field__label">Topic</span>

        <select class="select" bind:value={topicFilter}>
          <option value="all">All topics</option>

          {#each topics as t}
            <option value={t}>{t}</option>
          {/each}
        </select>
      </label>

      <label class="field">
        <span class="field__label">Difficulty</span>

        <select class="select" bind:value={difficultyFilter}>
          <option value="all">All levels</option>

          <option value="easy">Easy</option>

          <option value="medium">Medium</option>

          <option value="hard">Hard</option>
        </select>
      </label>
    </div>

    <button class="primary" onclick={startRun} disabled={filteredCount === 0}>
      Start practice · {filteredCount} question{filteredCount === 1 ? '' : 's'}
    </button>
  {:else if phase === 'quiz' && current}
    <div class="bar">
      <div class="bar__row">
        <span class="bar__count">Question {index + 1} of {queue.length}</span>

        <span class="bar__score">{score} correct</span>
      </div>

      <div class="track"><div class="track__fill" style={`width:${progressPct}%`}></div></div>
    </div>

    <article class="card">
      <div class="tags">
        <span class="tag">{current.topic}</span>

        <span class="tag tag--{current.difficulty}">{current.difficulty}</span>
      </div>

      <p class="prompt">{current.prompt}</p>

      {#if current.type === 'mcq'}
        <ul class="options">
          {#each current.choices as choice, i}
            <li>
              <button
                class="option"
                class:is-selected={selected === i && !revealed}
                class:is-correct={revealed && i === current.answer}
                class:is-wrong={revealed && selected === i && i !== current.answer}
                disabled={revealed}
                onclick={() => (selected = i)}
              >
                <span class="option__mark">{String.fromCharCode(65 + i)}</span>

                <span class="option__text">{choice}</span>
              </button>
            </li>
          {/each}
        </ul>
      {:else if current.type === 'true-false'}
        <div class="tf">
          {#each [{ v: 'true', label: 'True' }, { v: 'false', label: 'False' }] as opt}
            <button
              class="option option--tf"
              class:is-selected={selected === opt.v && !revealed}
              class:is-correct={revealed && String(current.answer) === opt.v}
              class:is-wrong={revealed && selected === opt.v && String(current.answer) !== opt.v}
              disabled={revealed}
              onclick={() => (selected = opt.v)}
            >
              {opt.label}
            </button>
          {/each}
        </div>
      {:else if current.type === 'numeric'}
        <input
          class="numeric"
          type="number"
          inputmode="decimal"
          placeholder="Your answer"
          bind:value={selected}
          disabled={revealed}
        />
      {:else if current.type === 'short'}
        <textarea
          class="short"
          rows="3"
          placeholder="Jot your answer, then reveal the model answer to self-check."
          bind:value={selected}
          disabled={revealed}
        ></textarea>
      {/if}

      {#if revealed}
        <div class="feedback" class:feedback--ok={currentCorrect} class:feedback--bad={recorded && !currentCorrect}>
          {#if recorded}
            <p class="feedback__verdict">{currentCorrect ? '✓ Correct' : '✗ Not quite'}</p>
          {/if}

          {#if current.type !== 'mcq' && current.type !== 'true-false'}
            <p class="feedback__answer"><span class="feedback__answer-label">Answer:</span> {answerText(current)}</p>
          {/if}

          <p class="feedback__text">{current.solution}</p>

          <span class="source" title={`Source: ${current.source}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M2 3h20" />

              <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />

              <path d="m7 21 5-5 5 5" />
            </svg>

            {current.source}
          </span>
        </div>
      {/if}
    </article>

    <div class="actions">
      {#if !revealed}
        {#if current.type === 'short'}
          <button class="primary" onclick={revealShort}>Reveal answer</button>
        {:else}
          <button class="primary" onclick={submit} disabled={selected === null || selected === ''}>Submit</button>
        {/if}
      {:else if current.type === 'short' && !recorded}
        <div class="selfgrade">
          <span class="selfgrade__q">How did you do?</span>

          <button class="grade grade--ok" onclick={() => selfGrade(true)}>I got it</button>

          <button class="grade grade--bad" onclick={() => selfGrade(false)}>Missed it</button>
        </div>
      {:else}
        <button class="primary" onclick={next}>
          {index + 1 >= queue.length ? 'See results' : 'Next question'}
        </button>
      {/if}
    </div>
  {:else if phase === 'results'}
    <div class="results">
      <p class="eyebrow">Results</p>

      <p class="score" class:score--pass={(lastResult?.pct ?? 0) >= 60}>{lastResult?.pct}%</p>

      <p class="score__detail">{lastResult?.correct} of {lastResult?.total} correct</p>

      {#if review.some((r) => !r.correct)}
        <h3 class="review__head">Review your misses</h3>

        <ul class="review">
          {#each review.filter((r) => !r.correct) as r}
            <li class="miss">
              <p class="miss__prompt">{r.q.prompt}</p>

              <p class="miss__answer"><span class="miss__label">Answer:</span> {answerText(r.q)}</p>

              <p class="miss__sol">{r.q.solution}</p>

              <span class="source" title={`Source: ${r.q.source}`}>{r.q.source}</span>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="perfect">Clean sweep — every answer correct. 🎯</p>
      {/if}

      <div class="actions actions--results">
        <button class="primary" onclick={retrySame}>Try again</button>

        <button class="ghost" onclick={restart}>New set</button>
      </div>
    </div>
  {/if}
</section>

<style>
  .quiz {
    display: flex;

    flex-direction: column;

    gap: var(--space-lg);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-lg);

    background: var(--color-surface-raised);

    padding: var(--space-lg);

    box-shadow: var(--shadow-sm);
  }

  .quiz__head {
    display: flex;

    flex-direction: column;

    gap: var(--space-xs);
  }

  .quiz__title {
    margin: 0;

    font-size: var(--font-size-heading);
  }

  .quiz__sub {
    margin: 0;

    color: var(--color-text-muted);

    font-size: var(--font-size-label);

    line-height: var(--line-height-snug);
  }

  /* ---- setup ---- */
  .resume {
    display: flex;

    flex-direction: column;

    align-items: flex-start;

    gap: 2px;

    padding: var(--space-md);

    border: 1px solid var(--color-accent);

    border-radius: var(--radius-md);

    background: var(--color-accent-wash);

    color: var(--color-text);

    text-align: left;

    cursor: pointer;
  }

  .resume__label {
    font-weight: var(--font-weight-semibold);

    color: var(--color-accent);
  }

  .resume__meta {
    font-size: var(--font-size-label);

    color: var(--color-text-muted);
  }

  .last {
    margin: 0;

    color: var(--color-text-muted);

    font-size: var(--font-size-label);
  }

  .filters {
    display: flex;

    flex-wrap: wrap;

    gap: var(--space-md);
  }

  .field {
    display: flex;

    flex-direction: column;

    gap: var(--space-xs);

    flex: 1 1 160px;
  }

  .field__label {
    font-family: var(--font-mono);

    font-size: var(--font-size-micro);

    font-weight: var(--font-weight-semibold);

    letter-spacing: var(--tracking-caps);

    text-transform: uppercase;

    color: var(--color-text-muted);
  }

  .select {
    height: 44px;

    padding: 0 var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-md);

    background: var(--color-bg);

    color: var(--color-text);

    font-family: var(--font-sans);

    font-size: var(--font-size-body);
  }

  /* ---- quiz ---- */
  .bar {
    display: flex;

    flex-direction: column;

    gap: var(--space-sm);
  }

  .bar__row {
    display: flex;

    justify-content: space-between;

    font-family: var(--font-mono);

    font-size: var(--font-size-micro);

    letter-spacing: 0.03em;

    color: var(--color-text-muted);
  }

  .bar__score {
    color: var(--color-accent);
  }

  .track {
    height: 6px;

    border-radius: 999px;

    background: var(--color-surface);

    overflow: hidden;
  }

  .track__fill {
    height: 100%;

    border-radius: 999px;

    background: var(--color-accent);

    transition: width 0.25s ease;
  }

  .card {
    display: flex;

    flex-direction: column;

    gap: var(--space-md);
  }

  .tags {
    display: flex;

    flex-wrap: wrap;

    gap: var(--space-sm);
  }

  .tag {
    padding: 2px var(--space-sm);

    border: 1px solid var(--color-border);

    border-radius: 999px;

    background: var(--color-surface);

    font-family: var(--font-mono);

    font-size: var(--font-size-micro);

    letter-spacing: 0.02em;

    color: var(--color-text-muted);
  }

  .tag--easy {
    color: var(--color-success);
  }

  .tag--medium {
    color: var(--color-warning);
  }

  .tag--hard {
    color: var(--color-destructive);
  }

  .prompt {
    margin: 0;

    font-size: var(--font-size-heading);

    line-height: var(--line-height-snug);

    text-wrap: pretty;
  }

  .options {
    list-style: none;

    margin: 0;

    padding: 0;

    display: flex;

    flex-direction: column;

    gap: var(--space-sm);
  }

  .option {
    display: flex;

    align-items: center;

    gap: var(--space-md);

    width: 100%;

    min-height: 48px;

    padding: var(--space-sm) var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-md);

    background: var(--color-bg);

    color: var(--color-text);

    font-size: var(--font-size-body);

    text-align: left;

    cursor: pointer;

    transition:
      border-color 0.15s ease,
      background 0.15s ease;
  }

  .option:hover:not(:disabled) {
    border-color: var(--color-accent);
  }

  .option:disabled {
    cursor: default;
  }

  .option__mark {
    display: grid;

    place-items: center;

    flex: none;

    width: 26px;

    height: 26px;

    border-radius: var(--radius-sm);

    background: var(--color-surface);

    font-family: var(--font-mono);

    font-size: var(--font-size-label);

    font-weight: var(--font-weight-semibold);

    color: var(--color-text-muted);
  }

  .option.is-selected {
    border-color: var(--color-accent);

    background: var(--color-accent-wash);
  }

  .option.is-correct {
    border-color: var(--color-success);

    background: var(--color-success-wash);
  }

  .option.is-wrong {
    border-color: var(--color-destructive);

    background: var(--color-destructive-wash);
  }

  .tf {
    display: flex;

    gap: var(--space-md);
  }

  .option--tf {
    flex: 1;

    justify-content: center;

    font-weight: var(--font-weight-semibold);
  }

  .numeric,
  .short {
    width: 100%;

    padding: var(--space-md);

    border: 1px solid var(--color-border);

    border-radius: var(--radius-md);

    background: var(--color-bg);

    color: var(--color-text);

    font-family: var(--font-sans);

    font-size: var(--font-size-body);
  }

  .short {
    resize: vertical;

    line-height: var(--line-height-snug);
  }

  .feedback {
    border: 1px solid var(--color-border);

    border-left-width: 3px;

    border-radius: var(--radius-md);

    padding: var(--space-md);

    background: var(--color-surface);

    display: flex;

    flex-direction: column;

    gap: var(--space-sm);
  }

  .feedback--ok {
    border-left-color: var(--color-success);

    background: var(--color-success-wash);
  }

  .feedback--bad {
    border-left-color: var(--color-destructive);

    background: var(--color-destructive-wash);
  }

  .feedback__verdict {
    margin: 0;

    font-weight: var(--font-weight-semibold);
  }

  .feedback--ok .feedback__verdict {
    color: var(--color-success);
  }

  .feedback--bad .feedback__verdict {
    color: var(--color-destructive);
  }

  .feedback__answer,
  .feedback__text {
    margin: 0;

    font-size: var(--font-size-label);

    line-height: var(--line-height-snug);
  }

  .feedback__answer-label {
    font-weight: var(--font-weight-semibold);
  }

  .source {
    display: inline-flex;

    align-items: center;

    gap: 0.35em;

    align-self: flex-start;

    padding: 0.1em 0.5em;

    border: 1px solid color-mix(in srgb, var(--color-accent) 22%, transparent);

    border-radius: var(--radius-sm);

    background: var(--color-accent-wash);

    color: var(--color-accent);

    font-family: var(--font-mono);

    font-size: var(--font-size-micro);

    font-weight: var(--font-weight-semibold);
  }

  .source svg {
    width: 12px;

    height: 12px;

    opacity: 0.85;
  }

  /* ---- actions ---- */
  .actions {
    display: flex;
  }

  .primary {
    flex: 1;

    min-height: 48px;

    padding: 0 var(--space-lg);

    border: none;

    border-radius: var(--radius-md);

    background: var(--color-accent);

    color: #ffffff;

    font-family: var(--font-sans);

    font-size: var(--font-size-body);

    font-weight: var(--font-weight-semibold);

    cursor: pointer;

    transition:
      background 0.15s ease,
      transform 0.15s ease;
  }

  .primary:hover:not(:disabled) {
    background: var(--color-accent-hover);
  }

  .primary:disabled {
    opacity: 0.5;

    cursor: not-allowed;
  }

  .selfgrade {
    display: flex;

    align-items: center;

    flex-wrap: wrap;

    gap: var(--space-sm);

    width: 100%;
  }

  .selfgrade__q {
    flex: 1 1 100%;

    font-size: var(--font-size-label);

    color: var(--color-text-muted);
  }

  .grade {
    flex: 1;

    min-height: 44px;

    border-radius: var(--radius-md);

    border: 1px solid var(--color-border);

    background: var(--color-bg);

    color: var(--color-text);

    font-family: var(--font-sans);

    font-size: var(--font-size-label);

    font-weight: var(--font-weight-semibold);

    cursor: pointer;
  }

  .grade--ok {
    border-color: var(--color-success);

    color: var(--color-success);
  }

  .grade--bad {
    border-color: var(--color-destructive);

    color: var(--color-destructive);
  }

  /* ---- results ---- */
  .results {
    display: flex;

    flex-direction: column;

    gap: var(--space-sm);
  }

  .score {
    margin: 0;

    font-size: 52px;

    font-weight: var(--font-weight-semibold);

    line-height: 1.05;

    color: var(--color-warning);
  }

  .score--pass {
    color: var(--color-success);
  }

  .score__detail {
    margin: 0 0 var(--space-md);

    color: var(--color-text-muted);
  }

  .perfect {
    margin: 0 0 var(--space-md);

    color: var(--color-success);

    font-weight: var(--font-weight-semibold);
  }

  .review__head {
    margin: var(--space-md) 0 var(--space-sm);

    font-size: var(--font-size-body);
  }

  .review {
    list-style: none;

    margin: 0 0 var(--space-md);

    padding: 0;

    display: flex;

    flex-direction: column;

    gap: var(--space-md);
  }

  .miss {
    border: 1px solid var(--color-border);

    border-left: 3px solid var(--color-destructive);

    border-radius: var(--radius-md);

    padding: var(--space-md);

    display: flex;

    flex-direction: column;

    gap: var(--space-xs);
  }

  .miss__prompt {
    margin: 0;

    font-weight: var(--font-weight-semibold);
  }

  .miss__answer,
  .miss__sol {
    margin: 0;

    font-size: var(--font-size-label);

    line-height: var(--line-height-snug);

    color: var(--color-text);
  }

  .miss__label {
    font-weight: var(--font-weight-semibold);
  }

  .actions--results {
    gap: var(--space-md);

    margin-top: var(--space-sm);
  }

  .ghost {
    flex: 1;

    min-height: 48px;

    border-radius: var(--radius-md);

    border: 1px solid var(--color-border);

    background: transparent;

    color: var(--color-text);

    font-family: var(--font-sans);

    font-size: var(--font-size-body);

    font-weight: var(--font-weight-semibold);

    cursor: pointer;
  }

  .ghost:hover {
    border-color: color-mix(in srgb, var(--color-text) 30%, var(--color-border));
  }
</style>
