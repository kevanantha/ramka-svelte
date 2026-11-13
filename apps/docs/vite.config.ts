import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
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
			}
		})
	]
});
