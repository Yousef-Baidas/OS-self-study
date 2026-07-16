// Hand-rolled focus-trap helpers for the mobile chapters drawer (D-14, the
// WAI-ARIA APG modal-dialog pattern — RESEARCH Pattern 5). No `focus-trap`/
// `focus-trap-svelte` dependency: a single non-nested dialog doesn't need a
// general-purpose library ("Don't Hand-Roll" table explicitly calls this the
// one case where hand-rolling is the right call).
//
// Split in two by testability: `nextTrapIndex` is the pure tab-cycling wrap
// math (framework-free, unit-tested below); `getFocusableElements` touches
// the DOM and is NOT unit-tested (no jsdom in this stack, by design — see
// ARCHITECTURE.md's "src/lib/ stays framework-free" convention).

// Computes the next focusable index when Tab (shift=false) or Shift+Tab
// (shift=true) is pressed inside a focus-trapped container, wrapping at
// both ends so focus never escapes the trap and never gets stuck.
export function nextTrapIndex(count: number, current: number, shift: boolean): number {

  const delta = shift ? -1 : 1;

  return (current + delta + count) % count;
}

// Returns every element inside `container` that the WAI-ARIA APG dialog
// pattern treats as tabbable, in DOM order — the pool nextTrapIndex cycles
// over. Real `<a>`/`<button>` elements only (Pitfall 7 — no custom
// `<div onclick>` controls need to be special-cased here).
export function getFocusableElements(container: HTMLElement): HTMLElement[] {

  const selector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}
