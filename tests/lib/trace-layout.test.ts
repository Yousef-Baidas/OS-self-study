import { describe, expect, it } from 'vitest';

import { scheduleRoundRobin } from '../../src/lib/round-robin';

import { TRACE, layoutTrace, tickMarks } from '../../src/lib/trace-layout';

const schedule = scheduleRoundRobin(
  [
    { id: 'P1', cpuBursts: [6, 5], ioBursts: [4] },

    { id: 'P2', cpuBursts: [8], ioBursts: [] },

    { id: 'P3', cpuBursts: [5, 3], ioBursts: [3] },
  ],
  4,
);

describe('layoutTrace — rows', () => {

  it('gives every process one row, in specification order', () => {

    const { rows } = layoutTrace(schedule);

    expect(rows.map((row) => row.pid)).toEqual(['P1', 'P2', 'P3']);
  });

  it('stacks the rows one row pitch apart', () => {

    const { rows } = layoutTrace(schedule);

    rows.forEach((row, index) => {

      expect(row.y).toBe(TRACE.top + index * TRACE.rowPitch);
    });
  });
});

describe('layoutTrace — segments', () => {

  // docs/FIGURES.md rule 4: a contiguous timeline TILES. Each segment's start is the
  // previous one's end — no gap to read as dead time, no overlap to darken a seam.
  //
  // Asserted on boundaries rather than on x + width, and that is the whole point: two
  // adjacent spans share a boundary TIME, so both sides of the seam are the same
  // computed number and the equality is exact. Deriving one side as x + width instead
  // reintroduces float drift (it lands on 343.99999999999994 for a 27 ms run).
  it('tiles each row edge to edge across the whole run', () => {

    const { rows } = layoutTrace(schedule);

    for (const row of rows) {

      expect(row.segments[0].x).toBe(TRACE.left);

      for (let i = 1; i < row.segments.length; i += 1) {

        expect(row.segments[i].x).toBe(row.segments[i - 1].xEnd);
      }

      expect(row.segments[row.segments.length - 1].xEnd).toBe(TRACE.left + TRACE.trackWidth);
    }
  });

  // The schedule keeps zero-length ready spans on purpose (a process dispatched the
  // instant it wakes still passes through ready). They must not reach the drawing:
  // a zero-width rect with a stroke renders as a stray vertical tick.
  it('drops the zero-width spans the schedule keeps', () => {

    const { rows } = layoutTrace(schedule);

    for (const row of rows) {

      for (const segment of row.segments) {

        expect(segment.xEnd).toBeGreaterThan(segment.x);
      }
    }
  });

  it('scales time linearly across the track', () => {

    const { rows } = layoutTrace(schedule);

    const p1 = rows[0];

    // P1's first slice is 0-4 ms of a 27 ms run. (segments[0] is the zero-width ready
    // span at time 0, which the layout drops — so segments[0] here is the run itself.)
    expect(p1.segments[0].xEnd - p1.segments[0].x).toBeCloseTo((4 / 27) * TRACE.trackWidth, 6);
  });

  it('carries the state through so the row can be coloured', () => {

    const { rows } = layoutTrace(schedule);

    const states = rows[1].segments.map((segment) => segment.state);

    // P2: ready, then running, ready, running, then terminated for the rest.
    expect(states[0]).toBe('ready');

    expect(states[states.length - 1]).toBe('terminated');
  });
});

describe('layoutTrace — the playhead', () => {

  it('sits at the left edge at time zero and the right edge at the end', () => {

    expect(layoutTrace(schedule, 0).playheadX).toBe(TRACE.left);

    expect(layoutTrace(schedule, schedule.endTime).playheadX).toBe(TRACE.left + TRACE.trackWidth);
  });

  it('clamps to the track when asked for a time outside the run', () => {

    expect(layoutTrace(schedule, -5).playheadX).toBe(TRACE.left);

    expect(layoutTrace(schedule, 999).playheadX).toBe(TRACE.left + TRACE.trackWidth);
  });
});

describe('tickMarks', () => {

  it('marks zero and the end of the run', () => {

    const ticks = tickMarks(schedule, 4);

    expect(ticks[0].t).toBe(0);

    expect(ticks[ticks.length - 1].t).toBe(27);
  });

  it('steps by the interval given, without doubling up on the end', () => {

    const ticks = tickMarks(schedule, 4);

    expect(ticks.map((tick) => tick.t)).toEqual([0, 4, 8, 12, 16, 20, 24, 27]);
  });

  it('does not repeat the end when it falls on the interval', () => {

    const even = scheduleRoundRobin([{ id: 'P1', cpuBursts: [8], ioBursts: [] }], 4);

    expect(tickMarks(even, 4).map((tick) => tick.t)).toEqual([0, 4, 8]);
  });
});
