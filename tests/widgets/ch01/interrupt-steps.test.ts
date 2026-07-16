import { describe, expect, it } from 'vitest';

import { interruptSteps, type StepDescriptor } from '../../../src/widgets/ch01/interrupt-steps';

// Locks the exact slide-29-32 6-step interrupt-driven I/O cycle (SIM-02
// fidelity anchor, 02-RESEARCH.md "SIM-02 -- exact source data"). This test
// is the single source of truth that the widget's data can never drift
// from the deck.
describe('interruptSteps', () => {

  it('has length exactly 6', () => {

    expect(interruptSteps).toHaveLength(6);
  });

  it('encodes the exact slide-29-32 step captions in order', () => {

    const captions = interruptSteps.map((step) => step.caption);

    expect(captions).toEqual([
      'CPU executing normally',
      'Device completes I/O and raises an interrupt',
      'CPU finishes its current instruction and saves state',
      'CPU consults the interrupt vector and jumps to the ISR',
      'ISR executes',
      'CPU restores its saved state and resumes',
    ]);
  });

  it('assigns the active actor sequence cpu, device, cpu, handler, handler, cpu', () => {

    const actors = interruptSteps.map((step) => step.activeActor);

    expect(actors).toEqual(['cpu', 'device', 'cpu', 'handler', 'handler', 'cpu']);
  });
});

// Type-only usage keeps `StepDescriptor` exercised by the compiler without a
// redundant runtime assertion.
const _typeCheck: StepDescriptor = interruptSteps[0];

void _typeCheck;
