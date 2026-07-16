import { describe, expect, it } from 'vitest';

import { getAdjacentChapters, sortChapters, type ChapterMeta } from '../../src/lib/chapters';

const threeChapters: ChapterMeta[] = [

  { number: 2, slug: 'os-services', title: 'OS Services' },

  { number: 1, slug: 'example', title: 'Example' },

  { number: 3, slug: 'processes', title: 'Processes' },
];

describe('sortChapters', () => {

  it('sorts by frontmatter number ascending, not array/collection iteration order', () => {

    const sorted = sortChapters(threeChapters);

    expect(sorted.map((c) => c.slug)).toEqual(['example', 'os-services', 'processes']);
  });

  it('does not mutate the input array', () => {

    const original = [...threeChapters];

    sortChapters(threeChapters);

    expect(threeChapters).toEqual(original);
  });
});

describe('getAdjacentChapters', () => {

  it('returns prev: null at the first chapter', () => {

    const { prev } = getAdjacentChapters(threeChapters, 'example');

    expect(prev).toBeNull();
  });

  it('returns next: null at the last chapter', () => {

    const { next } = getAdjacentChapters(threeChapters, 'processes');

    expect(next).toBeNull();
  });

  it('returns both prev and next null for the single-chapter Phase 1 case', () => {

    const singleChapter: ChapterMeta[] = [{ number: 1, slug: 'example', title: 'Example' }];

    const { prev, next } = getAdjacentChapters(singleChapter, 'example');

    expect(prev).toBeNull();

    expect(next).toBeNull();
  });

  it('returns { prev: null, next: null } for an unknown slug', () => {

    const result = getAdjacentChapters(threeChapters, 'does-not-exist');

    expect(result).toEqual({ prev: null, next: null });
  });
});
