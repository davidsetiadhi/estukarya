// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GITHUB_PAGES=true builds the demo for https://davidsetiadhi.github.io/estukarya/.
// Otherwise the site targets Cloudflare Pages; change `site` to https://estukarya.id once the domain is live.
const githubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  site: githubPages ? 'https://davidsetiadhi.github.io' : 'https://estukarya.pages.dev',
  base: githubPages ? '/estukarya' : '/',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
