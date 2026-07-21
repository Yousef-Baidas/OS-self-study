// Geometry for the ForkTree sim's SVG canvas (Chapter 3, slides 33-34).
//
// docs/FIGURES.md is the canonical diagram spec and it governs sim canvases exactly
// as it governs the static chapter figures. Its one concession to sims is the reason
// this module exists: a sim should COMPUTE its geometry rather than assert it, so
// that "connectors meet an edge midpoint" (rule 2) and "every endpoint is literally a
// box edge coordinate" (rule 3) hold by construction and can be unit-tested — the
// check `astro build` structurally cannot perform.
//
// Layout is the classic tidy-tree walk: leaves claim successive columns left to
// right, and every parent centres over the span of its children.

import { levelOrder, type ForkNode } from './fork-tree';

export const LAYOUT = {

  nodeWidth: 52,

  nodeHeight: 34,

  // Minimum clear space between two boxes sharing a row. Also the column pitch's
  // second term, which is what makes that minimum hold for adjacent leaves.
  columnGap: 24,

  // Row centre-to-centre. The leftover (rowPitch - nodeHeight) is the vertical gap a
  // connector's two quarter-arcs have to fit inside.
  rowPitch: 84,

  // Matches the ~24 units docs/FIGURES.md rule 6 asks for around the content bbox.
  margin: 24,

  cornerRadius: 10,
} as const;

const COLUMN_PITCH = LAYOUT.nodeWidth + LAYOUT.columnGap;

export type Point = { x: number; y: number };

export type PlacedNode = {

  id: string;

  bornAt: number;

  // Generation: 0 is the initial process, and depth is also the index of the fork()
  // call that created the node's row.
  depth: number;

  // Top-left corner, so `x + width` / `y + height` are the right and bottom edges.
  x: number;

  y: number;

  width: number;

  height: number;

  // Vertical centre line. Both connector endpoints are on it (rule 2), so it is
  // stored rather than recomputed at three call sites.
  centreX: number;
};

export type Connector = {

  from: string;

  to: string;

  // Parent bottom edge midpoint, and child top edge midpoint. Exposed alongside `d`
  // so a test can assert the endpoints without parsing the path string.
  start: Point;

  end: Point;

  // The radius actually used, after clamping to the space the corner has.
  radius: number;

  d: string;
};

export type ForkTreeLayout = {

  nodes: PlacedNode[];

  connectors: Connector[];

  viewBox: string;
};

export type LayoutOptions = {

  // Lay the tree out at the coordinates it will occupy in `reserveFor` instead of at
  // its own natural ones. The sim passes the final stage here so the canvas neither
  // rescales nor reflows while the reader steps through the stages.
  reserveFor?: ForkNode;
};

// Trim float noise from clamped radii without disturbing the integer coordinates the
// endpoints must keep exactly (rule 3).
function num(value: number): number {

  return Number(value.toFixed(2));
}

// Tidy-tree placement, post-order: a node cannot be centred until its children have
// claimed their columns, so children are placed first and the parent derives from them.
function placeTree(root: ForkNode): Map<string, PlacedNode> {

  const placed = new Map<string, PlacedNode>();

  let nextColumn = 0;

  function walk(node: ForkNode, depth: number): PlacedNode {

    let centreX: number;

    if (node.children.length === 0) {

      centreX = nextColumn * COLUMN_PITCH + LAYOUT.nodeWidth / 2;

      nextColumn += 1;
    } else {

      const children = node.children.map((child) => walk(child, depth + 1));

      // Span midpoint rather than mean: with three children the parent should sit over
      // the middle of the group's extent, not be pulled by how the group is weighted.
      centreX = (children[0].centreX + children[children.length - 1].centreX) / 2;
    }

    const entry: PlacedNode = {
      id: node.id,

      bornAt: node.bornAt,

      depth,

      x: centreX - LAYOUT.nodeWidth / 2,

      y: depth * LAYOUT.rowPitch,

      width: LAYOUT.nodeWidth,

      height: LAYOUT.nodeHeight,

      centreX,
    };

    placed.set(node.id, entry);

    return entry;
  }

  walk(root, 0);

  return placed;
}

// Orthogonal elbow from a parent's bottom edge to a child's top edge: down, across,
// down, with quarter-arcs at the two corners (rule 1 — no diagonal beziers). When the
// two boxes share a centre line there is no corner at all and the run is one `V`.
function connect(parent: PlacedNode, child: PlacedNode): Connector {

  const start: Point = { x: parent.centreX, y: parent.y + parent.height };

  const end: Point = { x: child.centreX, y: child.y };

  const span = end.x - start.x;

  if (span === 0) {

    return { from: parent.id, to: child.id, start, end, radius: 0, d: `M${start.x} ${start.y}V${end.y}` };
  }

  const midY = (start.y + end.y) / 2;

  // Both corners share the horizontal run and the vertical gap between the rows, so
  // the radius has to fit inside half of each — otherwise the arcs overshoot and the
  // elbow visibly doubles back on itself.
  const radius = num(Math.min(LAYOUT.cornerRadius, Math.abs(span) / 2, (end.y - start.y) / 2));

  const step = span > 0 ? radius : -radius;

  const d =
    `M${start.x} ${start.y}` +
    `V${num(midY - radius)}` +
    `Q${start.x} ${midY} ${num(start.x + step)} ${midY}` +
    `H${num(end.x - step)}` +
    `Q${end.x} ${midY} ${end.x} ${num(midY + radius)}` +
    `V${end.y}`;

  return { from: parent.id, to: child.id, start, end, radius, d };
}

export function layoutForkTree(root: ForkNode, options: LayoutOptions = {}): ForkTreeLayout {

  // Every coordinate — including the viewBox — comes from the anchor tree, so a stage
  // drawn against a later one lands exactly where that later stage will put it.
  const anchor = options.reserveFor ?? root;

  const placed = placeTree(anchor);

  const nodes = levelOrder(root).map((node) => {

    const entry = placed.get(node.id);

    if (!entry) {

      throw new Error(`${node.id} is absent from the reserved layout`);
    }

    return entry;
  });

  const connectors: Connector[] = [];

  for (const node of levelOrder(root)) {

    for (const child of node.children) {

      connectors.push(connect(placed.get(node.id) as PlacedNode, placed.get(child.id) as PlacedNode));
    }
  }

  const reserved = [...placed.values()];

  const minX = Math.min(...reserved.map((node) => node.x));

  const maxX = Math.max(...reserved.map((node) => node.x + node.width));

  const minY = Math.min(...reserved.map((node) => node.y));

  const maxY = Math.max(...reserved.map((node) => node.y + node.height));

  const viewBox = [
    minX - LAYOUT.margin,

    minY - LAYOUT.margin,

    maxX - minX + LAYOUT.margin * 2,

    maxY - minY + LAYOUT.margin * 2,
  ].join(' ');

  return { nodes, connectors, viewBox };
}
