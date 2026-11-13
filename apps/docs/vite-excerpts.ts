/**
 * Docs code excerpts, highlighted at build time.
 *
 *   import anatomy from 'excerpt:excerpts/anatomy.svelte';
 *   <CodeBlock excerpt={anatomy} />
 *
 * The specifier is a path under `src/lib/`. The module's default export is
 * `{ title, code, html }`: `code` is what Copy puts on the clipboard, `html` is
 * Shiki's dual-theme markup (github-light / github-dark as CSS variables, see
 * layout.css). Shiki runs in Node only — pages ship the finished HTML.
 *
 * Excerpt sources are ordinary files that the site type-checks (`.svelte`
 * samples compile against ramka-svelte; CSS samples are the stylesheets the
 * demos load), marked up with comments:
 *
 *   - `@docs-excerpt-title <title>` on any line — the code block's title.
 *   - `@docs-excerpt-start` … `@docs-excerpt-end` — show only that region.
 *   - `@docs-hide-start` … `@docs-hide-end`, or `@docs-hide` on one line —
 *     drop lines that only exist to make the sample compile.
 *   - `// @docs-replace <text>` at the end of a line shows `<text>` instead
 *     (e.g. a `./photo.jpg` import where the site imports from its assets).
 *   - A CSS file whose header comment holds `@docsExcerpt` shows the body
 *     after that comment.
 *
 * Append `?lang=<lang>` to override the language picked from the extension.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHighlighter, type BundledLanguage, type Highlighter } from 'shiki';
import type { Plugin } from 'vite';

const PREFIX = 'excerpt:';
const RESOLVED = '\0excerpt:';

const langs = ['svelte', 'typescript', 'javascript', 'bash', 'json', 'css', 'html', 'tsx'] as const;
type Lang = (typeof langs)[number];

const extLang: Record<string, Lang> = {
	'.svelte': 'svelte',
	'.ts': 'typescript',
	'.js': 'javascript',
	'.sh': 'bash',
	'.json': 'json',
	'.css': 'css',
	'.html': 'html',
	'.txt': 'tsx'
};

let highlighter: Promise<Highlighter> | null = null;

/** Same Shiki setup as the original docs' highlight-code.ts. */
export async function highlightCode(code: string, lang: string): Promise<string> {
	highlighter ??= createHighlighter({ themes: ['github-light', 'github-dark'], langs: [...langs] });
	return (await highlighter).codeToHtml(code.replace(/\n$/, ''), {
		lang: lang as BundledLanguage,
		themes: { light: 'github-light', dark: 'github-dark' },
		defaultColor: false
	});
}

const marker = (name: string) =>
	new RegExp(String.raw`(?:<!--|/\*|//)\s*${name}\b(.*?)(?:-->|\*/)?\s*$`);
const TITLE = marker('@docs-excerpt-title');
const START = marker('@docs-excerpt-start');
const END = marker('@docs-excerpt-end');
const HIDE_START = marker('@docs-hide-start');
const HIDE_END = marker('@docs-hide-end');
const HIDE_LINE = /@docs-hide\b(?!-)/;
const REPLACE = /^(\s*).*?(?:\/\/|<!--)\s*@docs-replace\s+(.*?)(?:\s*-->)?$/;

export function extractExcerpt(source: string): { title: string; code: string } {
	let lines = source.replace(/\r\n/g, '\n').split('\n');
	let title = '';

	// Whole-file CSS excerpt: drop the header comment that carries the tags.
	const header = source.match(/^\/\*\*[\s\S]*?\*\/\n/);
	if (header && header[0].includes('@docsExcerpt')) {
		title = header[0].match(/@docsExcerptTitle\s+(.+)/)?.[1]?.trim() ?? '';
		lines = source.slice(header[0].length).split('\n');
	}

	const start = lines.findIndex((l) => START.test(l));
	if (start !== -1) {
		const end = lines.findIndex((l, i) => i > start && END.test(l));
		lines = lines.slice(start + 1, end === -1 ? undefined : end);
	}

	const out: string[] = [];
	let hiding = false;
	for (const line of lines) {
		const t = line.match(TITLE);
		if (t) {
			title = t[1]!.trim();
			continue;
		}
		if (HIDE_START.test(line)) {
			hiding = true;
			continue;
		}
		if (HIDE_END.test(line)) {
			hiding = false;
			continue;
		}
		if (hiding || HIDE_LINE.test(line)) continue;
		const replaced = line.match(REPLACE);
		out.push(replaced ? replaced[1]! + replaced[2]! : line);
	}

	// Prettier writes tabs; the samples read as two-space indents, like the
	// original docs.
	let text = out
		.join('\n')
		.replace(/^\t+/gm, (tabs) => '  '.repeat(tabs.length))
		// A script block emptied by hidden lines disappears with them.
		.replace(/<script[^>]*>\s*<\/script>\s*/g, '')
		.replace(/\n{3,}/g, '\n\n');
	const indents = text
		.split('\n')
		.filter((l) => l.trim())
		.map((l) => l.match(/^ */)![0].length);
	const min = indents.length ? Math.min(...indents) : 0;
	text = text
		.split('\n')
		.map((l) => l.slice(min))
		.join('\n')
		.trim();
	return { title, code: `${text}\n` };
}

export function excerpts({ root }: { root: string }): Plugin {
	return {
		name: 'docs-excerpts',
		enforce: 'pre',
		resolveId(id) {
			// The path is encoded so no file extension shows: vite-plugin-svelte
			// would otherwise compile a `.svelte` sample as a component.
			if (id.startsWith(PREFIX))
				return RESOLVED + Buffer.from(id.slice(PREFIX.length)).toString('base64url');
		},
		async load(id) {
			if (!id.startsWith(RESOLVED)) return;
			const spec = Buffer.from(id.slice(RESOLVED.length), 'base64url').toString();
			const [file, query = ''] = spec.split('?');
			const full = path.resolve(root, file!);
			this.addWatchFile(full);
			const source = await readFile(full, 'utf8');
			const { title, code } = extractExcerpt(source);
			const lang = new URLSearchParams(query).get('lang') ?? extLang[path.extname(full)] ?? 'tsx';
			const html = await highlightCode(code, lang);
			return `export default ${JSON.stringify({ title, code, html })};`;
		}
	};
}
