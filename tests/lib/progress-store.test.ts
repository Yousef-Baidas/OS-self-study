import { beforeEach, describe, expect, it } from 'vitest';

import {
  createProgressStore,
  type KeyValueStorage,
  type SavedSession,
} from '../../src/lib/progress-store';

// In-memory adapter standing in for localStorage — the second adapter that makes the
// storage seam real rather than hypothetical.
function memoryStorage(seed: Record<string, string> = {}) {

  const map = new Map(Object.entries(seed));

  const storage: KeyValueStorage & { map: Map<string, string> } = {

    map,

    getItem: (key) => map.get(key) ?? null,

    setItem: (key, value) => void map.set(key, value),

    removeItem: (key) => void map.delete(key),
  };

  return storage;
}

// Storage that exists but refuses every operation — Safari private mode, or over quota.
const hostileStorage: KeyValueStorage = {

  getItem: () => {
    throw new Error('storage disabled');
  },

  setItem: () => {
    throw new Error('quota exceeded');
  },

  removeItem: () => {
    throw new Error('storage disabled');
  },
};

const session: SavedSession = {

  queueIds: ['ch01-q1', 'ch01-q2'],

  index: 1,

  answers: [{ id: 'ch01-q1', correct: true }],

  topicFilter: 'all',

  difficultyFilter: 'easy',
};

describe('createProgressStore', () => {

  let storage: ReturnType<typeof memoryStorage>;

  beforeEach(() => {

    storage = memoryStorage();
  });

  describe('session round-trip', () => {

    it('saves and reloads a session per chapter', () => {

      const store = createProgressStore(storage);

      store.saveSession('introduction', session);

      expect(store.loadSession('introduction')).toEqual(session);
    });

    it('keys sessions by chapter so they do not collide', () => {

      const store = createProgressStore(storage);

      store.saveSession('introduction', session);

      expect(store.loadSession('operating-system-structures')).toBeNull();

      expect(storage.map.has('os-exam-introduction-session')).toBe(true);
    });

    it('clears only the named chapter', () => {

      const store = createProgressStore(storage);

      store.saveSession('introduction', session);

      store.saveSession('operating-system-structures', session);

      store.clearSession('introduction');

      expect(store.loadSession('introduction')).toBeNull();

      expect(store.loadSession('operating-system-structures')).toEqual(session);
    });

    it('returns null when nothing was saved', () => {

      expect(createProgressStore(storage).loadSession('introduction')).toBeNull();
    });
  });

  describe('rejecting values it did not write', () => {

    it.each([
      ['malformed JSON', '{not json'],
      ['a non-object', '42'],
      ['an empty queue', '{"queueIds":[],"index":0,"answers":[]}'],
      ['a missing queue', '{"index":0,"answers":[]}'],
      ['non-string ids', '{"queueIds":[1,2],"index":0,"answers":[]}'],
      ['a negative index', '{"queueIds":["a"],"index":-1,"answers":[]}'],
      ['malformed answers', '{"queueIds":["a"],"index":0,"answers":[{"id":"a"}]}'],
    ])('discards %s', (_label, raw) => {

      const store = createProgressStore(memoryStorage({ 'os-exam-introduction-session': raw }));

      expect(store.loadSession('introduction')).toBeNull();
    });
  });

  describe('last result', () => {

    it('saves and reloads the score line', () => {

      const store = createProgressStore(storage);

      store.saveLastResult('introduction', { correct: 8, total: 10, pct: 80 });

      expect(store.loadLastResult('introduction')).toEqual({ correct: 8, total: 10, pct: 80 });
    });

    it('discards a result of the wrong shape', () => {

      const store = createProgressStore(
        memoryStorage({ 'os-exam-introduction-last': '{"correct":"eight"}' }),
      );

      expect(store.loadLastResult('introduction')).toBeNull();
    });
  });

  describe('remembered chapter', () => {

    it('round-trips the selected chapter', () => {

      const store = createProgressStore(storage);

      store.saveChapter('operating-system-structures');

      expect(store.loadChapter()).toBe('operating-system-structures');
    });

    // The key predates this module and holds a bare slug, not JSON. Reading it any
    // other way would reset every existing student's remembered chapter once.
    it('reads the pre-existing bare-string format', () => {

      const store = createProgressStore(memoryStorage({ 'os-exam-chapter': 'introduction' }));

      expect(store.loadChapter()).toBe('introduction');

      expect(storage.map.get('os-exam-chapter')).toBeUndefined();
    });

    it('writes the slug unquoted', () => {

      const store = createProgressStore(storage);

      store.saveChapter('introduction');

      expect(storage.map.get('os-exam-chapter')).toBe('introduction');
    });
  });

  describe('when storage is unavailable', () => {

    it('degrades to no-ops with a null storage', () => {

      const store = createProgressStore(null);

      expect(() => store.saveSession('introduction', session)).not.toThrow();

      expect(store.loadSession('introduction')).toBeNull();

      expect(store.loadChapter()).toBeNull();

      expect(() => store.clearSession('introduction')).not.toThrow();
    });

    it('swallows storage that throws on every call', () => {

      const store = createProgressStore(hostileStorage);

      expect(() => store.saveSession('introduction', session)).not.toThrow();

      expect(() => store.saveChapter('introduction')).not.toThrow();

      expect(() => store.clearSession('introduction')).not.toThrow();

      expect(store.loadSession('introduction')).toBeNull();

      expect(store.loadLastResult('introduction')).toBeNull();

      expect(store.loadChapter()).toBeNull();
    });
  });
});
