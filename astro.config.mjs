import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

import mdx from '@astrojs/mdx';

import expressiveCode from 'astro-expressive-code';

export default defineConfig({
  site: 'https://yousef-baidas.github.io',

  base: '/OS-self-study/', // trailing slash kept intentionally — makes BASE_URL concatenation deterministic

  integrations: [expressiveCode(), mdx(), svelte()],
});
