import { describe, expect, it } from 'vitest';

import { stateAt } from '../../../src/lib/round-robin';

import {
  ROUND_ROBIN_QUANTUM,
  roundRobinSchedule,
  traceNotes,
} from '../../../src/widgets/ch03/round-robin-trace';

// The chapter prints slide 14's solution as an eleven-row table. The sim does not
// encode that table — it runs the scheduler over slide 13's burst specification and
// derives it. This file is where the two are held against each other: if the scheduler
// and the notes ever disagree, that is a defect in one of them, and it fails here
// rather than on the page.
describe('roundRobinSchedule vs. the chapter’s published trace', () => {

  it('uses slide 13’s 4 ms quantum', () => {

    expect(ROUND_ROBIN_QUANTUM).toBe(4);
  });

  it('puts the same processes on the CPU, over the same intervals, as slide 14', () => {

    const slices = roundRobinSchedule.slices.map((slice) => [slice.pid, slice.from, slice.to]);

    expect(slices).toEqual([
      ['P1', 0, 4],

      ['P2', 4, 8],

      ['P3', 8, 12],

      // P1 has 2 ms of its burst left, so it yields at 14 rather than using its full
      // quantum — the chapter's callout about a quantum being an upper bound.
      ['P1', 12, 14],

      ['P2', 14, 18],

      // The same early yield again, with P3's last 1 ms.
      ['P3', 18, 19],

      ['P1', 19, 23],

      ['P3', 23, 26],

      ['P1', 26, 27],
    ]);
  });

  it('finishes at 27 ms', () => {

    expect(roundRobinSchedule.endTime).toBe(27);
  });

  it('blocks P1 on I/O from 14 to 18 and P3 from 19 to 22', () => {

    const waits = roundRobinSchedule.spans

      .filter((span) => span.state === 'waiting')

      .map((span) => [span.pid, span.from, span.to]);

    expect(waits).toEqual([
      ['P1', 14, 18],

      ['P3', 19, 22],
    ]);
  });

  it('terminates P2 at 18, P3 at 26, and P1 at 27', () => {

    expect(stateAt(roundRobinSchedule, 'P2', 18)).toBe('terminated');

    expect(stateAt(roundRobinSchedule, 'P3', 26)).toBe('terminated');

    expect(stateAt(roundRobinSchedule, 'P1', 27)).toBe('terminated');

    // ... and P3 is still running the instant before it finishes.
    expect(stateAt(roundRobinSchedule, 'P3', 25)).toBe('running');
  });

  // Spot-checks against individual rows of the chapter's table, chosen for the two
  // states it says students confuse: at 15 ms P1 cannot run (blocked on I/O) while P3
  // could run but was not picked.
  it('distinguishes waiting from ready at 15 ms', () => {

    expect(stateAt(roundRobinSchedule, 'P1', 15)).toBe('waiting');

    expect(stateAt(roundRobinSchedule, 'P2', 15)).toBe('running');

    expect(stateAt(roundRobinSchedule, 'P3', 15)).toBe('ready');
  });
});

describe('traceNotes', () => {

  it('lands every note inside the run', () => {

    for (const note of traceNotes) {

      expect(note.at).toBeGreaterThanOrEqual(0);

      expect(note.at).toBeLessThanOrEqual(roundRobinSchedule.endTime);
    }
  });

  it('is ordered by time', () => {

    const times = traceNotes.map((note) => note.at);

    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });
});
