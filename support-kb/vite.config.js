import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { fileURLToPath } from 'node:url';
export default defineConfig({ plugins: [svelte({ extensions: ['.svelte', '.svx'], preprocess: [mdsvex({ extensions: ['.svx'], layout: { runbook: fileURLToPath(new URL('./src/lib/layouts/runbook.svelte', import.meta.url)) } })] })], resolve: { alias: { '#lib': fileURLToPath(new URL('./src/lib', import.meta.url)) } }, build: { ssrEmitAssets: true, ssr: 'scripts/render.mjs', outDir: '.build', rollupOptions: { output: { entryFileNames: 'render.js' } } } });
