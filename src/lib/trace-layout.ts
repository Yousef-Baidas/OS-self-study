// Geometry for the StateTrace sim's timeline (Chapter 3, slides 13-14).
//
// Per docs/FIGURES.md, sim geometry is computed here and unit-tested rather than
// asserted in markup. A timeline is the spec's "contiguous region" case (rule 4): the
// segments TILE — square corners, each one starting exactly where the last ended — so
// no seam reads as a gap in time or darkens where two rects overlap.

import type { ProcessState, Schedule } from './round-robin';

export const TRACE = {

  left: 44,

  top: 20,

  trackWidth: 300,

  rowHeight: 30,

  rowPitch: 46,

  // Space below the last row for the time axis.
  axisGap: 18,
} as const;

export type Segment = {

  state: ProcessState;

  // Boundaries, not an extent. Adjacent spans share a boundary TIME, so both sides of
  // a seam are the same computed number and rule 4's tiling is exact. Storing a width
  // instead would make the far edge `x + width`, which drifts (the last segment of a
  // 27 ms run lands on 343.99999999999994 rather than 344). The component derives
  // `width={xEnd - x}` at render time, where the residue cannot propagate.
  x: number;

  xEnd: number;

  // Kept alongside the geometry so a label can name the interval without converting
  // back out of pixel space.
  from: number;

  to: number;
};

export type Row = {

  pid: string;

  y: number;

  segments: Segment[];
};

export type Tick = {

  t: number;

  x: number;
};

export type TraceLayout = {

  rows: Row[];

  playheadX: number;

  viewBox: string;
};

function clamp(value: number, low: number, high: number): number {

  return Math.min(high, Math.max(low, value));
}

export function layoutTrace(schedule: Schedule, time = 0): TraceLayout {

  // t / endTime rather than t * (trackWidth / endTime): the ratio is exactly 1 at the
  // end of the run, so the last boundary lands exactly on the right edge of the track.
  const xOf = (t: number) => TRACE.left + (t / schedule.endTime) * TRACE.trackWidth;

  // Specification order, taken from the spans rather than a second list, so a row can
  // never appear for a process the schedule does not describe.
  const pids: string[] = [];

  for (const span of schedule.spans) {

    if (!pids.includes(span.pid)) {

      pids.push(span.pid);
    }
  }

  const rows = pids.map((pid, index) => ({
    pid,

    y: TRACE.top + index * TRACE.rowPitch,

    segments: schedule.spans

      .filter((span) => span.pid === pid && span.to > span.from)

      .map((span) => ({
        state: span.state,

        x: xOf(span.from),

        xEnd: xOf(span.to),

        from: span.from,

        to: span.to,
      })),
  }));

  const height = TRACE.top + pids.length * TRACE.rowPitch + TRACE.axisGap;

  return {
    rows,

    playheadX: xOf(clamp(time, 0, schedule.endTime)),

    viewBox: `0 0 ${TRACE.left + TRACE.trackWidth + TRACE.left} ${height}`,
  };
}

// Axis ticks every `interval` ms, always including the end of the run — which is what
// the reader is counting towards — but never twice when the run ends on the interval.
export function tickMarks(schedule: Schedule, interval: number): Tick[] {

  const ticks: Tick[] = [];

  for (let t = 0; t < schedule.endTime; t += interval) {

    ticks.push({ t, x: TRACE.left + (t / schedule.endTime) * TRACE.trackWidth });
  }

  ticks.push({ t: schedule.endTime, x: TRACE.left + TRACE.trackWidth });

  return ticks;
}
