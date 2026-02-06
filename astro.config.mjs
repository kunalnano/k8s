import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

const isContainer = process.env.DEPLOY_TARGET === 'container';

export default defineConfig({
  site: isContainer ? 'http://localhost:8080' : 'https://kunalnano.github.io',
  base: isContainer ? '/' : '/k8s',
  integrations: [react(), mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
