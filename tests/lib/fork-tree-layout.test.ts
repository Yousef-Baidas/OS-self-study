import { describe, expect, it } from 'vitest';

import { forkStages, type ForkNode } from '../../src/lib/fork-tree';

import {
  LAYOUT,
  layoutForkTree,
  type PlacedNode,
} from '../../src/lib/fork-tree-layout';

function leaf(id: string, bornAt: number): ForkNode {

  return { id, bornAt, children: [] };
}

function byId(nodes: PlacedNode[], id: string): PlacedNode {

  const found = nodes.find((node) => node.id === id);

  if (!found) {

    throw new Error(`no placed node ${id}`);
  }

  return found;
}

// The widest tree the sim ever draws: slide 34's twelve processes.
const TWELVE = forkStages({ calls: 3, conditional: true })[4];

describe('layoutForkTree — placement', () => {

  it('places the lone initial process', () => {

    const { nodes } = layoutForkTree(leaf('P0', -1));

    expect(nodes).toHaveLength(1);

    expect(nodes[0].id).toBe('P0');
  });

  it('places every process in the tree exactly once', () => {

    const { nodes } = layoutForkTree(TWELVE);

    expect(nodes).toHaveLength(12);

    expect(new Set(nodes.map((node) => node.id)).size).toBe(12);
  });

  it('puts each generation on its own row, one row pitch apart', () => {

    const { nodes } = layoutForkTree(TWELVE);

    for (const node of nodes) {

      expect(node.y).toBe(byId(nodes, 'P0').y + node.depth * LAYOUT.rowPitch);
    }
  });

  it('gives every process the same box size', () => {

    const { nodes } = layoutForkTree(TWELVE);

    for (const node of nodes) {

      expect(node.width).toBe(LAYOUT.nodeWidth);

      expect(node.height).toBe(LAYOUT.nodeHeight);
    }
  });

  // Rule 4 in docs/FIGURES.md is about tiling; the inverse matters just as much for
  // discrete nodes — two boxes on the same row must never touch, let alone overlap.
  it('leaves a gap between neighbours on the same row', () => {

    const { nodes } = layoutForkTree(TWELVE);

    for (let depth = 0; depth <= 4; depth += 1) {

      const row = nodes

        .filter((node) => node.depth === depth)

        .sort((a, b) => a.x - b.x);

      for (let i = 1; i < row.length; i += 1) {

        expect(row[i].x - (row[i - 1].x + row[i - 1].width)).toBeGreaterThanOrEqual(
          LAYOUT.columnGap,
        );
      }
    }
  });

  it('centres a parent over the span of its children', () => {

    // P0 -> P1, P2 (two children, so the parent sits midway between their centres).
    const root: ForkNode = {
      id: 'P0',

      bornAt: -1,

      children: [leaf('P1', 0), leaf('P2', 1)],
    };

    const { nodes } = layoutForkTree(root);

    const parent = byId(nodes, 'P0');

    const left = byId(nodes, 'P1');

    const right = byId(nodes, 'P2');

    expect(parent.centreX).toBe((left.centreX + right.centreX) / 2);
  });
});

describe('layoutForkTree — connectors', () => {

  it('draws one connector per parent/child edge', () => {

    const { connectors } = layoutForkTree(TWELVE);

    // Twelve processes, eleven of them created by a fork(): eleven edges.
    expect(connectors).toHaveLength(11);
  });

  // docs/FIGURES.md rules 2 and 3: leave an edge MIDPOINT, and let the endpoint BE
  // the edge coordinate. In a sim these hold by construction — this is the test that
  // says so, and it is the check `astro build` structurally cannot perform.
  it('starts every connector at its parent bottom edge midpoint', () => {

    const { nodes, connectors } = layoutForkTree(TWELVE);

    for (const connector of connectors) {

      const parent = byId(nodes, connector.from);

      expect(connector.start).toEqual({ x: parent.centreX, y: parent.y + parent.height });
    }
  });

  it('ends every connector at its child top edge midpoint', () => {

    const { nodes, connectors } = layoutForkTree(TWELVE);

    for (const connector of connectors) {

      const child = byId(nodes, connector.to);

      expect(connector.end).toEqual({ x: child.centreX, y: child.y });
    }
  });

  it('emits a path whose final coordinate is the child edge', () => {

    const { nodes, connectors } = layoutForkTree(TWELVE);

    for (const connector of connectors) {

      const child = byId(nodes, connector.to);

      // The arrow marker uses refX = the tip's own x, so the drawn tip lands on
      // whatever the path ends at. That last coordinate must be the box edge.
      expect(connector.d.endsWith(`V${child.y}`)).toBe(true);
    }
  });

  it('runs straight down when parent and child share a centre line', () => {

    const root: ForkNode = { id: 'P0', bornAt: -1, children: [leaf('P1', 0)] };

    const { nodes, connectors } = layoutForkTree(root);

    const parent = byId(nodes, 'P0');

    const child = byId(nodes, 'P1');

    expect(parent.centreX).toBe(child.centreX);

    // A single vertical run — no elbow, and therefore no quarter-arcs.
    expect(connectors[0].d).toBe(`M${parent.centreX} ${parent.y + parent.height}V${child.y}`);
  });

  // Rule 1: orthogonal runs joined by quarter-arcs, never a diagonal bezier. A cubic
  // (C/c) or a smooth curve (S/s) in the output means someone reintroduced one.
  it('never emits a diagonal curve', () => {

    const { connectors } = layoutForkTree(TWELVE);

    for (const connector of connectors) {

      expect(connector.d).not.toMatch(/[CcSsTtAa]/);
    }
  });

  it('keeps every corner radius inside the space the corner has', () => {

    const { nodes, connectors } = layoutForkTree(TWELVE);

    for (const connector of connectors) {

      const parent = byId(nodes, connector.from);

      const child = byId(nodes, connector.to);

      const horizontal = Math.abs(child.centreX - parent.centreX);

      if (horizontal === 0) {

        continue;
      }

      // Two corners share the horizontal run and the vertical gap, so a radius wider
      // than half of either would overshoot and the elbow would double back.
      expect(connector.radius * 2).toBeLessThanOrEqual(horizontal);

      expect(connector.radius * 2).toBeLessThanOrEqual(LAYOUT.rowPitch - parent.height);
    }
  });
});

describe('layoutForkTree — viewBox', () => {

  it('encloses every node with an even margin', () => {

    const { nodes, viewBox } = layoutForkTree(TWELVE);

    const [vx, vy, vw, vh] = viewBox.split(' ').map(Number);

    const minX = Math.min(...nodes.map((node) => node.x));

    const maxX = Math.max(...nodes.map((node) => node.x + node.width));

    const minY = Math.min(...nodes.map((node) => node.y));

    const maxY = Math.max(...nodes.map((node) => node.y + node.height));

    expect(minX - vx).toBe(LAYOUT.margin);

    expect(minY - vy).toBe(LAYOUT.margin);

    expect(vx + vw - maxX).toBe(LAYOUT.margin);

    expect(vy + vh - maxY).toBe(LAYOUT.margin);
  });

  // The sim scrubs backwards and forwards through the stages, so the canvas has to
  // hold still. A per-stage viewBox would zoom the drawing on every step.
  it('is stable across every stage of a program when asked to reserve room', () => {

    const stages = forkStages({ calls: 3, conditional: true });

    const widest = layoutForkTree(stages[4]);

    const boxes = stages.map(

      (stage) => layoutForkTree(stage, { reserveFor: stages[4] }).viewBox,
    );

    expect(new Set(boxes).size).toBe(1);

    expect(boxes[0]).toBe(widest.viewBox);
  });

  // The conditional fork's children hang BELOW the existing leaves rather than beside
  // them, so the 8- and 12-process trees occupy the same columns. That lets the sim
  // reserve the shallower box in Guided mode and the deeper one in Explore: because an
  // SVG with width:100% scales by its viewBox width, switching between them extends
  // the canvas downward without moving or resizing a single box.
  it('adds a generation by growing downward, not sideways', () => {

    const stages = forkStages({ calls: 3, conditional: true });

    const guided = layoutForkTree(stages[3], { reserveFor: stages[3] });

    const explore = layoutForkTree(stages[3], { reserveFor: stages[4] });

    const [gx, , gw] = guided.viewBox.split(' ').map(Number);

    const [ex, , ew] = explore.viewBox.split(' ').map(Number);

    expect([gx, gw]).toEqual([ex, ew]);

    const exploreById = new Map(explore.nodes.map((node) => [node.id, node]));

    for (const node of guided.nodes) {

      expect([node.x, node.y]).toEqual([exploreById.get(node.id)?.x, exploreById.get(node.id)?.y]);
    }
  });

  // Reserving room is only half of holding the canvas still. If each stage re-centred
  // its own processes, stepping forward would slide every existing box sideways and
  // the reader would lose track of which process is which — the one thing the drawing
  // exists to show. Anchoring to the final tree means a process is placed once and
  // stays there; later stages only fill in.
  it('holds every process still as later stages add to the tree', () => {

    const stages = forkStages({ calls: 3, conditional: true });

    const placed = stages.map(

      (stage) => layoutForkTree(stage, { reserveFor: stages[4] }).nodes,
    );

    const final = new Map(placed[4].map((node) => [node.id, node]));

    for (const stage of placed) {

      for (const node of stage) {

        expect([node.x, node.y]).toEqual([final.get(node.id)?.x, final.get(node.id)?.y]);
      }
    }
  });
});
