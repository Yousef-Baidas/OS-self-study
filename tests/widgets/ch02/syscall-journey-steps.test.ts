import { describe, expect, it } from 'vitest';

import { syscallJourneySteps, type JourneyStep } from '../../../src/widgets/ch02/syscall-journey-steps';

// Locks the fork() -> exec() -> wait() -> exit() sequence (slides 22-36). The
// two invariants that make the sim correct: the CPU mode flips into the kernel
// exactly on the trap steps, and the child process appears at fork() and never
// disappears afterward.
describe('syscallJourneySteps', () => {

  it('has length exactly 7', () => {

    expect(syscallJourneySteps).toHaveLength(7);
  });

  it('issues fork(), exec(), and exit(0) on the trap steps in order', () => {

    const calls = syscallJourneySteps.map((step) => step.syscall);

    expect(calls).toEqual([null, 'fork()', null, 'exec()', null, 'exit(0)', null]);
  });

  it('is in kernel mode exactly on the trap steps and user mode otherwise', () => {

    const modes = syscallJourneySteps.map((step) => step.mode);

    expect(modes).toEqual(['user', 'kernel', 'user', 'kernel', 'user', 'kernel', 'user']);

    // A trap step (has a syscall) must be kernel mode; a non-trap step must not.
    for (const step of syscallJourneySteps) {

      expect(step.mode === 'kernel').toBe(step.syscall !== null);
    }
  });

  it('creates the child at fork() and keeps it present thereafter', () => {

    // The shell runs alone before fork() ...
    expect(syscallJourneySteps[0].childPresent).toBe(false);

    // ... and once forked (step index 1), the child is present for the rest.
    for (const step of syscallJourneySteps.slice(1)) {

      expect(step.childPresent).toBe(true);
    }
  });

  it('only focuses the child once it exists', () => {

    for (const step of syscallJourneySteps) {

      const focusesChild = step.active === 'child' || step.active === 'both';

      if (focusesChild) {

        expect(step.childPresent).toBe(true);
      }
    }
  });
});

// Type-only usage keeps `JourneyStep` exercised by the compiler.
const _typeCheck: JourneyStep = syscallJourneySteps[0];

void _typeCheck;
