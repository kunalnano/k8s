import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

const isGitHubPages = !process.env.VERCEL && process.env.DEPLOY_TARGET !== 'container';

export default defineConfig({
  site: isGitHubPages ? 'https://kunalnano.github.io' : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:8080'),
  base: isGitHubPages ? '/k8s' : '/',
  integrations: [react(), mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
