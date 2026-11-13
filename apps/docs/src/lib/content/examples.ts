export interface ExampleLink {
	slug: string;
	title: string;
	description: string;
}

/**
 * Example pages under `/examples/lightbox/<slug>` (descriptions as in the
 * original; the example pages are ported separately).
 */
export const lightboxExamples: ExampleLink[] = [
	{
		slug: 'photos-app',
		title: 'Photos app',
		description:
			'macOS Photos–style square grid under a sticky, blurred toolbar with a fade gradient and "Library" title.'
	},
	{
		slug: 'photos-app-rtl',
		title: 'Photos app (RTL)',
		description:
			'The same photos app mirrored for a right-to-left locale — dir="rtl" on Lightbox.Root mirrors navigation, the thumbnail strip, and the arrow keys.'
	},
	{
		slug: 'infinite-scroll',
		title: 'Infinite scroll',
		description:
			'An endless feed where the lightbox paginates too — one photo array drives grid tiles and slides; the grid loads pages via an IntersectionObserver sentinel, and onValueChange fetches ahead inside the open viewer, appending slides to the native scroll-snap track with a minimal Previous/Next chrome (no thumbnails).'
	},
	{
		slug: 'url-synced-state',
		title: 'URL-synced state',
		description:
			'Masonry wall wired to Next.js dynamic routes ([[...id]]) — every photo is a shareable URL: deep links open the viewer on that slide, swiping rewrites the URL in place, and browser Back closes the viewer.'
	},
	{
		slug: 'intercepted-routes',
		title: 'Intercepted routes',
		description:
			'The nextgram pattern: grid of plain Links, a @modal parallel-route slot, and an (.)photos/[id] intercepting route mounting an already-open controlled lightbox — Back closes it, hard loads get a standalone photo page (one URL, two presentations).'
	},
	{
		slug: 'text-message',
		title: 'Text message',
		description:
			'iMessage-style chat with a single morphTo="origin" trigger over a stack of attachments.'
	},
	{
		slug: 'film-trailers',
		title: 'Film trailers',
		description: 'Movie posters morph into a fullscreen <video> that auto-plays on becoming active.'
	},
	{
		slug: '3d-models',
		title: '3D models',
		description:
			'Three.js product grid with Lightbox.Slides — onBeforeOpen preheats GLBs before the morph; shared orbit with each trigger.'
	}
];
