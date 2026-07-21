// Pure, framework-free content for the ForkTree sim (Ch3, slides 33-34).
//
// The program is slide 34's, shown in full at every step: three unconditional fork()
// calls with the third's return value captured into `x`, followed by
// `if (x == 0) fork();`. Guided mode hides the conditional and walks the slide-33
// answer (1 -> 2 -> 4 -> 8); Explore reveals it and the count goes to 12.
//
// Populations here are claims the drawing has to honour, so the test checks them
// against forkStages() in src/lib/fork-tree rather than against a second list.

// Call index of the conditional fork(), one past the three unconditional calls.
// The widget highlights the processes that take the branch by comparing this to
// each node's `bornAt`.
export const CONDITIONAL_CALL = 3;

export type ForkStep = {

  caption: string;

  // Processes alive once this step's call has returned — the number the reader is
  // being asked to predict.
  population: number;
};

export type ProgramLine = {

  text: string;

  // Index of the fork() call this line issues, or null for scaffolding. Drives the
  // "this is the line that just ran" highlight.
  call: number | null;

  // Part of the trailing `if (x == 0) fork();`, which Guided mode hides.
  conditional: boolean;
};

export const forkSteps: ForkStep[] = [

  {
    caption:
      'Before any fork() runs there is one process. Every count below is just this one, doubling.',
    population: 1,
  },

  {
    caption:
      'The first fork() returns twice — once in the parent, once in the brand-new child. Both carry on to the next line.',
    population: 2,
  },

  {
    caption:
      'Both processes execute the second fork(), so both gain a child. The child created a moment ago forks too — that is the step most answers miss.',
    population: 4,
  },

  {
    caption:
      'All four run the third fork() and the population doubles again: 2³ = 8 processes, all running the same program.',
    population: 8,
  },
];

export const conditionalStep: ForkStep = {

  caption:
    'x holds what the third fork() returned: 0 in the four processes it created, a PID in the four that created them. So exactly four take the branch — 8 + 4 = 12.',

  population: 12,
};

// Character-for-character the chapter's own `conditional-fork.c`, so the reader is
// playing with the listing they just read rather than a paraphrase of it. Hiding the
// two conditional lines in Guided mode leaves the slide-33 program, still valid C.
export const forkProgramLines: ProgramLine[] = [

  { text: 'int main(void) {', call: null, conditional: false },

  { text: '  int x;', call: null, conditional: false },

  { text: '  x = fork();', call: 0, conditional: false },

  { text: '  x = fork();', call: 1, conditional: false },

  { text: '  x = fork();', call: 2, conditional: false },

  { text: '  if (x == 0)', call: null, conditional: true },

  { text: '    fork();', call: CONDITIONAL_CALL, conditional: true },

  { text: '  return 0;', call: null, conditional: false },

  { text: '}', call: null, conditional: false },
];
