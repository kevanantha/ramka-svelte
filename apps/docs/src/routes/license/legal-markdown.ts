import { Marked } from 'marked';

/**
 * Licensing documents are maintained next to the package, so the text on the
 * site and the text shipped with the library are the same file. Server only:
 * rendered to HTML at prerender with the site's typography.
 */

/** Clause ids are derived from headings so new sections get anchors for free. */
export function anchorId(heading: string): string {
	return heading
		.replace(/^\d+\.\s*/, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

/** Split off the `# ` title, which the page renders as its own heading. */
export function splitTitle(source: string, name: string): { title: string; body: string } {
	const title = /^#[ \t]+(.+)$/m.exec(source);
	if (!title?.[1]) throw new Error(`${name} must open with a "# " title`);
	return { title: title[1], body: source.slice(title.index + title[0].length) };
}

// Headings carry the spacing that would otherwise sit on hand-written section
// wrappers, so the rhythm survives the flat structure Markdown produces.
const headingClass =
	'mt-12 scroll-mt-8 text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50';
// A step larger than the body copy, so the section a passage belongs to is
// legible at a glance rather than by weight alone.
const subheadingClass =
	'mt-8 scroll-mt-8 text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100';
const bodyClass = 'mt-4 text-[15px] leading-7 text-neutral-600 dark:text-neutral-400';
const listClass =
	'mt-4 space-y-1 pl-5 text-[15px] leading-7 text-neutral-600 dark:text-neutral-400';
// Defined terms carry the body colour's darker sibling, so the word being
// defined is findable when skimming without turning the list into headings.
const definedTermClass = 'font-semibold text-neutral-900 dark:text-neutral-100';
const linkClass =
	'underline decoration-neutral-300 underline-offset-2 transition hover:decoration-neutral-500 dark:decoration-neutral-700 dark:hover:decoration-neutral-500';

const escape = (text: string) =>
	text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const marked = new Marked({
	renderer: {
		heading({ tokens, depth }) {
			const inner = this.parser.parseInline(tokens);
			// The id comes from the heading's plain text runs only; inline code
			// and emphasis drop out, as in the original's `textOf(children)`.
			const id = anchorId(
				tokens
					.filter((t) => t.type === 'text')
					.map((t) => t.raw)
					.join('')
			);
			if (depth === 3) return `<h3 id="${id}" class="${subheadingClass}">${inner}</h3>`;
			return `<h2 id="${id}" class="${headingClass}">${inner}</h2>`;
		},
		paragraph({ tokens }) {
			return `<p class="${bodyClass}">${this.parser.parseInline(tokens)}</p>`;
		},
		list(token) {
			const tag = token.ordered ? 'ol' : 'ul';
			const items = token.items.map((item) => this.listitem(item)).join('');
			const style = token.ordered ? 'list-decimal' : 'list-disc';
			return `<${tag} class="${style} ${listClass}">${items}</${tag}>`;
		},
		listitem(item) {
			return `<li class="pl-0.5">${this.parser.parse(item.tokens)}</li>`;
		},
		strong({ tokens }) {
			return `<strong class="${definedTermClass}">${this.parser.parseInline(tokens)}</strong>`;
		},
		link({ href, tokens }) {
			return `<a href="${href}" class="${linkClass}">${this.parser.parseInline(tokens)}</a>`;
		},
		// A step above the docs' text-xs: monospace at 12px reads undersized
		// beside 15px Inter.
		codespan({ text }) {
			return `<code class="text-[13px]">${text}</code>`;
		},
		// Verbatim blocks are quoted license text, not code to be read for
		// syntax, so they get a quiet frame. The child selector walks back the
		// inline `code` size above, which would otherwise apply in here too.
		code({ text }) {
			return `<pre class="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 p-5 text-xs leading-6 text-neutral-500 dark:border-neutral-800 dark:text-neutral-400 [&>code]:text-xs"><code class="text-[13px]">${escape(text)}</code></pre>`;
		}
	}
});

export function renderLegalMarkdown(markdown: string): string {
	return marked.parse(markdown, { async: false });
}
