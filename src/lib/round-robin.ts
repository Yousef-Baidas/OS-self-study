// Round-robin CPU scheduling with I/O, for the StateTrace sim (Chapter 3, slides 13-14).
//
// The chapter already prints the answer to slide 13's worked example as a table. This
// module does not encode that table — it runs the scheduler and derives it, and the
// test in tests/widgets/ch03/ checks the derivation against the published answer. That
// is the difference between a sim that re-presents the notes and one that can be wrong
// in a way a test catches.
//
// Two behaviours are the examinable content rather than implementation detail:
//   - the quantum is an upper bound on a turn, not a fixed length: a process that
//     finishes its burst early hands the CPU back early (the chapter's 12-14 note);
//   - a process whose I/O completes re-enters READY and queues up like everyone else.
//     Nothing goes from waiting straight to running, so the schedule always records
//     the intervening ready span even when it has zero width.

export type ProcessSpec = {

  id: string;

  // CPU bursts in order. A process with two bursts runs, blocks on I/O, then runs again.
  cpuBursts: number[];

  // ioBursts[i] is the wait that follows cpuBursts[i]. A process that never blocks
  // (slide 13's P2) has none.
  ioBursts: number[];
};

export type ProcessState = 'ready' | 'running' | 'waiting' | 'terminated';

export type CpuSlice = {

  pid: string;

  from: number;

  to: number;
};

export type StateSpan = {

  pid: string;

  state: ProcessState;

  // Half-open: the process is in `state` for from <= t < to. Zero-length spans are
  // kept deliberately (see the module comment); a renderer should skip them.
  from: number;

  to: number;
};

export type Schedule = {

  quantum: number;

  endTime: number;

  slices: CpuSlice[];

  spans: StateSpan[];
};

// Mutable bookkeeping for one process while the schedule is being built.
type Runner = {

  spec: ProcessSpec;

  // Index of the CPU burst currently being worked through.
  burst: number;

  // Milliseconds left in that burst.
  remaining: number;

  // Recorded state changes, in time order.
  transitions: { time: number; state: ProcessState }[];
};

export function scheduleRoundRobin(specs: ProcessSpec[], quantum: number): Schedule {

  const runners = specs.map<Runner>((spec) => ({
    spec,

    burst: 0,

    remaining: spec.cpuBursts[0] ?? 0,

    // Everything is admitted to ready at time 0.
    transitions: [{ time: 0, state: 'ready' }],
  }));

  const ready: Runner[] = [...runners];

  // Blocked processes, each with the instant its I/O completes.
  let blocked: { runner: Runner; until: number }[] = [];

  const slices: CpuSlice[] = [];

  let now = 0;

  // Admit every I/O completion that has happened by `upTo`, earliest first. Each one
  // re-enters READY at the instant it completed, not at the instant we noticed — which
  // is what puts a process woken mid-slice ahead of the process preempted at the end
  // of that slice.
  function wake(upTo: number) {

    const done = blocked

      .filter((entry) => entry.until <= upTo)

      .sort((a, b) => a.until - b.until);

    blocked = blocked.filter((entry) => entry.until > upTo);

    for (const entry of done) {

      entry.runner.transitions.push({ time: entry.until, state: 'ready' });

      ready.push(entry.runner);
    }
  }

  while (ready.length > 0 || blocked.length > 0) {

    if (ready.length === 0) {

      // Everything is blocked, so the CPU genuinely idles until the next completion.
      now = Math.min(...blocked.map((entry) => entry.until));

      wake(now);

      continue;
    }

    const runner = ready.shift() as Runner;

    // The quantum caps the turn; the burst may end sooner.
    const run = Math.min(quantum, runner.remaining);

    runner.transitions.push({ time: now, state: 'running' });

    slices.push({ pid: runner.spec.id, from: now, to: now + run });

    now += run;

    runner.remaining -= run;

    // Completions during the slice enter the queue ahead of the process leaving the CPU.
    wake(now);

    if (runner.remaining > 0) {

      runner.transitions.push({ time: now, state: 'ready' });

      ready.push(runner);

      continue;
    }

    const io = runner.spec.ioBursts[runner.burst];

    if (io === undefined) {

      runner.transitions.push({ time: now, state: 'terminated' });

      continue;
    }

    runner.transitions.push({ time: now, state: 'waiting' });

    runner.burst += 1;

    runner.remaining = runner.spec.cpuBursts[runner.burst];

    blocked.push({ runner, until: now + io });
  }

  const endTime = now;

  const spans: StateSpan[] = [];

  for (const runner of runners) {

    for (let i = 0; i < runner.transitions.length; i += 1) {

      const { time, state } = runner.transitions[i];

      spans.push({
        pid: runner.spec.id,

        state,

        from: time,

        to: runner.transitions[i + 1]?.time ?? endTime,
      });
    }
  }

  return { quantum, endTime, slices, spans };
}

export function stateAt(schedule: Schedule, pid: string, time: number): ProcessState {

  // Past the end of the run every process has finished, and the terminal span is
  // zero-length for whoever finished last — so answer this before searching.
  if (time >= schedule.endTime) {

    return 'terminated';
  }

  const span = schedule.spans.find(
    (candidate) => candidate.pid === pid && time >= candidate.from && time < candidate.to,
  );

  return span?.state ?? 'terminated';
}
