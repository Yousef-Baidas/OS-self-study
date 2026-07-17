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

## Current state (2026-07-17)

- **Chapter 1 (Introduction)** — complete, live at `/chapters/introduction`. Rewritten from dense
  prose into scannable lecture notes: section `<Lead>` essences, comparison tables for every
  distinction, bold key terms, inline `<SlideRef>` citations mapped from `CONTENT/slides/OS_chapter1.pptx`.
  Two sims (`StorageHierarchy`, `InterruptCycle`) + four redrawn inline theme-aware figures.
- **Design system** — elevated to a "shadcn look" on the existing token stack (no Tailwind). Notes
  components: `SlideRef.astro` (citation pill), `Lead.astro` (section essence). Comparison-table,
  definition-list, and figure (`.fg-*`) styling in `src/styles/global.css`, scoped to `.chapter-prose`.
- **Exam mode** — live at `/exam`. `QuizRunner.svelte` island: filter by topic/difficulty → answer
  mcq / true-false / numeric / short → instant feedback with worked solution + slide citation →
  score + review-your-misses → resumable via localStorage. Seeded with 20 Chapter-1 questions.
- **Deployed** — live on GitHub Pages at <https://yousef-baidas.github.io/OS-self-study/>.
  `main` is now the trunk/deploy branch (fast-forwarded from `foundation`); push to `main` → auto-deploy.

## Where things live

| Area | Path |
| --- | --- |
| Chapter content (MDX) | `src/content/chapters/NN-*.mdx` |
| Notes components | `src/components/{SlideRef,Lead,Callout,Figure}.astro` |
| Figures (inline SVG) | `src/assets/figures/<ch>/*.svg` |
| Sims (per chapter) | `src/widgets/<ch>/*.svelte` |
| Exam questions | `src/content/questions/<ch>.json` (schema in `src/content.config.ts`) |
| Exam engine | `src/widgets/exam/QuizRunner.svelte`, page `src/pages/exam/index.astro` |
| Design tokens / globals | `src/styles/tokens.css`, `src/styles/global.css` |
| Source slides / review PDFs | `CONTENT/slides/OS_chapterN.pptx`, `CONTENT/*.pdf` |

## Deploy

Live: **https://yousef-baidas.github.io/OS-self-study/** — GitHub Pages, Actions source.
`main` is the trunk and deploy branch: any push to `main` runs `.github/workflows/deploy.yml`
(`withastro/action@v6` + `actions/deploy-pages@v5`) and republishes in ~30s — no PR needed for a
solo push. `CONTENT/` stays gitignored so the copyrighted decks are never published. On mobile,
hard-refresh to beat the Pages cache after a deploy.

## Next up

1. **Chapters 2–10 content** — all decks are in `CONTENT/slides/`. Reuse the Chapter-1 pattern
   (Lead + tables + SlideRef + figures + sims). Extract per-slide text for accurate citations:
   `python3` unzip of the `.pptx` (see the pattern used for Ch1).
2. **Exam bank per chapter** — add `src/content/questions/chNN.json` as each chapter lands.
3. **Exam UX later** — cross-chapter mixed sets, timed mode, per-topic accuracy history.

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
- `.planning/` is gitignored GSD legacy; ignore it.
