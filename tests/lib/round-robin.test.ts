import { describe, expect, it } from 'vitest';

import {
  scheduleRoundRobin,
  stateAt,
  type ProcessSpec,
  type Schedule,
} from '../../src/lib/round-robin';

function spec(id: string, cpuBursts: number[], ioBursts: number[] = []): ProcessSpec {

  return { id, cpuBursts, ioBursts };
}

function sliceList(schedule: Schedule): [string, number, number][] {

  return schedule.slices.map((slice) => [slice.pid, slice.from, slice.to]);
}

function spansFor(schedule: Schedule, pid: string) {

  return schedule.spans

    .filter((span) => span.pid === pid)

    .map((span) => [span.state, span.from, span.to]);
}

describe('scheduleRoundRobin — the quantum', () => {

  it('runs a lone process straight through when its burst is shorter than the quantum', () => {

    const schedule = scheduleRoundRobin([spec('P1', [3])], 4);

    expect(sliceList(schedule)).toEqual([['P1', 0, 3]]);

    expect(schedule.endTime).toBe(3);
  });

  it('preempts at the quantum and sends the process to the back of the queue', () => {

    const schedule = scheduleRoundRobin([spec('P1', [6]), spec('P2', [6])], 4);

    expect(sliceList(schedule)).toEqual([
      ['P1', 0, 4],

      ['P2', 4, 8],

      ['P1', 8, 10],

      ['P2', 10, 12],
    ]);
  });

  // The chapter's point about 12-14: a quantum is an upper bound on a turn, not a
  // fixed length. A process that finishes its burst early gives the CPU back early.
  it('never runs a slice longer than the quantum', () => {

    const schedule = scheduleRoundRobin(
      [spec('P1', [6, 5], [4]), spec('P2', [8]), spec('P3', [5, 3], [3])],
      4,
    );

    for (const slice of schedule.slices) {

      expect(slice.to - slice.from).toBeLessThanOrEqual(4);

      expect(slice.to - slice.from).toBeGreaterThan(0);
    }
  });

  it('puts nothing else on the CPU while a process holds it', () => {

    const schedule = scheduleRoundRobin(
      [spec('P1', [6, 5], [4]), spec('P2', [8]), spec('P3', [5, 3], [3])],
      4,
    );

    for (let i = 1; i < schedule.slices.length; i += 1) {

      expect(schedule.slices[i].from).toBeGreaterThanOrEqual(schedule.slices[i - 1].to);
    }
  });
});

describe('scheduleRoundRobin — blocking on I/O', () => {

  it('moves a process to waiting when its burst ends and I/O follows', () => {

    const schedule = scheduleRoundRobin([spec('P1', [2, 2], [5])], 4);

    expect(spansFor(schedule, 'P1')).toEqual([
      // Admitted to ready at 0 and dispatched in the same instant, since it is the
      // only process — the same zero-width case as the wake below, at the other end.
      ['ready', 0, 0],

      ['running', 0, 2],

      ['waiting', 2, 7],

      // A zero-length ready span, kept rather than collapsed. The CPU happens to be
      // free the instant the I/O completes, so the process is dispatched immediately —
      // but it still passes through ready, and the five-state diagram says it must.
      // Dropping the span would make the data claim a waiting -> running transition
      // that the chapter explicitly denies. The renderer skips zero-width spans; the
      // schedule keeps them.
      ['ready', 7, 7],

      ['running', 7, 9],

      ['terminated', 9, 9],
    ]);
  });

  it('leaves the CPU idle when every process is blocked', () => {

    const schedule = scheduleRoundRobin([spec('P1', [1, 1], [5])], 4);

    // Nothing runs between 1 and 6 — there is a real gap, not a stretched slice.
    expect(sliceList(schedule)).toEqual([
      ['P1', 0, 1],

      ['P1', 6, 7],
    ]);
  });

  // The chapter calls this out twice: "nothing goes from waiting straight back to
  // running". If the scheduler ever dispatched a woken process directly, the sim would
  // be teaching against its own state diagram.
  it('never moves a process from waiting straight to running', () => {

    const schedule = scheduleRoundRobin(
      [spec('P1', [6, 5], [4]), spec('P2', [8]), spec('P3', [5, 3], [3])],
      4,
    );

    for (const pid of ['P1', 'P2', 'P3']) {

      const states = spansFor(schedule, pid).map(([state]) => state);

      for (let i = 1; i < states.length; i += 1) {

        expect([states[i - 1], states[i]]).not.toEqual(['waiting', 'running']);
      }
    }
  });
});

describe('scheduleRoundRobin — state spans', () => {

  const schedule = scheduleRoundRobin(
    [spec('P1', [6, 5], [4]), spec('P2', [8]), spec('P3', [5, 3], [3])],
    4,
  );

  it('covers the whole run for every process, with no gap and no overlap', () => {

    for (const pid of ['P1', 'P2', 'P3']) {

      const spans = schedule.spans.filter((span) => span.pid === pid);

      expect(spans[0].from).toBe(0);

      expect(spans[spans.length - 1].to).toBe(schedule.endTime);

      for (let i = 1; i < spans.length; i += 1) {

        expect(spans[i].from).toBe(spans[i - 1].to);
      }
    }
  });

  it('ends every process terminated', () => {

    for (const pid of ['P1', 'P2', 'P3']) {

      expect(stateAt(schedule, pid, schedule.endTime)).toBe('terminated');
    }
  });

  it('reports a process as terminated past the end of the run', () => {

    expect(stateAt(schedule, 'P2', 999)).toBe('terminated');
  });

  it('agrees with the slices about who is on the CPU', () => {

    for (const slice of schedule.slices) {

      // Sampled just inside the slice so the boundary instants aren't the thing
      // under test — a state is a half-open interval [from, to).
      const inside = slice.from + (slice.to - slice.from) / 2;

      expect(stateAt(schedule, slice.pid, inside)).toBe('running');

      for (const other of ['P1', 'P2', 'P3'].filter((pid) => pid !== slice.pid)) {

        expect(stateAt(schedule, other, inside)).not.toBe('running');
      }
    }
  });
});
