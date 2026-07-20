import { describe, expect, it } from 'vitest';

import { nextRovingIndex } from '../../src/lib/roving-index';

// Locks the WAI-ARIA radiogroup keyboard model both segmented controls now share:
// arrows move selection and wrap, Home/End jump to the ends, disabled segments are
// skipped, and any other key reports no movement so the caller leaves it alone.

describe('nextRovingIndex', () => {

  describe('arrow movement', () => {

    it('steps forward on ArrowRight and ArrowDown', () => {

      expect(nextRovingIndex('ArrowRight', 0, 5)).toBe(1);

      expect(nextRovingIndex('ArrowDown', 3, 5)).toBe(4);
    });

    it('steps backward on ArrowLeft and ArrowUp', () => {

      expect(nextRovingIndex('ArrowLeft', 3, 5)).toBe(2);

      expect(nextRovingIndex('ArrowUp', 1, 5)).toBe(0);
    });

    it('wraps at both ends', () => {

      expect(nextRovingIndex('ArrowRight', 4, 5)).toBe(0);

      expect(nextRovingIndex('ArrowLeft', 0, 5)).toBe(4);
    });
  });

  describe('Home and End', () => {

    it('jumps to the first and last segment', () => {

      expect(nextRovingIndex('Home', 3, 5)).toBe(0);

      expect(nextRovingIndex('End', 1, 5)).toBe(4);
    });

    it('lands on the nearest enabled segment when an end is disabled', () => {

      const isDisabled = (index: number) => index === 0 || index === 4;

      expect(nextRovingIndex('Home', 2, 5, { isDisabled })).toBe(1);

      expect(nextRovingIndex('End', 2, 5, { isDisabled })).toBe(3);
    });
  });

  describe('orientation', () => {

    it('ignores vertical arrows when horizontal', () => {

      const options = { orientation: 'horizontal' as const };

      expect(nextRovingIndex('ArrowRight', 0, 3, options)).toBe(1);

      expect(nextRovingIndex('ArrowDown', 0, 3, options)).toBeNull();
    });

    it('ignores horizontal arrows when vertical', () => {

      const options = { orientation: 'vertical' as const };

      expect(nextRovingIndex('ArrowDown', 0, 3, options)).toBe(1);

      expect(nextRovingIndex('ArrowRight', 0, 3, options)).toBeNull();
    });

    it('accepts Home and End regardless of orientation', () => {

      expect(nextRovingIndex('Home', 2, 3, { orientation: 'horizontal' })).toBe(0);

      expect(nextRovingIndex('End', 0, 3, { orientation: 'vertical' })).toBe(2);
    });
  });

  describe('disabled segments', () => {

    it('skips a disabled neighbour and keeps walking', () => {

      const isDisabled = (index: number) => index === 1 || index === 2;

      expect(nextRovingIndex('ArrowRight', 0, 4, { isDisabled })).toBe(3);

      expect(nextRovingIndex('ArrowLeft', 3, 4, { isDisabled })).toBe(0);
    });

    it('skips a disabled segment across the wrap point', () => {

      const isDisabled = (index: number) => index === 0;

      expect(nextRovingIndex('ArrowRight', 2, 3, { isDisabled })).toBe(1);
    });

    // SimFrame's case: Explore stays locked until the reader reaches the final guided
    // step, so the only other segment is unselectable. The key still belongs to the
    // radiogroup, so it resolves to the current segment rather than null — otherwise
    // the caller skips preventDefault and the arrow scrolls the page.
    it('stays on the current segment when every other segment is disabled', () => {

      const isDisabled = (index: number) => index === 1;

      expect(nextRovingIndex('ArrowRight', 0, 2, { isDisabled })).toBe(0);

      expect(nextRovingIndex('ArrowLeft', 0, 2, { isDisabled })).toBe(0);
    });

    it('stays on the current segment when every segment is disabled', () => {

      const isDisabled = () => true;

      expect(nextRovingIndex('ArrowRight', 1, 3, { isDisabled })).toBe(1);

      expect(nextRovingIndex('Home', 1, 3, { isDisabled })).toBe(1);

      expect(nextRovingIndex('End', 1, 3, { isDisabled })).toBe(1);
    });
  });

  describe('keys and counts it does not handle', () => {

    it('returns null for unrelated keys', () => {

      expect(nextRovingIndex('Tab', 0, 3)).toBeNull();

      expect(nextRovingIndex('Enter', 0, 3)).toBeNull();

      expect(nextRovingIndex('a', 0, 3)).toBeNull();
    });

    it('returns null for an empty group', () => {

      expect(nextRovingIndex('ArrowRight', 0, 0)).toBeNull();
    });

    // A one-segment group still owns its arrow keys — it just has nowhere to go.
    it('stays put in a single-segment group', () => {

      expect(nextRovingIndex('ArrowRight', 0, 1)).toBe(0);

      expect(nextRovingIndex('ArrowLeft', 0, 1)).toBe(0);
    });
  });
});
