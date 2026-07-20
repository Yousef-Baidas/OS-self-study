// Exam-mode progress persistence. Owns every localStorage key the exam uses, the
// JSON encode/decode around them, and the fact that browser storage can simply not
// be there — Safari's private mode throws on access, quota errors throw on write.
//
// Callers get plain values back and never write a try/catch. Storage is injected so
// tests drive an in-memory adapter: two adapters, one seam.
//
// Scope note: this module answers "what was saved?", not "is it still usable?".
// Deciding a saved session has gone stale needs the current question bank, so that
// rule lives in exam-engine.ts, next to the questions.

// The slice of the Web Storage API this module actually needs. Narrower than the DOM
// `Storage` type on purpose — a test fake implements three methods, not eight.
export type KeyValueStorage = {

  getItem(key: string): string | null;

  setItem(key: string, value: string): void;

  removeItem(key: string): void;
};

export type StoredAnswer = {

  id: string;

  correct: boolean;
};

// A practice run frozen mid-flight. Questions are stored as ids, not objects, so a
// reworded question bank can be reconciled on resume rather than silently restoring
// stale prompts.
export type SavedSession = {

  queueIds: string[];

  index: number;

  answers: StoredAnswer[];

  topicFilter: string;

  difficultyFilter: string;
};

// The score line shown when a student returns to a chapter they have finished before.
// Deliberately just the arithmetic — the review list is derived from the live bank,
// never persisted, so it can't drift from the questions on disk.
export type StoredResult = {

  correct: number;

  total: number;

  pct: number;
};

function sessionKey(chapter: string): string {

  return `os-exam-${chapter}-session`;
}

function lastResultKey(chapter: string): string {

  return `os-exam-${chapter}-last`;
}

// Not chapter-scoped: which chapter the student was last practising.
const CHAPTER_KEY = 'os-exam-chapter';

// Resolves browser storage if it exists and is reachable. Merely touching
// `localStorage` throws in some privacy modes, so the access itself is guarded.
export function resolveBrowserStorage(): KeyValueStorage | null {

  try {

    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {

    return null;
  }
}

function isStoredAnswer(value: unknown): value is StoredAnswer {

  if (typeof value !== 'object' || value === null) {

    return false;
  }

  const answer = value as Partial<StoredAnswer>;

  return typeof answer.id === 'string' && typeof answer.correct === 'boolean';
}

// Guards against anything that isn't a session we wrote — a half-written value, an
// older shape, or another site's key colliding on the same origin.
function isSavedSession(value: unknown): value is SavedSession {

  if (typeof value !== 'object' || value === null) {

    return false;
  }

  const session = value as Partial<SavedSession>;

  if (!Array.isArray(session.queueIds) || session.queueIds.length === 0) {

    return false;
  }

  if (!session.queueIds.every((id) => typeof id === 'string')) {

    return false;
  }

  if (typeof session.index !== 'number' || !Number.isInteger(session.index) || session.index < 0) {

    return false;
  }

  return Array.isArray(session.answers) && session.answers.every(isStoredAnswer);
}

function isStoredResult(value: unknown): value is StoredResult {

  if (typeof value !== 'object' || value === null) {

    return false;
  }

  const result = value as Partial<StoredResult>;

  return (
    typeof result.correct === 'number' &&
    typeof result.total === 'number' &&
    typeof result.pct === 'number'
  );
}

// Builds the exam's progress store over the given storage. Passing null — or running
// where storage is unavailable — yields a store whose reads return null and whose
// writes are silently dropped, so the exam still runs, just without resuming.
export function createProgressStore(storage: KeyValueStorage | null = resolveBrowserStorage()) {

  function read(key: string): unknown {

    if (storage === null) {

      return null;
    }

    try {

      const raw = storage.getItem(key);

      return raw === null ? null : JSON.parse(raw);
    } catch {

      // Unreadable or malformed — indistinguishable from "nothing saved" to a caller.
      return null;
    }
  }

  function write(key: string, value: unknown): void {

    if (storage === null) {

      return;
    }

    try {

      storage.setItem(key, JSON.stringify(value));
    } catch {

      // Over quota or storage disabled mid-session — progress stops persisting, the
      // run in progress is unaffected.
    }
  }

  function remove(key: string): void {

    if (storage === null) {

      return;
    }

    try {

      storage.removeItem(key);
    } catch {

      /* nothing recoverable to do */
    }
  }

  return {

    loadSession(chapter: string): SavedSession | null {

      const value = read(sessionKey(chapter));

      return isSavedSession(value) ? value : null;
    },

    saveSession(chapter: string, session: SavedSession): void {

      write(sessionKey(chapter), session);
    },

    clearSession(chapter: string): void {

      remove(sessionKey(chapter));
    },

    loadLastResult(chapter: string): StoredResult | null {

      const value = read(lastResultKey(chapter));

      return isStoredResult(value) ? value : null;
    },

    saveLastResult(chapter: string, result: StoredResult): void {

      write(lastResultKey(chapter), result);
    },

    // Stored as a bare string rather than JSON — that is the format already on
    // students' machines, and round-tripping it through JSON would reset everyone's
    // remembered chapter exactly once for no gain.
    loadChapter(): string | null {

      if (storage === null) {

        return null;
      }

      try {

        return storage.getItem(CHAPTER_KEY);
      } catch {

        return null;
      }
    },

    saveChapter(slug: string): void {

      if (storage === null) {

        return;
      }

      try {

        storage.setItem(CHAPTER_KEY, slug);
      } catch {

        /* selection still works in memory */
      }
    },
  };
}

export type ProgressStore = ReturnType<typeof createProgressStore>;
