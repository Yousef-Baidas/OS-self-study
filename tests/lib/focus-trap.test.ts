import { describe, expect, it } from 'vitest';

import { nextTrapIndex } from '../../src/lib/focus-trap';

describe('nextTrapIndex', () => {

  it('wraps forward from the last index back to the first', () => {

    expect(nextTrapIndex(3, 2, false)).toBe(0);
  });

  it('wraps backward from the first index back to the last', () => {

    expect(nextTrapIndex(3, 0, true)).toBe(2);
  });

  it('moves forward normally when not at the last index', () => {

    expect(nextTrapIndex(3, 1, false)).toBe(2);
  });

  it('moves backward normally when not at the first index', () => {

    expect(nextTrapIndex(3, 1, true)).toBe(0);
  });

  it('traps a single focusable element to itself', () => {

    expect(nextTrapIndex(1, 0, false)).toBe(0);
  });
});
