// Process-tree expansion for a program made of fork() calls (Chapter 3, slides 33-34).
//
// The chapter's recurring exam question is "how many processes does this program
// create?", and the answer is never arithmetic the reader can trust from memory —
// it depends on the fact that a child created by the first fork() goes on to run
// the second and third calls too. So the sim builds the tree rather than printing
// a formula, and this module is that construction: framework-free and unit-tested,
// with ForkTree.svelte left holding only the rendering.
//
// Ordering matters for the labels. Each stage collects the whole living population
// in level order FIRST, then gives every member a child, so PIDs come out in the
// order a reader scanning the tree left-to-right, top-to-bottom would number them —
// and the population visibly doubles rather than growing in a lopsided cascade.

export type ForkNode = {

  // Display label. "P0" is the initial process; children are numbered in creation order.
  id: string;

  // Index of the fork() call that created this process, or -1 for the initial process.
  // This is what the conditional branch in slide 34 has to discriminate on: `x` holds
  // the return value of the LAST unconditional fork(), so `x == 0` is true in exactly
  // the processes born at that call.
  bornAt: number;

  children: ForkNode[];
};

// A program of the shape slides 33-34 use: some unconditional fork() calls, optionally
// followed by `if (x == 0) fork();`.
export type ForkProgram = {

  // How many unconditional fork() calls run before the conditional.
  calls: number;

  // Whether the trailing `if (x == 0) fork();` is present.
  conditional: boolean;
};

// Total processes in the tree, the initial process included.
export function countProcesses(root: ForkNode): number {

  return 1 + root.children.reduce((total, child) => total + countProcesses(child), 0);
}

// Every node, breadth-first. Level order (rather than depth-first) is what makes the
// generated PIDs read in scan order, and it is the traversal growGeneration uses to
// snapshot the population before any of it forks.
export function levelOrder(root: ForkNode): ForkNode[] {

  const seen: ForkNode[] = [];

  const queue: ForkNode[] = [root];

  while (queue.length > 0) {

    const node = queue.shift() as ForkNode;

    seen.push(node);

    queue.push(...node.children);
  }

  return seen;
}

// Structural copy. Each stage returns a fresh tree so the sim can hold every snapshot
// at once and step backwards without the earlier stages having been mutated underneath it.
export function cloneTree(root: ForkNode): ForkNode {

  return {
    id: root.id,

    bornAt: root.bornAt,

    children: root.children.map(cloneTree),
  };
}

// Grow the tree by one fork() call: a NEW tree in which every process `shouldFork`
// accepts has gained exactly one child.
//
// The population is snapshotted before any of it forks, which is the whole point.
// fork() returns into two processes that both resume AFTER the call, so a process
// born at call n does not re-execute call n. Appending children while walking would
// sweep the newborns into the same generation and reach 8 after two calls instead of
// 4 — the code-level form of the mistake the chapter's exam question punishes.
export function growGeneration(
  root: ForkNode,
  callIndex: number,
  shouldFork: (node: ForkNode) => boolean,
  mintId: () => string,
): ForkNode {

  const next = cloneTree(root);

  // Level order, and materialised in full before the loop below touches anything:
  // this array IS the population entering the call, and it cannot grow underneath us.
  const population = levelOrder(next).filter(shouldFork);

  for (const parent of population) {

    parent.children.push({ id: mintId(), bornAt: callIndex, children: [] });
  }

  return next;
}

// Every stage of the program, starting from the lone initial process. Index 0 is the
// program before any fork() runs, so `stages.length` is calls + 1, plus one more when a
// conditional fork follows — which is exactly the step count SimFrame needs.
export function forkStages(program: ForkProgram): ForkNode[] {

  let nextPid = 1;

  const mintId = () => `P${nextPid++}`;

  const initial: ForkNode = { id: 'P0', bornAt: -1, children: [] };

  const stages: ForkNode[] = [initial];

  // Unconditional calls: every living process forks, so the population doubles each time.
  for (let call = 0; call < program.calls; call += 1) {

    stages.push(growGeneration(stages[stages.length - 1], call, () => true, mintId));
  }

  if (!program.conditional) {

    return stages;
  }

  // `if (x == 0) fork();` — `x` holds the return value of the last unconditional call,
  // and fork() returns 0 in the child. So the processes that take this branch are exactly
  // those born at the final call: half the population, hence 8 -> 12 for slide 34.
  const lastCall = program.calls - 1;

  stages.push(
    growGeneration(
      stages[stages.length - 1],
      program.calls,
      (node) => node.bornAt === lastCall,
      mintId,
    ),
  );

  return stages;
}
