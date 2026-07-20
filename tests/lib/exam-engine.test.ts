import { describe, expect, it } from 'vitest';

import {
  PASS_PCT,
  answerText,
  buildQueue,
  filterQuestions,
  gradeAnswer,
  listTopics,
  restoreSession,
  summarize,
  type Question,
} from '../../src/lib/exam-engine';

import type { SavedSession } from '../../src/lib/progress-store';

function question(overrides: Partial<Question> = {}): Question {

  return {

    id: 'ch01-q1',

    topic: 'Interrupts',

    type: 'mcq',

    difficulty: 'easy',

    prompt: 'What raises an interrupt?',

    choices: ['A device', 'The compiler', 'The linker'],

    answer: 0,

    solution: 'Devices signal the CPU over the interrupt line.',

    source: 'slide 29',

    ...overrides,
  };
}

describe('gradeAnswer', () => {

  it('grades an mcq by choice index', () => {

    const q = question({ answer: 2 });

    expect(gradeAnswer(q, 2)).toEqual({ kind: 'correct' });

    expect(gradeAnswer(q, 0)).toEqual({ kind: 'incorrect' });
  });

  it('grades true-false against the stored string', () => {

    const q = question({ type: 'true-false', answer: 'true', choices: null });

    expect(gradeAnswer(q, 'true')).toEqual({ kind: 'correct' });

    expect(gradeAnswer(q, 'false')).toEqual({ kind: 'incorrect' });
  });

  it('grades numeric answers by value, not by text', () => {

    const q = question({ type: 'numeric', answer: 4, choices: null });

    expect(gradeAnswer(q, '4')).toEqual({ kind: 'correct' });

    expect(gradeAnswer(q, '4.0')).toEqual({ kind: 'correct' });

    expect(gradeAnswer(q, ' 4 ')).toEqual({ kind: 'correct' });

    expect(gradeAnswer(q, 4)).toEqual({ kind: 'correct' });

    expect(gradeAnswer(q, '5')).toEqual({ kind: 'incorrect' });
  });

  it('marks unparseable numeric entries incorrect rather than NaN-equal', () => {

    const q = question({ type: 'numeric', answer: 4, choices: null });

    expect(gradeAnswer(q, 'four')).toEqual({ kind: 'incorrect' });
  });

  // The regression this shape exists to prevent: 'short' used to grade as false, and
  // only a separate type check at the call site stopped it being recorded as wrong.
  it('never grades a short answer itself', () => {

    const q = question({ type: 'short', answer: 'A model answer.', choices: null });

    expect(gradeAnswer(q, 'anything')).toEqual({ kind: 'self-graded' });

    expect(gradeAnswer(q, '')).toEqual({ kind: 'self-graded' });

    expect(gradeAnswer(q, null)).toEqual({ kind: 'self-graded' });
  });

  it('treats a missing answer as incorrect for graded types', () => {

    expect(gradeAnswer(question(), null)).toEqual({ kind: 'incorrect' });

    expect(gradeAnswer(question({ type: 'numeric', answer: 4 }), '')).toEqual({ kind: 'incorrect' });
  });
});

describe('answerText', () => {

  it('renders the chosen mcq option', () => {

    expect(answerText(question({ answer: 1 }))).toBe('The compiler');
  });

  it('falls back when an mcq index is out of range', () => {

    expect(answerText(question({ answer: 9 }))).toBe('—');

    expect(answerText(question({ choices: null }))).toBe('—');
  });

  it('renders true-false in title case', () => {

    expect(answerText(question({ type: 'true-false', answer: 'true' }))).toBe('True');

    expect(answerText(question({ type: 'true-false', answer: 'false' }))).toBe('False');
  });

  it('renders numeric and short answers as their stored value', () => {

    expect(answerText(question({ type: 'numeric', answer: 4 }))).toBe('4');

    expect(answerText(question({ type: 'short', answer: 'Because of the trap.' }))).toBe(
      'Because of the trap.',
    );
  });
});

describe('filterQuestions and listTopics', () => {

  const bank = [
    question({ id: 'a', topic: 'Interrupts', difficulty: 'easy' }),
    question({ id: 'b', topic: 'Interrupts', difficulty: 'hard' }),
    question({ id: 'c', topic: 'Storage', difficulty: 'easy' }),
  ];

  it('lists each topic once, in first-seen order', () => {

    expect(listTopics(bank)).toEqual(['Interrupts', 'Storage']);
  });

  it('treats "all" as no restriction', () => {

    expect(filterQuestions(bank, { topic: 'all', difficulty: 'all' })).toHaveLength(3);
  });

  it('filters on either axis', () => {

    expect(
      filterQuestions(bank, { topic: 'Interrupts', difficulty: 'all' }).map((q) => q.id),
    ).toEqual(['a', 'b']);

    expect(filterQuestions(bank, { topic: 'all', difficulty: 'easy' }).map((q) => q.id)).toEqual([
      'a',
      'c',
    ]);
  });

  it('filters on both axes together', () => {

    expect(
      filterQuestions(bank, { topic: 'Interrupts', difficulty: 'hard' }).map((q) => q.id),
    ).toEqual(['b']);

    expect(filterQuestions(bank, { topic: 'Storage', difficulty: 'hard' })).toEqual([]);
  });
});

describe('buildQueue', () => {

  const bank = ['a', 'b', 'c', 'd'].map((id) => question({ id }));

  const everything = { topic: 'all', difficulty: 'all' };

  it('produces an exact order for a given rng', () => {

    // rng() === 0 makes every draw pick index 0, so each pass swaps the current tail
    // into the front — the array ends up rotated one place left. An exact asserted
    // permutation, rather than the untestable "it shuffled somehow".
    expect(buildQueue(bank, everything, () => 0).map((q) => q.id)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('keeps order when the rng always picks the current position', () => {

    expect(buildQueue(bank, everything, () => 0.999999).map((q) => q.id)).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
  });

  it('is always a permutation of the filtered pool', () => {

    const queue = buildQueue(bank, everything, () => 0.42);

    expect(queue).toHaveLength(4);

    expect(queue.map((q) => q.id).sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('shuffles only what the filter kept', () => {

    const mixed = [
      question({ id: 'x', difficulty: 'easy' }),
      question({ id: 'y', difficulty: 'hard' }),
    ];

    expect(buildQueue(mixed, { topic: 'all', difficulty: 'hard' }, () => 0).map((q) => q.id)).toEqual(
      ['y'],
    );
  });

  it('does not mutate the caller’s array', () => {

    const original = bank.map((q) => q.id);

    buildQueue(bank, everything, () => 0);

    expect(bank.map((q) => q.id)).toEqual(original);
  });

  it('handles an empty pool', () => {

    expect(buildQueue([], everything, () => 0)).toEqual([]);
  });
});

describe('summarize', () => {

  const bank = ['a', 'b', 'c', 'd', 'e'].map((id) => question({ id }));

  it('counts correct answers and rounds the percentage', () => {

    const summary = summarize(
      [
        { id: 'a', correct: true },
        { id: 'b', correct: false },
        { id: 'c', correct: true },
      ],
      bank,
    );

    expect(summary.correct).toBe(2);

    expect(summary.total).toBe(3);

    expect(summary.pct).toBe(67);
  });

  it('passes exactly at the threshold', () => {

    const answers = [
      { id: 'a', correct: true },
      { id: 'b', correct: true },
      { id: 'c', correct: true },
      { id: 'd', correct: false },
      { id: 'e', correct: false },
    ];

    expect(summarize(answers, bank).pct).toBe(PASS_PCT);

    expect(summarize(answers, bank).passed).toBe(true);
  });

  it('fails below the threshold', () => {

    const summary = summarize(
      [
        { id: 'a', correct: true },
        { id: 'b', correct: false },
      ],
      bank,
    );

    expect(summary.pct).toBe(50);

    expect(summary.passed).toBe(false);
  });

  it('joins answers back to their questions in answered order', () => {

    const summary = summarize(
      [
        { id: 'c', correct: false },
        { id: 'a', correct: true },
      ],
      bank,
    );

    expect(summary.review.map((entry) => entry.question.id)).toEqual(['c', 'a']);

    expect(summary.review.map((entry) => entry.correct)).toEqual([false, true]);
  });

  it('drops answers whose question has left the bank but keeps their score', () => {

    const summary = summarize(
      [
        { id: 'a', correct: true },
        { id: 'gone', correct: true },
      ],
      bank,
    );

    expect(summary.correct).toBe(2);

    expect(summary.total).toBe(2);

    expect(summary.review).toHaveLength(1);
  });

  it('reports an empty run as zero rather than NaN', () => {

    const summary = summarize([], bank);

    expect(summary).toMatchObject({ correct: 0, total: 0, pct: 0, passed: false });

    expect(summary.review).toEqual([]);
  });
});

describe('restoreSession', () => {

  const bank = ['a', 'b', 'c'].map((id) => question({ id }));

  function saved(overrides: Partial<SavedSession> = {}): SavedSession {

    return {

      queueIds: ['b', 'a'],

      index: 1,

      answers: [{ id: 'b', correct: true }],

      topicFilter: 'all',

      difficultyFilter: 'easy',

      ...overrides,
    };
  }

  it('rebuilds the queue in its saved order', () => {

    const session = restoreSession(saved(), bank);

    expect(session?.queue.map((q) => q.id)).toEqual(['b', 'a']);

    expect(session?.index).toBe(1);

    expect(session?.answers).toEqual([{ id: 'b', correct: true }]);

    expect(session?.topicFilter).toBe('all');

    expect(session?.difficultyFilter).toBe('easy');
  });

  // The bank is edited between study sessions — a renamed or deleted question must
  // discard the run rather than resume it a question short.
  it('discards a run referencing a question that no longer exists', () => {

    expect(restoreSession(saved({ queueIds: ['a', 'vanished'] }), bank)).toBeNull();
  });

  it('discards a run whose questions have all gone', () => {

    expect(restoreSession(saved({ queueIds: ['x', 'y'] }), bank)).toBeNull();
  });

  it('clamps an index that points past the end', () => {

    expect(restoreSession(saved({ index: 99 }), bank)?.index).toBe(1);

    expect(restoreSession(saved({ index: -5 }), bank)?.index).toBe(0);
  });
});
