import { describe, expect, it } from 'vitest';

import { joinBase } from '../../src/lib/withBase';

describe('joinBase', () => {

  it('joins a base-with-trailing-slash and a plain relative path', () => {

    expect(joinBase('/OS-self-study/', 'figures/example/x.svg')).toBe('/OS-self-study/figures/example/x.svg');
  });

  it('strips a leading slash on path so no double slash is produced', () => {

    expect(joinBase('/OS-self-study/', '/figures/example/x.svg')).toBe('/OS-self-study/figures/example/x.svg');
  });

  it('tolerates a base without a trailing slash, still yielding exactly one join slash', () => {

    expect(joinBase('/OS-self-study', 'chapters/example')).toBe('/OS-self-study/chapters/example');
  });

  it('handles the root base', () => {

    expect(joinBase('/', 'chapters/example')).toBe('/chapters/example');
  });
});
