declare module 'excerpt:*' {
	/** A code sample highlighted at build time (see vite-excerpts.ts). */
	const excerpt: import('#lib/components/docs/types.js').Excerpt;
	export default excerpt;
}

declare module '*&aspect=1:1' {
	/** An `?enhanced` image re-cropped to 1∶1 (vite-imagetools `aspect`). */
	const value: import('@sveltejs/enhanced-img').Picture;
	export default value;
}

declare module '*&inline' {
	/** An inlined `data:` URL (vite-imagetools `inline`), e.g. a blurred LQIP. */
	const value: string;
	export default value;
}
