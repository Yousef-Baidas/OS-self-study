import { describe, expect, it } from 'vitest';

import { countProcesses, forkStages } from '../../../src/lib/fork-tree';

import {
  CONDITIONAL_CALL,
  conditionalStep,
  forkProgramLines,
  forkSteps,
  type ForkStep,
} from '../../../src/widgets/ch03/fork-program';

// The sim's captions claim a population at every step, and the drawing gets its
// population from src/lib/fork-tree. If the two ever disagree the sim contradicts
// itself on screen, so these tests check the prose against the engine rather than
// against a second hardcoded list.
describe('forkSteps', () => {

  it('covers the starting state plus one step per unconditional call', () => {

    expect(forkSteps).toHaveLength(4);
  });

  it('claims the populations the fork engine actually produces', () => {

    const stages = forkStages({ calls: 3, conditional: false });

    expect(forkSteps.map((step) => step.population)).toEqual(stages.map(countProcesses));
  });

  it('doubles the population at every call, reaching slide 33’s eight processes', () => {

    expect(forkSteps.map((step) => step.population)).toEqual([1, 2, 4, 8]);
  });

  it('gives every step a caption', () => {

    for (const step of forkSteps) {

      expect(step.caption.length).toBeGreaterThan(0);
    }
  });
});

describe('conditionalStep', () => {

  it('claims the twelve processes slide 34 reaches', () => {

    const stages = forkStages({ calls: 3, conditional: true });

    expect(conditionalStep.population).toBe(countProcesses(stages[4]));

    expect(conditionalStep.population).toBe(12);
  });

  // Only the processes born at the last unconditional call see x == 0, and the
  // widget highlights them by comparing `bornAt` against this constant.
  it('runs at the call index after the three unconditional ones', () => {

    expect(CONDITIONAL_CALL).toBe(3);
  });
});

describe('forkProgramLines', () => {

  it('issues exactly three unconditional fork() calls, in order', () => {

    const unconditional = forkProgramLines

      .filter((line) => line.call !== null && !line.conditional)

      .map((line) => line.call);

    expect(unconditional).toEqual([0, 1, 2]);
  });

  it('captures the last unconditional call’s return value into x', () => {

    const lastCall = forkProgramLines.find((line) => line.call === 2);

    // `if (x == 0)` can only select the processes born at the final call if x is
    // what that call returned — this is the whole mechanism of slide 34.
    expect(lastCall?.text).toContain('x = fork()');
  });

  it('puts the conditional fork last and marks it as the conditional call', () => {

    const conditional = forkProgramLines.filter((line) => line.conditional);

    expect(conditional.length).toBeGreaterThan(0);

    expect(conditional.some((line) => line.call === CONDITIONAL_CALL)).toBe(true);

    const firstConditional = forkProgramLines.findIndex((line) => line.conditional);

    const lastConditional = forkProgramLines.findLastIndex((line) => line.conditional);

    // Contiguous and at the end of the body, so hiding them in Guided mode leaves a
    // program that still reads as valid C.
    expect(lastConditional - firstConditional).toBe(conditional.length - 1);
  });

  it('marks every fork() line and nothing else', () => {

    for (const line of forkProgramLines) {

      expect(line.text.includes('fork()')).toBe(line.call !== null);
    }
  });
});

// Type-only usage keeps `ForkStep` exercised by the compiler.
const _typeCheck: ForkStep = forkSteps[0];

void _typeCheck;
