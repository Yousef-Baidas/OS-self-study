# HANDOFF — OS-self-study

> Project-state doc for future sessions. **No GSD** — build directly, verify in the browser,
> commit atomically with plain messages. Update this file at the end of a working session.

## What this is

Interactive, mobile-first study site for **CE357 Operating Systems** (GJU, Summer 2026), following
Silberschatz *Operating System Concepts* 10th ed. Built chapter-by-chapter from the lecture slides.
Astro (static) + Svelte islands + MDX content collections + custom CSS design tokens. Deployed to
GitHub Pages (base path `/OS-self-study/`). Toolchain: Bun. Author + classmates are the audience.

**Core value:** distilled lecture notes + interactive sims that make an OS concept click faster than
re-reading the slides. Every claim cites its source slide so a student can jump to the deck.

## Current state (2026-07-21)

- **Chapter 1 (Introduction)** — complete, live at `/chapters/introduction`. Rewritten from dense
  prose into scannable lecture notes: section `<Lead>` essences, comparison tables for every
  distinction, bold key terms, inline `<SlideRef>` citations mapped from `CONTENT/slides/OS_chapter1.pptx`.
  Two sims (`StorageHierarchy`, `InterruptCycle`) + four redrawn inline theme-aware figures.
- **Chapter 2 (Operating-System Structures)** — complete, live at `/chapters/operating-system-structures`.
  Eight sections (services, UI/CLI/GUI, system calls, `fork`/`exec`/`wait`, system programs, OS
  structure, boot, debugging) in the same lecture-notes pattern, mapped from `OS_chapter2.pptx` (57
  slides). Three sims in `src/widgets/ch02/`: `CategorySorter` (services + syscall-category self-quiz,
  reused twice via a `dataset` prop), `OsStructureExplorer` (segmented control across all five
  structures with three render modes), `SyscallJourney` (SimFrame stepper flipping the mode bit
  through fork→exec→wait). Two inline figures (`services-view`, `syscall-parameter-passing`).
- **Chapter 3 (Processes)** — **notes complete, sims not started.** Live at `/chapters/processes`,
  marked `status: "draft"` so the page carries a draft banner until the sims and question bank land.
  Twelve sections mapped from `OS_chapter3.pptx` (42 slides): program vs process, the memory image,
  the PCB, the five states plus the **round-robin worked trace** from slides 13–14 as a full table,
  context switch, threads and `task_struct`, scheduling queues and the three schedulers,
  `fork`/`exec`/`wait` with both **fork-counting puzzles** (8 and 12 processes) worked through,
  termination with zombies/orphans, Chrome's multiprocess design, and IPC through to the race
  condition. Four inline theme-aware figures in `src/assets/figures/ch03/`: `memory-layout`,
  `process-state-diagram`, `context-switch` (drawn on a time axis rather than the deck's two-column
  form, so the "pure overhead" gap is visible), `scheduling-queues`.
- **Design system** — **warm-paper + deep-teal** identity (reskinned 2026-07-19 to match the sibling
  `prob-self-study` site's warm family, with its own teal/pine accent instead of prob-web's rust).
  Light = warm paper `#f6f1e7` / cream surfaces; dark = warm espresso `#16120e`; accent `#0d6b60`
  (light) / `#35b6a6` (dark). Rounder radii (8/12/16), warm-tinted shadows, bolder display type,
  fluid hero. Built on the existing token stack (no Tailwind). Key token: **`--color-accent-ink`**
  (text/glyph colour that sits ON the accent fill — near-white in light, deep espresso-teal in dark)
  — always use it instead of hardcoded `#fff` on an accent-filled button, or dark-mode contrast fails
  against the bright teal. Callouts / exam feedback / review items / sidebar-active use full tinted
  borders + washes (no side-stripes). Notes components: `SlideRef.astro` (citation pill), `Lead.astro`
  (section essence). Comparison-table, definition-list, and figure (`.fg-*`) styling in
  `src/styles/global.css`, scoped to `.chapter-prose`.
- **Motion** — a small **GSAP** layer on the home page only (`src/pages/index.astro` module script):
  a hero entrance stagger + a batched card scroll-reveal, gated behind
  `gsap.matchMedia('(prefers-reduced-motion: no-preference)')`. Resting state is fully visible, so
  no-JS / reduced-motion / headless never ships blank. GSAP is scoped to the landing bundle; chapter
  and exam pages stay motion-light.
- **Exam mode** — live at `/exam`, now **multi-chapter**. `ExamShell.svelte` wraps the per-chapter
  `QuizRunner.svelte` engine with a chapter switcher (a native `<select>`); picking a chapter
  remounts the runner via `{#key}` so its `onMount` re-reads that chapter's own localStorage
  (progress + last score stay per-chapter). Each runner: filter by topic/difficulty → answer
  mcq / true-false / numeric / short → instant feedback with worked solution + slide citation →
  score + review-your-misses → resumable. 20 Chapter-1 + 22 Chapter-2 questions.
- **Architecture (2026-07-21)** — the exam slice was carved back into the layout the project
  always intended: **content data beside its widget, framework-free logic in `src/lib/`**
  (the rule and its reasoning are in `docs/ARCHITECTURE.md`). Three new modules, all unit-tested:
  `exam-engine.ts` (grading, filtering, queue building, scoring), `progress-store.ts`
  (all localStorage behind an injectable seam), `roving-index.ts` (shared radiogroup
  keyboard math). Test count went 57 → 105, and the exam slice went from **zero** tests to
  covered. `QuizRunner`'s script dropped 279 → 148 lines; it now holds runtime state and
  renders, nothing else. Two behaviour changes worth knowing: grading returns a **verdict**
  (`correct` / `incorrect` / `self-graded`) so a short answer can never be recorded wrong by
  a forgotten type check, and SimFrame's mode toggle gained wrap + Home/End to match the
  WAI-ARIA radiogroup pattern the explorer already followed.
- **Deployed** — live on GitHub Pages at <https://yousef-baidas.github.io/OS-self-study/>.
  `main` is now the trunk/deploy branch (fast-forwarded from `foundation`); push to `main` → auto-deploy.

## Where things live

| Area | Path |
| --- | --- |
| Chapter content (MDX) | `src/content/chapters/NN-*.mdx` |
| Notes components | `src/components/{SlideRef,Lead,Callout,Figure}.astro` |
| Figures (inline SVG) | `src/assets/figures/<ch>/*.svg` — rules in **`docs/FIGURES.md`** |
| Figure contact sheet | `/dev/figures` (dev only) — every figure on one page, for verifying |
| Sims (per chapter) | `src/widgets/<ch>/*.svelte` + sibling `*.ts` content data |
| Exam questions | `src/content/questions/<ch>.json` (schema in `src/content.config.ts`) |
| Exam logic | `src/lib/exam-engine.ts` (grading, queue, scoring), `src/lib/progress-store.ts` (persistence) |
| Exam UI | `src/widgets/exam/{ExamShell,QuizRunner}.svelte`, page `src/pages/exam/index.astro` |
| Shared framework-free logic | `src/lib/*.ts` — all unit-tested in `tests/lib/` |
| Domain glossary | `CONTEXT.md` |
| Design tokens / globals | `src/styles/tokens.css`, `src/styles/global.css` |
| Source slides / review PDFs | `CONTENT/slides/OS_chapterN.pptx`, `CONTENT/*.pdf` |

## Deploy

Live: **https://yousef-baidas.github.io/OS-self-study/** — GitHub Pages, Actions source.
`main` is the trunk and deploy branch: any push to `main` runs `.github/workflows/deploy.yml`
(`withastro/action@v6` + `actions/deploy-pages@v5`) and republishes in ~30s — no PR needed for a
solo push. `CONTENT/` stays gitignored so the copyrighted decks are never published. On mobile,
hard-refresh to beat the Pages cache after a deploy.

## Next up

**Start here: finish Chapter 3.** The notes are live; what remains is four sims and the question
bank. Work items 1–3 below are all Chapter 3, in the order they were planned.

### ⚠️ First thing to know: `bun run test` is currently RED

`src/lib/fork-tree.ts` was committed one function short, on purpose (commit `cc944a4`).
**`growGeneration` throws**, and the 11 tests in `tests/lib/fork-tree.test.ts` are its spec —
they were written first and are meant to be made green, not deleted. Everything else in the suite
passes (110 tests). Nothing imports this module yet, and CI only runs `astro build`, so the live
site is unaffected.

The function returns a new tree in which every process `shouldFork` accepts has gained one child.
The whole contract, and the reason it exists, is in the TODO comment above it. The one rule that
matters: **snapshot the population before anyone forks** — append while traversing and newborns
join the same generation, giving 8 processes after two calls instead of 4. `cloneTree()` and
`levelOrder()` are already there for exactly this. It is about six lines.

1. **Chapter 3 sims (4 planned, 0 built).** All four mount inside `SimFrame`
   (`title`, `caption`, `totalSteps`, `bind:step`, `bind:mode`), which already owns the
   guided/explore toggle, the step strip, Previous/Step/Reset, and the roving-tabindex keyboard
   model — a new sim supplies only its canvas. Put step/content data in a sibling
   `src/widgets/ch03/*.ts` and unit-test its shape, matching the five existing data modules.

   ⚠️ **`ForkTree` and `StateTrace` draw SVG, so read `docs/FIGURES.md` first.** It is the
   canonical diagram spec and it applies to sim canvases exactly as it does to the static
   chapter figures. The Chapter 3 figures had to be redrawn once already (`7676974`) because
   they were built without it — orthogonal connectors meeting edge midpoints, endpoints that
   are literally node edge coordinates, tiled regions square, labels in gutters no line crosses.
   In a sim you get this nearly free: derive positions and connector paths from the layout
   function in `src/lib/` and unit-test that endpoints equal node edges, instead of asserting
   coordinates by hand the way a static `.svg` has to. Verify on `/dev/figures` in both themes.
   - **`ForkTree`** — slides 33–34, the chapter's recurring exam question. Guided steps through
     1 → 2 → 4 → 8 as each `fork()` doubles the population; Explore toggles the trailing
     `if (x == 0) fork();` to reach 12. Logic is already scaffolded in `src/lib/fork-tree.ts`
     (`forkStages()` returns one immutable tree per step, so Previous is just an array index —
     no inverse operation to write). **Finish `growGeneration` first.**
   - **`StateTrace`** — slides 13–14 as a scrubbable timeline: P1/P2/P3 rows, cells coloured by
     state, scrub 0 → 27 ms. The trace table is already in the MDX, so the sim adds the scrub, not
     the data. Schedule computation belongs in `src/lib/`, unit-tested, same as fork-tree.
   - **`RaceCondition`** — slide 42. Step S0–S5 watching `register1`/`register2`/`counter`
     diverge; Explore lets the reader reorder the interleaving to produce 4, 5, or 6.
   - **`IpcModels`** — slide 39. Shared memory vs message passing side by side; send a message
     under each and watch whether it crosses the kernel boundary. Lowest payoff of the four —
     it is illustrative rather than computational, so drop it if time is short.
2. **Chapter 3 question bank** — add `src/content/questions/ch03.json`. The exam page globs every
   chapter and auto-groups it into the `ExamShell` switcher, so no page change is needed. Ch1 has
   20 questions and Ch2 has 22; aim for a comparable set. Remember the dev-server restart (see
   Gotchas). Obvious question material: ready-vs-waiting, why waiting can't re-enter running
   directly, fork counting (both variants), zombie vs orphan, the three schedulers by frequency,
   and why the race condition's damage happens at S2.
3. **Flip Chapter 3 to `status: "complete"`** in the MDX frontmatter once 1 and 2 land — that is
   what removes the draft banner.
4. **Chapters 4–10 content** — one chapter per session after this. Decks are in `CONTENT/slides/`
   (note: **no `OS_chapter7.pptx`** — the course skips it). Extract per-slide text for accurate
   citations with a `python3` unzip of the `.pptx`; the snippet used for Ch1–Ch3 walks
   `ppt/slides/slideN.xml` and joins every `<a:t>` run per paragraph.
5. **Exam UX, when wanted** — cross-chapter mixed sets, timed mode, per-topic accuracy history.
   These are now changes to `src/lib/exam-engine.ts` with tests, not surgery inside the island:
   mixed sets are a `buildQueue` over several banks, accuracy history is another `progress-store`
   key. `PASS_PCT` is a constant there if the pass mark should move.

## Known rough edges

None of these is urgent — they are the honest list of what a future session might pick up, in
rough order of value.

- **`ExamShell.svelte:22`** — svelte-check warns that `groups` is read non-reactively inside
  `onMount`. Harmless today (the prop never changes after mount, and switching chapters remounts
  the runner), but it is the last warning in the tree if you want zero.
- **The remaining sim duplication** — `InterruptCycle` and `SyscallJourney` still hold two copies of
  the same cancellable replay loop (~70 lines, differing only in step data and delay), and both
  carry the same latch bug: on the cancel path `replaying` is never cleared, so the trigger button's
  disabled state depends on an `$effect` firing. A `createReplay({ steps, delayMs, sleep })` module
  in `src/lib/` would fix it in one place and — with `sleep` injected — give the sims their first
  behavioural test. This was built and verified once on 2026-07-17, then reverted to return the tree
  to a clean state; nothing was wrong with it.
- **Dead descriptor fields** — `StepDescriptor.caption`, `JourneyStep.caption` and
  `StorageTier.storageClass` are authored and unit-tested but never rendered, while the widgets
  hardcode the labels they do show. Either render them (SimFrame could take the step descriptors
  instead of a bare `totalSteps` count) or delete them with their assertions.
- **`CategorySorter` and `OsStructureExplorer` don't use `SimFrame`** — its interface requires
  `totalSteps`/`step`, and neither widget steps, so both re-declare its card, heading and segmented
  control CSS rule-for-rule. Making the stepper part conditional would give all five sims one visual
  recipe. Worth doing only alongside the descriptor change above — it is the same interface edit,
  and on its own it moves CSS around rather than concentrating any behaviour.
- **CSS is 46–69% of every widget file**, and the accent-highlight trio
  (`border-color: var(--color-accent); background: var(--color-accent-wash)`) is repeated eight
  times across the sims. A shared token class in `global.css` would collapse it.

## Gotchas / decisions

- **Mode-bit conflict**: the main lecture deck (slide 34) and the textbook say **kernel = 0, user = 1**;
  the Chapter-1 review PDF says the reverse. Notes + exam follow the lecture/textbook; the exam
  question on this flags the discrepancy. Watch for this per chapter.
- **Figures must be inlined** (not `<img src>`) to follow the site's theme toggle — `Figure.astro`
  inlines any SVG found under `src/assets/figures/`, else falls back to a base-path-safe `<img>`.
- **New content-collection files** (e.g. a new `questions/*.json`) need a **dev-server restart** —
  the glob is cached at server start. The production build always picks them up.
- **Verifying sims/exam in-browser**: Svelte 5 delegated click handlers don't fire from synthetic
  `dispatchEvent` — use real clicks (Playwright `.click()`). Native `<select>` change events are not
  delegated and do work via dispatch. The `<astro-dev-toolbar>` at bottom-center is dev-only.
- **Don't try to fake storage failure by patching then reloading** — a reload is a fresh JS context,
  so the patch is gone before the island mounts and you end up verifying nothing. The
  storage-unavailable path is covered properly in `tests/lib/progress-store.test.ts`, which injects
  a hostile adapter; that is what the injectable seam is for.
- **A figure that builds is not a figure that reads.** SVG has no layout engine — every coordinate
  is asserted, never checked — so a diagram can pass `astro build`, inline correctly, and still be
  wrong on screen. Both Chapter-3 defects were of this kind and only a screenshot caught them: in
  `scheduling-queues` the return rail spanned the wrong y-range, so three of the four branches
  visibly dead-ended while the caption claimed every path loops back; in `process-state-diagram` a
  label sat inside the boxes' vertical span and overlapped one. Screenshot each `<figure>` element
  after writing it (`page.locator('figure').nth(i).screenshot(...)`), at mobile width, in **both**
  themes — the `.fg-*` classes mean light and dark are genuinely different renders.
- **Unit-green is not verified** for anything with a DOM behaviour. The roving-index extraction
  passed all 57 tests while silently scrolling the page 40px on a locked segment — the defect was
  in what the interface failed to distinguish, and only a browser showed it.
- **`bun run dev` daemonizes** — it returns immediately and keeps running in the background.
  `bunx astro dev stop` to shut it down, `astro dev status` / `astro dev logs` to inspect it.
- **`astro.config.mjs` edits need a dev-server restart** (not hot-reloaded) — e.g. the
  Expressive-Code `styleOverrides.textMarkers` that retint highlighted code lines to the teal accent.
  `styleOverrides` values accept `var(--token)`, so code-block chrome stays theme-aware.
- `.planning/` is gitignored GSD legacy; ignore it.
