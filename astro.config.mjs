import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

import mdx from '@astrojs/mdx';

import expressiveCode from 'astro-expressive-code';

export default defineConfig({
  site: 'https://yousef-baidas.github.io',

  base: '/OS-self-study/', // trailing slash kept intentionally — makes BASE_URL concatenation deterministic

  integrations: [
    expressiveCode({
      // Two syntax themes bound to our own data-theme attribute (not a media
      // query) so annotated code follows the header theme toggle in lockstep.
      themes: ['github-dark', 'github-light'],

      themeCssSelector: (theme) => `[data-theme="${theme.type}"]`,

      useDarkModeMediaQuery: false,

      defaultProps: {
        showLineNumbers: false,
      },

      styleOverrides: {
        codeFontFamily: "'JetBrains Mono', ui-monospace, 'SFMono-Regular', 'Menlo', monospace",

        codeFontSize: '0.85rem',

        borderRadius: '10px',

        borderColor: 'var(--color-border)',

        frames: {
          // Elevation is applied by global.css (.expressive-code .frame) so it
          // stays theme-aware; disable the plugin's own shadow to avoid doubling.
          shadowColor: 'transparent',
        },
      },
    }),

    mdx(),

    svelte(),
  ],
});
