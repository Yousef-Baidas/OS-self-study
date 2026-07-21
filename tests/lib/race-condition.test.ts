import { describe, expect, it } from 'vitest';

import {
  CONSUMER,
  INITIAL_COUNTER,
  PRODUCER,
  SLIDE_42_ORDER,
  runInterleaving,
  type Actor,
} from '../../src/lib/race-condition';

// Every way the two three-instruction sequences can interleave while each keeps its
// own internal order: 6 choose 3 = 20 of them.
function everyInterleaving(): Actor[][] {

  const found: Actor[][] = [];

  function walk(order: Actor[], producersLeft: number, consumersLeft: number) {

    if (producersLeft === 0 && consumersLeft === 0) {

      found.push(order);

      return;
    }

    if (producersLeft > 0) {

      walk([...order, 'producer'], producersLeft - 1, consumersLeft);
    }

    if (consumersLeft > 0) {

      walk([...order, 'consumer'], producersLeft, consumersLeft - 1);
    }
  }

  walk([], PRODUCER.length, CONSUMER.length);

  return found;
}

function finalCounter(order: Actor[]): number {

  const { states } = runInterleaving(order);

  return states[states.length - 1].counter;
}

describe('runInterleaving', () => {

  it('starts from the chapter’s counter of 5 with both registers unread', () => {

    const { states } = runInterleaving(SLIDE_42_ORDER);

    expect(states[0]).toEqual({ counter: INITIAL_COUNTER, register1: null, register2: null });

    expect(INITIAL_COUNTER).toBe(5);
  });

  it('records one state per instruction, plus the state before any ran', () => {

    const { states, instructions } = runInterleaving(SLIDE_42_ORDER);

    expect(instructions).toHaveLength(6);

    expect(states).toHaveLength(7);
  });

  // Slide 42's table, row for row.
  it('reproduces slide 42 exactly', () => {

    const { states } = runInterleaving(SLIDE_42_ORDER);

    expect(states[1].register1).toBe(5);

    expect(states[2].register1).toBe(6);

    // S2 is where the damage is done: the consumer loads the counter the producer has
    // already decided to overwrite, so its 5 is stale before it is even stored.
    expect(states[3].register2).toBe(5);

    expect(states[3].counter).toBe(5);

    expect(states[4].register2).toBe(4);

    expect(states[5].counter).toBe(6);

    expect(states[6].counter).toBe(4);
  });

  it('produces 6 instead of 4 when the last two stores swap', () => {

    const swapped: Actor[] = ['producer', 'producer', 'consumer', 'consumer', 'consumer', 'producer'];

    expect(finalCounter(swapped)).toBe(6);
  });

  it('gets the right answer when neither process is interrupted', () => {

    const producerFirst: Actor[] = ['producer', 'producer', 'producer', 'consumer', 'consumer', 'consumer'];

    const consumerFirst: Actor[] = ['consumer', 'consumer', 'consumer', 'producer', 'producer', 'producer'];

    expect(finalCounter(producerFirst)).toBe(5);

    expect(finalCounter(consumerFirst)).toBe(5);
  });

  // The chapter's claim in full: the value depends on the order, and it is one of
  // exactly three possibilities — all of which the reader can reach in Explore.
  it('lands on 4, 5, or 6 for every possible interleaving, and reaches all three', () => {

    const results = everyInterleaving().map(finalCounter);

    expect(results).toHaveLength(20);

    expect(new Set(results)).toEqual(new Set([4, 5, 6]));
  });

  it('refuses to step a process that has already finished', () => {

    expect(() => runInterleaving(['producer', 'producer', 'producer', 'producer'])).toThrow();
  });

  it('accepts a partial interleaving, so the sim can be mid-run', () => {

    const { states, instructions } = runInterleaving(['producer', 'consumer']);

    expect(instructions).toHaveLength(2);

    expect(states[2].register1).toBe(5);

    expect(states[2].register2).toBe(5);

    // Neither has stored yet, so the shared counter is untouched.
    expect(states[2].counter).toBe(5);
  });
});

describe('the two instruction sequences', () => {

  it('are three instructions each — which is why they can interleave at all', () => {

    expect(PRODUCER).toHaveLength(3);

    expect(CONSUMER).toHaveLength(3);
  });

  it('each load, then modify, then store', () => {

    expect(PRODUCER.map((op) => op.effect)).toEqual(['load', 'modify', 'store']);

    expect(CONSUMER.map((op) => op.effect)).toEqual(['load', 'modify', 'store']);
  });

  it('touches the shared counter only on the load and the store', () => {

    for (const op of [...PRODUCER, ...CONSUMER]) {

      expect(op.text.includes('counter')).toBe(op.effect !== 'modify');
    }
  });
});
