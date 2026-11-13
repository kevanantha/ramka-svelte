/** A code sample highlighted at build time (`import x from 'excerpt:…'`). */
export interface Excerpt {
	title: string;
	/** Raw source, for the clipboard. */
	code: string;
	/** Shiki dual-theme HTML. */
	html: string;
}

export interface DocsTocItem {
	id: string;
	title: string;
	children?: DocsTocItem[];
}

export interface PagerLink {
	href: string;
	title: string;
}

export type SourceFileGroup = 'package' | 'example';

/** One file tab in a ComponentSource card. */
export interface SourceFile extends Excerpt {
	/** Tab label, e.g. `Lightbox.svelte`. */
	name: string;
	/** `package` (copy-paste skin) or `example` (app composition). */
	group?: SourceFileGroup;
	/** Short note shown while this file is active. */
	note?: string;
}
