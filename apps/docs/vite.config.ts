import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { excerpts } from './vite-excerpts.ts';
import { slowImage } from './src/lib/server/slow-image';
import { enhancedImages } from '@sveltejs/enhanced-img';

export default defineConfig({
	plugins: [
		excerpts({ root: 'src/lib' }),
		enhancedImages(),
		tailwindcss(),
		// /api/slow-image for the debug and guide demos in dev and preview
		// (src/service-worker.ts answers it on a static host).
		slowImage(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			// Compile the library from source instead of its packaged `dist`.
			// Re-packaging rewrites every dist file at once, which left the dev
			// server serving several copies of one module (each with its own
			// context key) and broke hydration with a 500.
			alias: {
				'ramka-svelte': '../../packages/ramka/src/lib'
			},
			prerender: {
				// The docs nav links every page of the original site, and some are
				// ported separately. Every /docs page is ported, so a 404 there is a
				// broken link; elsewhere, report a page that is not ported yet
				// instead of failing the build.
				handleHttpError: ({ status, path, referrer, message }) => {
					// Dev-only debug pages 404 in production, so no file is written.
					if (status === 404 && path.startsWith('/debug/')) return;
					if (status === 404 && !path.startsWith('/docs/')) {
						console.warn(`Not ported yet: ${path} (linked from ${referrer})`);
						return;
					}
					throw new Error(message);
				}
			}
		})
	]
});
