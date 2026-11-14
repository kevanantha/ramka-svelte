import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { slowImage } from './src/lib/server/slow-image';

export default defineConfig({
	plugins: [
		tailwindcss(),
		// /api/slow-image for the debug and guide demos (dev + preview only).
		slowImage(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			prerender: {
				// Pages link the original's /docs/* routes before every one is
				// ported; warn instead of failing the build on those.
				handleHttpError: ({ status, path, referrer, message }) => {
					if (status === 404 && path.startsWith('/docs/')) {
						console.warn(`[prerender] ${path} (linked from ${referrer}) is not ported yet`);
						return;
					}
					// Dev-only debug pages 404 in production, so no file is written.
					if (status === 404 && path.startsWith('/debug/')) return;
					throw new Error(message);
				}
			},
			// Compile the library from source instead of its packaged `dist`.
			// Re-packaging rewrites every dist file at once, which left the dev
			// server serving several copies of one module (each with its own
			// context key) and broke hydration with a 500.
			alias: {
				'ramka-svelte': '../../packages/ramka/src/lib'
			}
		})
	]
});
