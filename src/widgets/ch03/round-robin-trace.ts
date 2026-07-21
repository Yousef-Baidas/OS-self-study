// Slide 13's worked example, as an input to the scheduler rather than as an answer.
//
// Only the burst specification is written down here; the eleven-row solution the
// chapter prints is derived by src/lib/round-robin and checked against the published
// table in tests/widgets/ch03/round-robin-trace.test.ts.

import { scheduleRoundRobin, type ProcessSpec } from '../../lib/round-robin';

export const ROUND_ROBIN_QUANTUM = 4;

// Slide 13: three processes, all arriving at time 0. P2 never blocks.
export const ROUND_ROBIN_PROCESSES: ProcessSpec[] = [

  { id: 'P1', cpuBursts: [6, 5], ioBursts: [4] },

  { id: 'P2', cpuBursts: [8], ioBursts: [] },

  { id: 'P3', cpuBursts: [5, 3], ioBursts: [3] },
];

// Computed once at module load: the specification never changes, and the sim scrubs
// through the result rather than re-running it.
export const roundRobinSchedule = scheduleRoundRobin(ROUND_ROBIN_PROCESSES, ROUND_ROBIN_QUANTUM);

export type TraceNote = {

  // Millisecond the note becomes relevant; it stays on screen until the next one.
  at: number;

  text: string;
};

// The moments in the run that are worth stopping on — the chapter's "What happens"
// column, reduced to the transitions that actually teach something.
export const traceNotes: TraceNote[] = [

  {
    at: 0,
    text: 'All three processes are ready at time 0. P1 is dispatched first and uses its full 4 ms quantum, leaving 2 ms of its burst.',
  },

  {
    at: 4,
    text: 'P1 is preempted — an interrupt, not a request — and goes to the back of the ready queue. P2 takes the CPU.',
  },

  {
    at: 8,
    text: 'P3 gets its first turn. Every process has now had exactly one quantum: that is the whole idea of round-robin.',
  },

  {
    at: 12,
    text: 'P1 has only 2 ms of burst left, so it hands the CPU back at 14 rather than using the full quantum. A quantum is an upper bound on a turn, not a fixed length.',
  },

  {
    at: 14,
    text: 'P1 is now waiting on I/O until 18 — blocked, so it could not run even if the CPU were free. P2 runs out its last 4 ms.',
  },

  {
    at: 18,
    text: 'P2 finishes its only burst and terminates. P1’s I/O completes, so P1 re-enters ready — it does not go straight back to running.',
  },

  {
    at: 19,
    text: 'P3 finished its burst after 1 ms and blocked on I/O until 22. P1 starts its second CPU burst.',
  },

  {
    at: 22,
    text: 'P3’s I/O completes and it joins the ready queue behind P1, which is still inside its quantum.',
  },

  {
    at: 23,
    text: 'P1 is preempted at the end of its quantum with 1 ms left. P3 runs its 3 ms second burst and terminates at 26.',
  },

  {
    at: 26,
    text: 'P1 runs its final 1 ms and terminates at 27. Every process is done.',
  },
];
