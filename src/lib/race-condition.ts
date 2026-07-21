// The producer/consumer race on a shared counter (Chapter 3, slide 42).
//
// `counter++` and `counter--` are each three machine instructions, so the two can
// interleave — and the chapter's point is that the outcome depends on which
// interleaving the scheduler happens to produce. This module executes an interleaving
// rather than encoding slide 42's answer, so the sim's Explore mode can run any of the
// twenty orderings and the test can assert what the chapter claims about all of them:
// the result is always 4, 5, or 6, and only an uninterrupted run gives the correct 5.

export type Actor = 'producer' | 'consumer';

export type Effect = 'load' | 'modify' | 'store';

export type Instruction = {

  actor: Actor;

  // The statement exactly as the chapter prints it.
  text: string;

  // load and store touch the shared counter; modify is private to the register, which
  // is why an interleaving can only do damage around the first two.
  effect: Effect;
};

export type Machine = {

  counter: number;

  // null until the owning process has executed its load.
  register1: number | null;

  register2: number | null;
};

export type Trace = {

  // states[i] is the machine AFTER i instructions have run, so states[0] is the state
  // before anything did and the sim can index it directly by step.
  states: Machine[];

  // instructions[i] took states[i] to states[i + 1].
  instructions: Instruction[];
};

export const INITIAL_COUNTER = 5;

export const PRODUCER: Instruction[] = [

  { actor: 'producer', text: 'register1 = counter;', effect: 'load' },

  { actor: 'producer', text: 'register1 = register1 + 1;', effect: 'modify' },

  { actor: 'producer', text: 'counter = register1;', effect: 'store' },
];

export const CONSUMER: Instruction[] = [

  { actor: 'consumer', text: 'register2 = counter;', effect: 'load' },

  { actor: 'consumer', text: 'register2 = register2 - 1;', effect: 'modify' },

  { actor: 'consumer', text: 'counter = register2;', effect: 'store' },
];

// The interleaving slide 42 walks through: both processes read before either writes,
// and the consumer's store lands last.
export const SLIDE_42_ORDER: Actor[] = [
  'producer',
  'producer',
  'consumer',
  'consumer',
  'producer',
  'consumer',
];

function apply(machine: Machine, instruction: Instruction): Machine {

  if (instruction.actor === 'producer') {

    if (instruction.effect === 'load') {

      return { ...machine, register1: machine.counter };
    }

    if (instruction.effect === 'modify') {

      return { ...machine, register1: (machine.register1 as number) + 1 };
    }

    return { ...machine, counter: machine.register1 as number };
  }

  if (instruction.effect === 'load') {

    return { ...machine, register2: machine.counter };
  }

  if (instruction.effect === 'modify') {

    return { ...machine, register2: (machine.register2 as number) - 1 };
  }

  return { ...machine, counter: machine.register2 as number };
}

// `order` is the scheduler's choices: which process runs its next instruction. A
// partial order is valid — the sim builds one a step at a time in Explore mode.
export function runInterleaving(order: Actor[], initialCounter = INITIAL_COUNTER): Trace {

  const programs: Record<Actor, Instruction[]> = { producer: PRODUCER, consumer: CONSUMER };

  const counters: Record<Actor, number> = { producer: 0, consumer: 0 };

  const states: Machine[] = [{ counter: initialCounter, register1: null, register2: null }];

  const instructions: Instruction[] = [];

  for (const actor of order) {

    const instruction = programs[actor][counters[actor]];

    if (!instruction) {

      throw new Error(`the ${actor} has no instructions left to run`);
    }

    counters[actor] += 1;

    instructions.push(instruction);

    states.push(apply(states[states.length - 1], instruction));
  }

  return { states, instructions };
}

// How many instructions `actor` has left after `order` — the sim disables a process's
// button once this reaches zero.
export function remainingFor(order: Actor[], actor: Actor): number {

  const program = actor === 'producer' ? PRODUCER : CONSUMER;

  return program.length - order.filter((choice) => choice === actor).length;
}
