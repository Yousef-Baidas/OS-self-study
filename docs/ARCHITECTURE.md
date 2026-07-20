# Architecture — OS-self-study

Where code goes, and why. Domain vocabulary lives in [`CONTEXT.md`](../CONTEXT.md); project
state and what's next live in [`HANDOFF.md`](./HANDOFF.md).

## Two clocks

**Build time** — MDX chapters and JSON question banks are validated by Zod schemas in
`src/content.config.ts` and rendered to static HTML. **Runtime** — that HTML lazily hydrates
Svelte islands, which read and write localStorage. Nothing runs on a server; there isn't one.

Almost every placement question answers itself once you ask which clock a file serves, and
whether it can be tested without a browser.

## The rule

**Framework-free logic in `src/lib/`. Content data beside its widget. DOM work in the islands.**

### `src/lib/**.ts` — framework-free logic

No Svelte, no Astro, no `astro:content` imports. Everything here is unit-tested in plain node
vitest — there is no jsdom in this stack, by design, and adding one should be a deliberate
decision rather than a convenience.

| Module | Owns |
| --- | --- |
| `exam-engine.ts` | Grading, answer formatting, filtering, queue building, scoring, session reconciliation |
| `progress-store.ts` | Every exam localStorage key, the JSON round-trip, and storage being unavailable |
| `chapters.ts` | Chapter ordering and prev/next adjacency |
| `roving-index.ts` | Radiogroup arrow/Home/End index math |
| `focus-trap.ts` | Tab-cycling wrap math for the mobile drawer |
| `withBase.ts` | Base-path-safe URL joining |

Two habits make these modules testable, and both are load-bearing:

- **Dependencies are injected, not reached for.** `buildQueue` takes its `rng`;
  `createProgressStore` takes its storage. That is why queue order can be asserted exactly and
  why the persistence tests run an in-memory adapter and a hostile one that throws on every
  call, with no browser involved.
- **Results are returned, not applied.** `summarize` computes a summary; it does not mutate a
  score. `gradeAnswer` returns a verdict; it does not record an answer.

### `src/widgets/**` — Svelte islands

Runtime state and rendering. They import their logic from `src/lib/`. Anything touching the
DOM — focus movement, element refs, `matchMedia`, timers — stays here, and is verified in the
browser rather than unit-tested.

`src/widgets/chNN/*.ts` is the exception that isn't one: those hold **chapter content data**
(the seven storage tiers, the six interrupt steps), which is genuinely chapter-local and would
gain nothing from sitting in `lib/`. Content data beside the widget; logic in `lib/`.

### `src/components/**` — Astro chrome

Never carries a `client:*` directive. `SimFrame.svelte` is the deliberate exception: shared sim
chrome has to share a hydration boundary with the sim's own state, or the Reset control could
never reach the sim's `step`.

### `src/pages/**` — routing only

Content-collection queries and routing. Shaping logic that deserves a test belongs in `lib/`,
not in an `.astro` frontmatter where nothing can reach it.

## Verification

`bun run test` (vitest, `src/lib/` only) and `bun run check` (`astro check` + `svelte-check`)
before any commit. Neither can see the islands, so anything with a DOM behaviour — a sim's
keyboard model, the exam flow, resume-after-reload — is verified in a real browser. Two traps
worth remembering: Svelte 5's delegated click handlers do not fire from synthetic
`dispatchEvent`, so drive real clicks; and patching `localStorage` then reloading loses the
patch, because a reload is a fresh JS context.
