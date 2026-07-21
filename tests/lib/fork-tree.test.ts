import { describe, expect, it } from 'vitest';

import {
  cloneTree,
  countProcesses,
  forkStages,
  growGeneration,
  levelOrder,
  type ForkNode,
} from '../../src/lib/fork-tree';

function leaf(id: string, bornAt: number): ForkNode {

  return { id, bornAt, children: [] };
}

describe('countProcesses', () => {

  it('counts the lone initial process', () => {

    expect(countProcesses(leaf('P0', -1))).toBe(1);
  });

  it('counts a nested tree including the root', () => {

    const root: ForkNode = {
      id: 'P0',

      bornAt: -1,

      children: [{ id: 'P1', bornAt: 0, children: [leaf('P2', 1)] }, leaf('P3', 1)],
    };

    expect(countProcesses(root)).toBe(4);
  });
});

describe('levelOrder', () => {

  it('visits shallower processes before deeper ones', () => {

    const root: ForkNode = {
      id: 'P0',

      bornAt: -1,

      children: [{ id: 'P1', bornAt: 0, children: [leaf('P3', 1)] }, leaf('P2', 1)],
    };

    expect(levelOrder(root).map((node) => node.id)).toEqual(['P0', 'P1', 'P2', 'P3']);
  });
});

describe('cloneTree', () => {

  it('copies every node rather than sharing them', () => {

    const root: ForkNode = { id: 'P0', bornAt: -1, children: [leaf('P1', 0)] };

    const copy = cloneTree(root);

    copy.children[0].id = 'mutated';

    expect(root.children[0].id).toBe('P1');
  });
});

describe('growGeneration', () => {

  it('doubles the population when every process forks', () => {

    let pid = 1;

    const grown = growGeneration(leaf('P0', -1), 0, () => true, () => `P${pid++}`);

    expect(countProcesses(grown)).toBe(2);
  });

  // The mistake the chapter warns about: a newborn must not fork again within the
  // same call. If the implementation appends while it walks, this reaches 8 rather
  // than 4 and the whole sim silently teaches the wrong thing.
  it('does not let a process created by this call fork again in the same call', () => {

    let pid = 1;

    const mint = () => `P${pid++}`;

    const afterFirst = growGeneration(leaf('P0', -1), 0, () => true, mint);

    const afterSecond = growGeneration(afterFirst, 1, () => true, mint);

    expect(countProcesses(afterSecond)).toBe(4);
  });

  it('stamps each new process with the call that created it', () => {

    let pid = 1;

    const grown = growGeneration(leaf('P0', -1), 2, () => true, () => `P${pid++}`);

    expect(grown.children[0].bornAt).toBe(2);
  });

  it('only forks the processes the predicate accepts', () => {

    let pid = 1;

    const mint = () => `P${pid++}`;

    const afterFirst = growGeneration(leaf('P0', -1), 0, () => true, mint);

    // Only the child born at call 0 forks — the original process sits this one out.
    const selective = growGeneration(afterFirst, 1, (node) => node.bornAt === 0, mint);

    expect(countProcesses(selective)).toBe(3);
  });

  it('leaves the tree it was given untouched', () => {

    const root = leaf('P0', -1);

    growGeneration(root, 0, () => true, () => 'P1');

    expect(root.children).toHaveLength(0);
  });

  it('mints labels in level order', () => {

    let pid = 1;

    const mint = () => `P${pid++}`;

    const afterFirst = growGeneration(leaf('P0', -1), 0, () => true, mint);

    const afterSecond = growGeneration(afterFirst, 1, () => true, mint);

    // P0 and P1 are the population entering call 1, so their new children are P2 and P3
    // in that order — the numbering a reader scanning the drawn tree would expect.
    expect(levelOrder(afterSecond).map((node) => node.id)).toEqual(['P0', 'P1', 'P2', 'P3']);
  });
});

describe('forkStages', () => {

  it('starts from a single process before any call runs', () => {

    const stages = forkStages({ calls: 3, conditional: false });

    expect(countProcesses(stages[0])).toBe(1);
  });

  it('produces one stage per call plus the starting state', () => {

    expect(forkStages({ calls: 3, conditional: false })).toHaveLength(4);
  });

  // Slide 33: three unconditional forks.
  it('reaches 8 processes after three unconditional forks', () => {

    const stages = forkStages({ calls: 3, conditional: false });

    expect(stages.map(countProcesses)).toEqual([1, 2, 4, 8]);
  });

  // Slide 34: the same three forks followed by `if (x == 0) fork();`.
  it('reaches 12 processes when the conditional fork follows', () => {

    const stages = forkStages({ calls: 3, conditional: true });

    expect(stages).toHaveLength(5);

    expect(countProcesses(stages[4])).toBe(12);
  });

  it('runs the conditional only in processes born at the last call', () => {

    const stages = forkStages({ calls: 3, conditional: true });

    const beforeConditional = stages[3];

    // Half of the eight processes were created by the third call, so exactly four
    // take the `x == 0` branch: 8 + 4 = 12.
    const eligible = levelOrder(beforeConditional).filter((node) => node.bornAt === 2);

    expect(eligible).toHaveLength(4);
  });

  it('handles a program with no forks at all', () => {

    const stages = forkStages({ calls: 0, conditional: false });

    expect(stages).toHaveLength(1);

    expect(countProcesses(stages[0])).toBe(1);
  });
});
