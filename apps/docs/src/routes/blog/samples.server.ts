import { highlightCode, type CodeLang } from '#lib/server/highlight-code.js';

export type CodeSample = { code: string; html: string };

/** Highlight an article's code samples at prerender (Shiki never ships to the browser). */
export async function highlightSamples<K extends string>(
	samples: Record<K, { code: string; lang?: CodeLang }>
): Promise<Record<K, CodeSample>> {
	const entries = await Promise.all(
		Object.entries<{ code: string; lang?: CodeLang }>(samples).map(
			async ([key, { code, lang }]) => [key, { code, html: await highlightCode(code, lang) }]
		)
	);
	return Object.fromEntries(entries);
}
