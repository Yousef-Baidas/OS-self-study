// Roving-tabindex index math for segmented radiogroups (WAI-ARIA APG radiogroup
// pattern). Shared by SimFrame's Guided/Explore toggle and the Chapter-2
// OsStructureExplorer's five-way structure switcher.
//
// Split in two by testability, same as focus-trap.ts: this module is the pure
// index arithmetic (framework-free, unit-tested); moving DOM focus onto the
// resulting segment stays in the components, which own the element refs.
//
// Disabled slots are skipped rather than special-cased by the caller — SimFrame's
// Explore segment stays locked until the reader reaches the final guided step,
// and the traversal simply walks past it.

export type RovingOrientation = 'horizontal' | 'vertical' | 'both';

export type RovingOptions = {

  // Which arrow keys move selection. 'both' (the default) accepts all four, matching
  // a radiogroup that reflows between a row and a column at the mobile breakpoint.
  orientation?: RovingOrientation;

  // Reports whether the segment at `index` is currently unselectable.
  isDisabled?: (index: number) => boolean;
};

// What a key press means, once orientation has been applied.
type Intent = 'previous' | 'next' | 'first' | 'last';

// Maps a KeyboardEvent.key onto a movement, or null when this radiogroup does not
// handle that key — the caller uses null to decide against preventDefault().
function intentFor(key: string, orientation: RovingOrientation): Intent | null {

  const horizontal = orientation === 'horizontal' || orientation === 'both';

  const vertical = orientation === 'vertical' || orientation === 'both';

  if ((horizontal && key === 'ArrowRight') || (vertical && key === 'ArrowDown')) {

    return 'next';
  }

  if ((horizontal && key === 'ArrowLeft') || (vertical && key === 'ArrowUp')) {

    return 'previous';
  }

  if (key === 'Home') {

    return 'first';
  }

  if (key === 'End') {

    return 'last';
  }

  return null;
}

// Walks from `start` in `delta` steps, wrapping at both ends, and returns the first
// index whose segment is enabled. `start` itself is a candidate — that is what makes
// Home/End land on index 0 / count-1 when those are enabled, while Next/Previous pass
// current±1 and therefore always move off the current segment.
//
// Returns null when no enabled segment exists, so an all-locked radiogroup reports the
// key as unhandled instead of spinning.
function seek(
  start: number,
  delta: number,
  count: number,
  isDisabled: (index: number) => boolean,
): number | null {

  // Bounded by construction: at most `count` candidates exist, so an all-disabled
  // group falls out of the loop instead of walking forever. `start` can arrive as -1
  // or `count` (callers pass current ± 1), which the positive modulo folds back in —
  // JS `%` keeps the sign of the dividend, so a bare `%` would yield -1 here.
  for (let offset = 0; offset < count; offset += 1) {

    const candidate = (((start + offset * delta) % count) + count) % count;

    if (!isDisabled(candidate)) {

      return candidate;
    }
  }

  return null;
}

// Computes the segment that should become selected when `key` is pressed while the
// segment at `current` is selected, out of `count` segments.
//
// Returns null for exactly one reason: this radiogroup does not navigate with that key,
// so the caller must let the browser handle it (Tab must still move focus out). Any key
// the group does own returns an index — `current` itself when every other segment is
// disabled — so the caller can always preventDefault() on a non-null result. Selecting
// the segment that is already selected is a no-op, whereas failing to preventDefault
// would scroll the page out from under the reader while a locked segment blocks the move.
export function nextRovingIndex(
  key: string,
  current: number,
  count: number,
  options: RovingOptions = {},
): number | null {

  if (count <= 0) {

    return null;
  }

  const intent = intentFor(key, options.orientation ?? 'both');

  if (intent === null) {

    return null;
  }

  const isDisabled = options.isDisabled ?? (() => false);

  if (intent === 'first') {

    return seek(0, 1, count, isDisabled) ?? current;
  }

  if (intent === 'last') {

    return seek(count - 1, -1, count, isDisabled) ?? current;
  }

  const delta = intent === 'next' ? 1 : -1;

  return seek(current + delta, delta, count, isDisabled) ?? current;
}
