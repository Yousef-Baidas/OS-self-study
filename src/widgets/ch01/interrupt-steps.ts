// Pure, framework-free data module for the Interrupt-Driven I/O Cycle sim
// (SIM-02, supporting). Encodes the exact 6-step slides-29-32 sequence --
// order, caption wording, and active-actor per step -- with the ISR/
// interrupt-vector steps (4-5) text-driven from slide 31, not invented
// (02-RESEARCH.md "SIM-02 -- exact source data"; D-02/D-03 strict
// slides-only). Step 6's wording is the standard corollary of step 3
// (RESEARCH notes it is not verbatim on a slide). Locked by
// tests/widgets/ch01/interrupt-steps.test.ts.
export type StepDescriptor = {
  caption: string;

  activeActor: 'cpu' | 'device' | 'handler';
};

// CPU executing normally -> Device raises an interrupt -> CPU saves state ->
// CPU jumps to the ISR via the interrupt vector -> ISR executes -> CPU
// restores state and resumes, exactly as slides 29-32 order the cycle.
export const interruptSteps: StepDescriptor[] = [

  { caption: 'CPU executing normally', activeActor: 'cpu' },

  { caption: 'Device completes I/O and raises an interrupt', activeActor: 'device' },

  { caption: 'CPU finishes its current instruction and saves state', activeActor: 'cpu' },

  { caption: 'CPU consults the interrupt vector and jumps to the ISR', activeActor: 'handler' },

  { caption: 'ISR executes', activeActor: 'handler' },

  { caption: 'CPU restores its saved state and resumes', activeActor: 'cpu' },
];
