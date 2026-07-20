// Exam-mode domain logic: what a question is, how an answer is graded, which
// questions a practice run contains, and what a finished run scored.
//
// Framework-free and side-effect-free by design — QuizRunner.svelte holds the runtime
// state and renders, this module decides. Everything here is reachable from vitest
// without a DOM, which is the whole point of the split.
//
// Persistence lives in progress-store.ts. This module only interprets what came back
// from it: a session that parsed correctly may still be unanswerable if the question
// bank changed underneath it, and only this module has the questions to notice.

import type { SavedSession, StoredAnswer } from './progress-store';

export type QuestionType = 'mcq' | 'true-false' | 'numeric' | 'short';

export type Difficulty = 'easy' | 'medium' | 'hard';

// The plain question shape the exam island consumes — the content collection's schema
// minus its chapter reference, which is resolved away when the page builds the groups.
export type Question = {

  id: string;

  topic: string;

  type: QuestionType;

  difficulty: Difficulty;

  prompt: string;

  choices: string[] | null;

  // An mcq stores the index of the correct choice; true-false stores 'true'/'false';
  // numeric stores the number; short stores the model answer's prose.
  answer: number | string;

  solution: string;

  source: string;
};

// 'all' means no restriction on that axis.
export type Filter = {

  topic: string;

  difficulty: string;
};

// Grading a short answer is the learner's job — the engine will not pretend to know.
// Making that a distinct outcome rather than `false` means a caller cannot silently
// mark a self-graded question wrong by forgetting to check its type first.
export type Verdict =
  | { kind: 'correct' }
  | { kind: 'incorrect' }
  | { kind: 'self-graded' };

export type Summary = {

  correct: number;

  total: number;

  pct: number;

  passed: boolean;

  review: { question: Question; correct: boolean }[];
};

// A saved run reconciled against the current question bank.
export type Session = {

  queue: Question[];

  index: number;

  answers: StoredAnswer[];

  topicFilter: string;

  difficultyFilter: string;
};

// The mark a run has to reach to read as a pass. One constant, rather than a literal
// sitting in markup where no test can see it.
export const PASS_PCT = 60;

function verdictOf(correct: boolean): Verdict {

  return correct ? { kind: 'correct' } : { kind: 'incorrect' };
}

// Grades one answer. `given` is whatever the input for that question type produced:
// a choice index for mcq, 'true'/'false' for true-false, the typed text for numeric.
export function gradeAnswer(question: Question, given: string | number | null): Verdict {

  // Checked before the empty-answer guard: revealing a short answer is not "answering"
  // it, so a short question is self-graded even with nothing typed.
  if (question.type === 'short') {

    return { kind: 'self-graded' };
  }

  if (given === null || given === '') {

    return { kind: 'incorrect' };
  }

  if (question.type === 'mcq') {

    return verdictOf(given === question.answer);
  }

  if (question.type === 'true-false') {

    return verdictOf(given === String(question.answer));
  }

  // numeric — compared as numbers so '4', '4.0' and ' 4 ' all match an answer of 4,
  // while a non-numeric entry is simply wrong rather than NaN-equal to anything.
  const entered = typeof given === 'number' ? given : Number.parseFloat(given);

  return verdictOf(!Number.isNaN(entered) && entered === Number(question.answer));
}

// The correct answer, rendered for the feedback panel and the results review.
export function answerText(question: Question): string {

  if (question.type === 'mcq') {

    // `answer` is an index here, but the schema types it as number | string across all
    // four question types, so the narrowing has to be explicit.
    const index = typeof question.answer === 'number' ? question.answer : Number.NaN;

    return question.choices?.[index] ?? '—';
  }

  if (question.type === 'true-false') {

    return String(question.answer) === 'true' ? 'True' : 'False';
  }

  return String(question.answer);
}

// Every topic present in the bank, in first-seen order — the filter dropdown's contents.
export function listTopics(questions: Question[]): string[] {

  return [...new Set(questions.map((question) => question.topic))];
}

export function filterQuestions(questions: Question[], filter: Filter): Question[] {

  return questions.filter(
    (question) =>
      (filter.topic === 'all' || question.topic === filter.topic) &&
      (filter.difficulty === 'all' || question.difficulty === filter.difficulty),
  );
}

// The questions a run will ask, in the order it will ask them. `rng` is injected so a
// test can assert an exact order; production takes the default.
export function buildQueue(
  questions: Question[],
  filter: Filter,
  rng: () => number = Math.random,
): Question[] {

  const pool = filterQuestions(questions, filter);

  // Fisher-Yates, walking down so each position draws from the unshuffled remainder.
  for (let i = pool.length - 1; i > 0; i -= 1) {

    const j = Math.floor(rng() * (i + 1));

    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool;
}

// Scores a finished run and joins its answers back to the questions they were about.
// Answers whose question is no longer in the bank are dropped from the review rather
// than rendered as blanks — they still count toward the score that was actually earned.
export function summarize(answers: StoredAnswer[], questions: Question[]): Summary {

  const byId = new Map(questions.map((question) => [question.id, question]));

  const correct = answers.filter((answer) => answer.correct).length;

  const total = answers.length;

  const pct = total === 0 ? 0 : Math.round((correct / total) * 100);

  const review = answers.flatMap((answer) => {

    const question = byId.get(answer.id);

    return question ? [{ question, correct: answer.correct }] : [];
  });

  return { correct, total, pct, passed: pct >= PASS_PCT, review };
}

// Reconciles a stored session against the current bank. Returns null when the run is no
// longer answerable — a question was renamed, removed, or re-chaptered since it was
// saved — so a stale run is discarded instead of resuming with missing questions.
export function restoreSession(saved: SavedSession, questions: Question[]): Session | null {

  const byId = new Map(questions.map((question) => [question.id, question]));

  const queue = saved.queueIds.flatMap((id) => {

    const question = byId.get(id);

    return question ? [question] : [];
  });

  if (queue.length !== saved.queueIds.length || queue.length === 0) {

    return null;
  }

  return {

    queue,

    // Clamped: a saved index past the end would leave the run with no current question.
    index: Math.min(Math.max(saved.index, 0), queue.length - 1),

    answers: saved.answers,

    topicFilter: saved.topicFilter,

    difficultyFilter: saved.difficultyFilter,
  };
}
