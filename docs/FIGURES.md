# Diagram conventions — OS-self-study

Canonical rules for every diagram on this site: the static chapter figures in
`src/assets/figures/<ch>/*.svg` **and** any SVG a sim draws at runtime.

Read this before drawing a figure or a sim canvas. The Chapter 3 figures were redrawn
once already (commit `7676974`) because they were built without it.

## Why this file exists

**Nothing in the build checks a diagram's geometry.** `astro build`, `astro check` and
`svelte-check` all validate markup and types — none of them knows that a connector points
at empty space, that a label sits on top of a line, or that two regions overlap by two
pixels. A broken diagram compiles clean, passes CI, and ships.

So the numbers themselves have to be reviewable. Every rule below exists to make a defect
visible **by reading the source**, rather than only by staring at the render.

## The rules

### 1. Connectors are orthogonal

Horizontal and vertical runs joined by 10-unit quarter-arcs. No diagonal béziers.

```
M100 92 V168 Q100 178 110 178 H190
```

A diagonal bézier has no checkable relationship to the boxes it connects — that is how
Chapter 3 ended up with curves entering box corners at 45°.

### 2. Connectors meet an edge MIDPOINT, perpendicular

Leave and enter at the middle of a side, never near a corner. If two connectors would
leave the same box on the same centre line (one up, one down), move one to a different
edge — otherwise the pair reads as a single line skewering the box.

### 3. Every endpoint is literally a box edge coordinate

The arrow markers use `refX` = the tip's own x:

```xml
<marker id="arw-XX" markerWidth="10" markerHeight="8" refX="9" refY="4"
        orient="auto" markerUnits="userSpaceOnUse">
  <path d="M0,0 L9,4 L0,8 Z" class="fg-arrow" />
</marker>
```

The arrowhead point then lands exactly on the path's last coordinate. So a connector into
a box whose left edge is `x=190` ends `H190` — and a wrong connector is visible in the
source. Do not reintroduce the old `refX="7"` markers, which put the tip 2 units past the
endpoint and made every gap approximate.

### 4. Tiled regions are square; discrete nodes are rounded

A contiguous address space or a contiguous timeline **tiles**: square corners, shared
edges, each region's start equal to the previous one's end. Discrete nodes (states,
queues, components) are rounded (`rx="10"`, or `rx="7"` for small bars).

Rounded corners on abutting segments pinch into lens-shaped gaps at every seam — that was
most of what made `context-switch.svg` look choppy. Tiling also makes an overlap
impossible to write by accident, which is how `memory-layout.svg` had `data` at
y 270–316 against `text` starting at 314.

### 5. Labels live in gutters no connector crosses

Never place a label where a line runs through the glyphs. Prefer an empty column beside
the diagram over squeezing a label into a 60-unit gap — in `scheduling-queues.svg` all
four branch labels are left-aligned at `x=422`, in the empty space right of the trunk.

### 6. The viewBox is the measured content bbox plus ~24 units

`Figure.astro` already pads the plate. A zero-origin viewBox with baked-in margin pads
twice and shrinks the diagram for no reason, so viewBox origins are usually non-zero.

**Measure, never estimate.** Hand-estimating text widths is what produced the
label-on-connector collisions in the first place. See the verification loop below.

### 7. Marker and pattern IDs must be unique across the whole page

Several figures are inlined into one chapter page, and inline SVG shares one document
ID space. Two figures both defining `#arrow` means the second silently uses the first's
marker. Suffix every `<defs>` id with the figure: `arw-ps`, `arw-sq`, `hatch-ml`.

### 8. Colour comes from the `.fg-*` classes only

`.fg-node`, `.fg-node-strong`, `.fg-node-accent`, `.fg-panel`, `.fg-line`, `.fg-arrow`,
`.fg-text`, `.fg-text-muted`, `.fg-mono`, `.fg-hatch` — defined in `src/styles/global.css`.
Never hardcode a hex value, and avoid `opacity` to fake a tint: it muddies strokes where
shapes meet. Accent marks the thing the figure is *about*, not decoration.

## The verification loop

`bun run dev`, then open **`/dev/figures`** — a dev-only contact sheet that inlines every
figure on one page. (It is excluded from production: the static build emits the route as a
`noindex` redirect to home.)

**1. Check nothing is clipped and margins are even.** In the browser console:

```js
Array.from(document.querySelectorAll('.row')).map(r => {
  const svg = r.querySelector('svg');
  const b = svg.getBBox();
  const [vx, vy, vw, vh] = svg.getAttribute('viewBox').split(' ').map(Number);
  return {
    name: r.querySelector('h2').textContent,
    clipped: b.x < vx || b.y < vy || b.x + b.width > vx + vw || b.y + b.height > vy + vh,
    margins: [b.x - vx, b.y - vy, vx + vw - b.x - b.width, vy + vh - b.y - b.height],
  };
});
```

To derive a tight viewBox for a new figure, print
`` `${Math.floor(b.x - 24)} ${Math.floor(b.y - 24)} ...` `` from the same bbox.

**2. Screenshot both themes.** Light, then flip and shoot again:

```js
document.documentElement.dataset.theme = 'dark';
```

Dark is where a hardcoded colour or a too-subtle fill shows up.

**3. Look at the render.** The bbox check catches clipping, not collisions — a label
sitting on a line has a perfectly valid bbox. Eyes are still required for rules 1, 2 and 5.

> The Playwright screenshot MCP writes PNGs to the **repo root**, not `.playwright-mcp/`.
> `find` for them, and delete them before committing.

## Sims that draw SVG

`ForkTree`, `StateTrace` and any other sim rendering its own canvas follow all of the
above. Two additions:

- **Compute the geometry, don't hardcode it.** A sim already has a layout function —
  derive node positions and connector paths from it so rules 2 and 3 hold by construction
  rather than by inspection. This is strictly better than a static figure, where the
  numbers are asserted.
- **Layout maths goes in `src/lib/` and gets unit-tested**, per `docs/ARCHITECTURE.md` —
  framework-free logic in `src/lib/`, DOM work in the island. A test asserting that a
  connector's endpoint equals a node's edge is exactly the check the build cannot do.

## Before committing a diagram

- [ ] All connectors orthogonal, meeting edge midpoints (rules 1–2)
- [ ] Every connector endpoint equals a box edge value (rule 3)
- [ ] Tiled regions square and sharing edges; no overlaps (rule 4)
- [ ] No label touched by a line (rule 5)
- [ ] viewBox = measured bbox + ~24, nothing clipped (rule 6)
- [ ] `<defs>` ids suffixed per figure (rule 7)
- [ ] No hex colours, no `opacity` tints (rule 8)
- [ ] Screenshotted in **both** themes on `/dev/figures`
- [ ] Stray screenshot PNGs deleted from the repo root
