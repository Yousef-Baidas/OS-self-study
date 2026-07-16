import { defineCollection, reference, z } from 'astro:content';

import { glob } from 'astro/loaders';

// Convention (documented here so no later phase reopens this file — GROW-01):
// A chapter's canonical identity is its frontmatter `slug`. The glob() loader's
// generateId callback keys every chapter entry on that slug — NOT the numeric-prefixed
// filename (e.g. "00-example.mdx" -> id "example", not "00-example"). This is required
// for questions[].chapter: reference('chapters') to resolve when a question references
// a chapter by slug (D-10/D-11/D-12). The URL (/chapters/<slug>) and the reference key
// MUST always be the same string.
const chapters = defineCollection({
  loader: glob({
    pattern: '**/*.mdx',

    base: './src/content/chapters',

    generateId: ({ data }) => data.slug as string,
  }),

  schema: z.object({
    number: z.number(),

    title: z.string(),

    slug: z.string(),

    summary: z.string(),

    topics: z.array(z.string()),

    slideCount: z.number(),

    status: z.enum(['draft', 'complete']),
  }),
});

// Every question entry needs at least an `id` string — the Content Layer's
// plain-array loader shape — plus whatever fields the schema below validates.
type QuestionEntry = { id: string; [key: string]: unknown };

// Eagerly globs every *.json file in the questions directory via Vite's native
// import.meta.glob (typed through astro/client.d.ts -> vite's import-meta types,
// no node:fs/@types-node dependency needed). Re-evaluated on every build.
const questionModules = import.meta.glob<{ default: QuestionEntry[] }>('./content/questions/*.json', {
  eager: true,
});

// Plain async-function loader: flattens N per-chapter JSON arrays into one
// entry per question. Adding chNN.json later requires zero changes here (GROW-02) —
// the loader re-globs the directory on every build, no per-filename literal.
const questions = defineCollection({
  loader: async (): Promise<QuestionEntry[]> => {

    return Object.values(questionModules).flatMap((mod) => mod.default);
  },

  schema: z.object({
    id: z.string(),

    // References the chapters collection by its slug-keyed id (see generateId above).
    // A typo'd slug here fails astro build loudly, at authoring time — not silently at runtime.
    chapter: reference('chapters'),

    topic: z.string(),

    type: z.enum(['mcq', 'true-false', 'numeric', 'short']),

    difficulty: z.enum(['easy', 'medium', 'hard']),

    prompt: z.string(),

    choices: z.array(z.string()).optional(),

    answer: z.union([z.number(), z.string()]),

    solution: z.string(),

    source: z.string(),
  }),
});

export const collections = { chapters, questions };
