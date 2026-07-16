// Pure chapter-ordering logic (NAV-01/NAV-04) — framework-free (no Astro/Svelte
// imports) so it is directly unit-testable and reusable by Sidebar.astro and
// the [slug].astro prev/next row alike. Both functions are total: they never
// throw, returning nulls at boundaries or on an unknown slug.
export type ChapterMeta = {
  number: number;

  slug: string;

  title: string;
};

// Sorts by frontmatter `number` ascending — NEVER by array/collection
// iteration order, which Astro's glob() loader does not guarantee matches
// authoring order. Returns a new array; never mutates the input.
export function sortChapters(chapters: ChapterMeta[]): ChapterMeta[] {

  return [...chapters].sort((a, b) => a.number - b.number);
}

// Returns the previous/next chapter relative to `currentSlug`, or null at
// either boundary. An unknown slug also returns { prev: null, next: null }
// rather than throwing.
export function getAdjacentChapters(
  chapters: ChapterMeta[],
  currentSlug: string,
): { prev: ChapterMeta | null; next: ChapterMeta | null } {

  const sorted = sortChapters(chapters);

  const index = sorted.findIndex((chapter) => chapter.slug === currentSlug);

  if (index === -1) {

    return { prev: null, next: null };
  }

  return {
    prev: index > 0 ? sorted[index - 1] : null,

    next: index < sorted.length - 1 ? sorted[index + 1] : null,
  };
}
