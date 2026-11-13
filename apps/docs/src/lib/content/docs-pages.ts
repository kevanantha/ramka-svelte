/** Lightbox docs IA: the left-nav pages under Lightbox. */
export const lightboxDocsPages = {
	overview: { href: '/docs/lightbox', title: 'Overview' },
	stateLifecycle: { href: '/docs/lightbox/state-lifecycle', title: 'State & lifecycle' },
	composition: { href: '/docs/lightbox/composition', title: 'Composition' },
	sveltekitImage: { href: '/docs/lightbox/sveltekit-image', title: 'SvelteKit images' },
	viewTransitions: { href: '/docs/lightbox/view-transitions', title: 'View transitions' },
	gestures: { href: '/docs/lightbox/gestures', title: 'Gestures' },
	zoom: { href: '/docs/lightbox/zoom', title: 'Zoom & a11y' },
	rtl: { href: '/docs/lightbox/rtl', title: 'RTL support' },
	csp: { href: '/docs/lightbox/csp', title: 'Content Security Policy' },
	api: { href: '/docs/lightbox/api', title: 'API reference' }
} as const;

const api = lightboxDocsPages.api.href;

/** Deep links into `/docs/lightbox/api` part sections. */
export const lightboxApiHref = {
	root: `${api}#api-root`,
	trigger: `${api}#api-trigger`,
	portal: `${api}#api-portal`,
	content: `${api}#api-content`,
	stage: `${api}#api-stage`,
	backdrop: `${api}#api-backdrop`,
	close: `${api}#api-close`,
	item: `${api}#api-item`,
	media: `${api}#api-media`,
	slides: `${api}#api-slides`,
	slide: `${api}#api-slide`,
	previous: `${api}#api-previous`,
	next: `${api}#api-next`,
	counter: `${api}#api-counter`,
	caption: `${api}#api-caption`,
	thumbnailGroup: `${api}#api-thumbnail-group`,
	thumbnail: `${api}#api-thumbnail`,
	thumbnailStrip: `${api}#api-thumbnail-strip`,
	thumbnailStripTrack: `${api}#api-thumbnail-strip-track`,
	zoom: `${api}#api-zoom`,
	zoomIn: `${api}#api-zoom-in`,
	zoomOut: `${api}#api-zoom-out`,
	cspProvider: `${api}#api-csp-provider`,
	documentVt: `${api}#api-view-transition-document`,
	types: `${api}#types`,
	getTriggerContext: `${api}#api-get-trigger-context`,
	getItemContext: `${api}#api-get-item-context`,
	getZoomContext: `${api}#api-get-zoom-context`,
	createHandle: `${api}#api-create-handle`
} as const;
