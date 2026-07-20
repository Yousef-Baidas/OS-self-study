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

## Current state (2026-07-19)

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
  (see the Architecture section of `CLAUDE.md`). Three new modules, all unit-tested:
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
| Figures (inline SVG) | `src/assets/figures/<ch>/*.svg` |
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

1. **Chapters 3–10 content** — all decks are in `CONTENT/slides/`. Reuse the Chapter-1/2 pattern
   (Lead + tables + SlideRef + figures + sims). Extract per-slide text for accurate citations:
   `python3` unzip of the `.pptx` (see the pattern used for Ch1/Ch2).
2. **Exam bank per chapter** — add `src/content/questions/chNN.json`; the exam page auto-groups it
   into the `ExamShell` chapter switcher (no page change needed — it globs all chapters).
3. **Exam UX later** — cross-chapter mixed sets, timed mode, per-topic accuracy history. These are
   now changes to `src/lib/exam-engine.ts` with tests, not surgery inside the island: mixed sets are
   a `buildQueue` over several banks, accuracy history is a `progress-store` key.

## Known rough edges

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
- **`astro.config.mjs` edits need a dev-server restart** (not hot-reloaded) — e.g. the
  Expressive-Code `styleOverrides.textMarkers` that retint highlighted code lines to the teal accent.
  `styleOverrides` values accept `var(--token)`, so code-block chrome stays theme-aware.
- `.planning/` is gitignored GSD legacy; ignore it.
