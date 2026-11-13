import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	],
	test: {
		// Ported from ramka's vitest suite (jsdom, like the original). Tests live
		// in `src/tests` so svelte-package never ships them or their fixtures.
		projects: [
			{
				extends: true,
				plugins: [svelteTesting()],
				test: {
					name: 'client',
					environment: 'jsdom',
					setupFiles: ['./src/tests/setup.ts'],
					include: ['src/tests/**/*.test.ts'],
					exclude: ['src/tests/**/*.ssr.test.ts']
				}
			},
			{
				// Server rendering (`svelte/server`): the original's
				// `@vitest-environment node` files.
				extends: true,
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/tests/**/*.ssr.test.ts']
				}
			}
		]
	}
});
