import { highlightCode, type CodeLang } from './highlight-code';
import type { SourceFile, SourceFileGroup } from '#lib/components/source-file.js';

/**
 * Highlight source files for a preview's Code card. Pass the raw text with a
 * Vite `?raw` import (`import code from './Gallery.svelte?raw'`), so the files
 * resolve from the route itself whatever the working directory. Server only:
 * Shiki runs at prerender and never ships to the browser.
 */
export async function readSourceFiles(
	files: Array<{
		/** Display name in the file tab (e.g. `Gallery.svelte`). */
		name: string;
		code: string;
		lang?: CodeLang;
		group?: SourceFileGroup;
		note?: string;
	}>
): Promise<SourceFile[]> {
	return Promise.all(
		files.map(async (file) => {
			const lang = file.lang ?? langFromName(file.name);
			const html = await highlightCode(file.code, lang);
			return { name: file.name, code: file.code, html, lang, group: file.group, note: file.note };
		})
	);
}

function langFromName(name: string): CodeLang {
	if (name.endsWith('.css')) return 'css';
	if (name.endsWith('.json')) return 'json';
	if (name.endsWith('.ts')) return 'typescript';
	if (name.endsWith('.js')) return 'javascript';
	return 'svelte';
}
