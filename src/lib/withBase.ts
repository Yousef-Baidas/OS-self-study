// Pure base-path join helper — takes `base` as an argument (never reads
// import.meta.env at module scope) so it stays unit-testable without Astro.
//
// Usage: joinBase(import.meta.env.BASE_URL, `chapters/${slug}`) for every
// internal link/asset so nothing 404s under the GitHub Pages base path.
export function joinBase(base: string, path: string): string {

  // Ensure base ends in exactly one slash, regardless of how it was passed in.
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;

  // Strip any leading slash(es) from path so the join never doubles up.
  const normalizedPath = path.replace(/^\/+/, '');

  return `${normalizedBase}${normalizedPath}`;
}
