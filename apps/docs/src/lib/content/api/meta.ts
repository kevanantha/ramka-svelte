/**
 * Hand-written API chrome for the Lightbox API page. Props, data attributes
 * and CSS variables are generated from the ramka-svelte sources into
 * `generated.ts` by `scripts/generate-lightbox-api.ts` (`pnpm docs:api`).
 *
 * Self-contained on purpose: the generator imports it under plain Node.
 */

/** File relative to packages/ramka/src/lib/lightbox/. */
export type EnumExtract = { enumName: string; file: string };

export type ExtractSpec =
	| {
			/** An interface in a `.svelte` file's `<script module>` or a `.ts` file. */
			kind: 'interface-props';
			typeName: string;
			file: string;
			exclude?: string[];
	  }
	| { kind: 'interface-members'; typeName: string; file: string; exclude?: string[] }
	| { kind: 'function-return'; functionName: string; file: string; rowName?: string }
	| { kind: 'none' };

export type ApiPartMeta = {
	id: string;
	name: string;
	description: string;
	extract: ExtractSpec;
	attributesFrom?: EnumExtract;
	cssVariablesFrom?: EnumExtract;
};

const attrs = (enumName: string): EnumExtract => ({
	enumName,
	file: 'lightbox-data-attributes.ts'
});
const vars = (enumName: string): EnumExtract => ({ enumName, file: 'lightbox-css-vars.ts' });
const props = (part: string, exclude?: string[]): ExtractSpec => ({
	kind: 'interface-props',
	typeName: `Lightbox${part}Props`,
	file: `Lightbox${part}.svelte`,
	...(exclude ? { exclude } : null)
});

export const lightboxApiMeta: ApiPartMeta[] = [
	{
		id: 'api-root',
		name: 'Root',
		description:
			'Groups all parts of the lightbox and owns open state, active index, view-transition morph, scroll locking, and the active-zoom bridge. Pass handle from Lightbox.createHandle() for imperative control and detached Triggers. Prefer onOpenChangeComplete for post-motion work; use scrollTriggerIntoView so close morphs land on-screen when the page scrolled while open.',
		extract: props('Root')
	},
	{
		id: 'api-trigger',
		name: 'Trigger',
		description:
			'Opens the lightbox at a given index and is the morph source (view transitions on by default). Carries the dialog-trigger disclosure semantics: aria-haspopup="dialog", aria-controls pointing at the dialog while open, and aria-expanded set only on the trigger that opened it. Pass handle + id to use outside Root or for handle.open(..., { triggerId }). Attach the children snippet’s image / morph attachments to designate the thumbnail image and morph element.',
		extract: props('Trigger'),
		attributesFrom: attrs('LightboxTriggerDataAttributes')
	},
	{
		id: 'api-portal',
		name: 'Portal',
		description:
			'Portals Backdrop and Content into a host element (default: document.body). Pass container / keepMounted here. keepMounted parks Backdrop+Content while closed (inert, hidden). When using keepMounted, style z-index on the Portal host yourself. Prefer isolation: isolate on the app layout root.',
		extract: props('Portal', ['class', 'style', 'ref']),
		attributesFrom: attrs('LightboxPortalDataAttributes')
	},
	{
		id: 'api-content',
		name: 'Content',
		description:
			'Dialog surface (role="dialog", aria-modal). Provide an accessible name via aria-label or aria-labelledby (required by the WAI-ARIA dialog pattern; the library warns in development if it is missing). Place inside Lightbox.Portal. Owns focus trap, Escape, and pull-to-dismiss. When Lightbox.Stage is mounted, gallery nav (arrows/Home/End), zoom shortcuts (unmodified +/-/0), pinch/ctrl+wheel zoom, and touch/wheel pull are scoped to Stage (and Zoom pan uses Stage as viewport); otherwise Content itself is the stage. Modified combos (⌘/Ctrl +, -, 0) are left to the browser for page zoom. Keyboard pan vs navigate depends on whether the active Zoom is above 1×.',
		extract: props('Content', ['class', 'style', 'ref']),
		attributesFrom: attrs('LightboxContentDataAttributes'),
		cssVariablesFrom: vars('LightboxContentCssVars')
	},
	{
		id: 'api-stage',
		name: 'Stage',
		description:
			'Optional media interaction surface inside Content. Scopes touch and trackpad wheel pull-to-dismiss, Zoom pan viewport geometry, arrow/Home/End gallery navigation, zoom shortcuts (unmodified +/-/0), and pinch/ctrl+wheel zoom to the media pane. Interactive controls inside Stage keep their press (Close, Prev/Next, etc.). Place side panels / threads as siblings of Stage under Content. When omitted, Content itself is the stage. Attach the children snippet’s morph attachment when the open/close morph should capture this surface (or a descendant) instead of the active item.',
		extract: props('Stage'),
		attributesFrom: attrs('LightboxStageDataAttributes')
	},
	{
		id: 'api-backdrop',
		name: 'Backdrop',
		description:
			'Optional scrim (place inside Lightbox.Portal, typically beside Content). Click closes the lightbox. Tracks pull-to-dismiss progress.',
		extract: props('Backdrop'),
		attributesFrom: attrs('LightboxBackdropDataAttributes'),
		cssVariablesFrom: vars('LightboxBackdropCssVars')
	},
	{
		id: 'api-close',
		name: 'Close',
		description:
			'Button that closes the lightbox. Ships no default label — give it visible text or pass aria-label / aria-labelledby in your language (the library warns in development when it is nameless).',
		extract: props('Close'),
		attributesFrom: attrs('LightboxCloseDataAttributes')
	},
	{
		id: 'api-item',
		name: 'Item',
		description:
			'A single lightbox item. Registers captions and morph/placeholder elements. ARIA adapts automatically: it is a tabpanel wired (aria-labelledby / aria-controls) to its Lightbox.Thumbnail tab when a Lightbox.ThumbnailGroup is present, otherwise role="group" — the APG standalone carousel slide, which needs a translated aria-roledescription="slide" and an aria-label carrying the position ("N of total") from you. Prefer nesting Lightbox.Media (sized morph + placeholder host) around the destination <img>/<video>; the children snippet’s image / morph attachments remain escape hatches. Typically nested inside Slide. Outside Slides, every item stays mounted; inside Slides, `preload` gates contents.',
		extract: props('Item'),
		attributesFrom: attrs('LightboxItemDataAttributes')
	},
	{
		id: 'api-media',
		name: 'Media',
		description:
			'Sized destination media host — morph target and placeholder canvas container. Structural props: width/height (fit-box, same idea as an <img> with width/height); display:grid plus a scoped <style> so direct img/video fill the box (HTML dimension attrs cannot pin intrinsic size). Cosmetics (radius, colors, object-fit) stay consumer-owned. Prefer Zoom > Media > img|video (Zoom is a size container for Media’s cqw/cqh fit-box; put resting chrome insets on Slide padding). Auto-discovers the primary <img> (or video poster) for decode / thumbnail bridging.',
		extract: props('Media'),
		attributesFrom: attrs('LightboxMediaDataAttributes')
	},
	{
		id: 'api-slides',
		name: 'Slides',
		description:
			'Default layout: horizontal snap carousel wired to the active index. Emits role="group" — the WAI-ARIA carousel container — and you pass the translated aria-roledescription="carousel" plus an aria-label / aria-labelledby naming the gallery (leave the word "carousel" out of the name; the roledescription already says it). Gates Item contents via `preload`; put Slide → Item → Zoom → Media inside. Consumer CSS sizes each Slide snap box (e.g. flex 0 0 100% for full-bleed); index geometry measures offsetLeft/offsetWidth. While the user is flinging, navigation is locked so pull-to-dismiss and zoom chrome do not fight the scroll.',
		extract: props('Slides', ['class']),
		attributesFrom: attrs('LightboxSlidesDataAttributes')
	},
	{
		id: 'api-slide',
		name: 'Slide',
		description:
			'One snap-aligned slide box inside Slides. Snap alignment (`scroll-snap-align`, `scroll-snap-stop`) is built in; slide width (full-bleed, aspect-sized cards, …) is consumer CSS — set `flex` / `width` / `min-width` via class or style. Place a Lightbox.Item (and typically Zoom → Media) inside. Prefer putting resting chrome / safe-area insets as padding on Slide (not Zoom) so Item/Zoom fill the content box and zoomed media can paint into the pad under chrome.',
		extract: { kind: 'none' },
		attributesFrom: attrs('LightboxSlideDataAttributes')
	},
	{
		id: 'api-previous',
		name: 'Previous',
		description: 'Navigate to the previous item. Disabled at the start when loop is false.',
		extract: props('Previous'),
		attributesFrom: attrs('LightboxPreviousDataAttributes')
	},
	{
		id: 'api-next',
		name: 'Next',
		description: 'Navigate to the next item. Disabled at the end when loop is false.',
		extract: props('Next'),
		attributesFrom: attrs('LightboxNextDataAttributes')
	},
	{
		id: 'api-counter',
		name: 'Counter',
		description: 'Shows the active position (e.g. "1 / 12") with an aria-live region.',
		extract: props('Counter'),
		attributesFrom: attrs('LightboxCounterDataAttributes')
	},
	{
		id: 'api-caption',
		name: 'Caption',
		description: 'Renders the active item’s caption from the Item caption registry.',
		extract: props('Caption'),
		attributesFrom: attrs('LightboxCaptionDataAttributes')
	},
	{
		id: 'api-thumbnail-group',
		name: 'ThumbnailGroup',
		description: 'Accessible tablist of thumbnails with arrow / Home / End keyboard support.',
		extract: props('ThumbnailGroup'),
		attributesFrom: attrs('LightboxThumbnailGroupDataAttributes')
	},
	{
		id: 'api-thumbnail',
		name: 'Thumbnail',
		description: 'A single thumbnail tab that activates the given index.',
		extract: props('Thumbnail'),
		attributesFrom: attrs('LightboxThumbnailDataAttributes')
	},
	{
		id: 'api-thumbnail-strip',
		name: 'ThumbnailStrip',
		description:
			'Scroll-linked thumbnail strip root. Always centers the active thumbnail on the midline (Photos-style): owns overflow clip, measured midline track padding (from registered Thumbnail nodes — not role=tab queries), and Slides→track sync via native ScrollTimeline + WAAPI (JS scroll→transform fallback when ScrollTimeline is unavailable). Compose with ThumbnailStripTrack + Thumbnails; optional midline selection chrome is plain consumer markup (strip root is position:relative). Discrete nav (pointer thumb, keyboard, Previous/Next) goes through ThumbnailStrip (DocumentTimeline WAAPI track scrub via scrubOnSelect; element-scoped Slides view transition on pointer select via selectViewTransition — tune with --lightbox-select-vt-duration / --lightbox-select-vt-easing on Slides; optional wrapSelectCommit(commit, slides, index) to arm consumer WAAPI such as an indicator scrub before the scroll jump). Keyboard / Previous / Next keep an instant stage commit while the strip still scrubs. Flex/gap/thumb size remain consumer CSS.',
		extract: props('ThumbnailStrip'),
		attributesFrom: attrs('LightboxThumbnailStripDataAttributes'),
		cssVariablesFrom: vars('LightboxThumbnailStripCssVars')
	},
	{
		id: 'api-thumbnail-strip-track',
		name: 'ThumbnailStripTrack',
		description:
			'Linked tablist track for ThumbnailStrip. A ThumbnailGroup that registers as the ScrollTimeline transform target (same keyboard / ARIA). Parent ThumbnailStrip writes midline padding + travel CSS var and owns the link animation; flex, gap, and thumb sizing are consumer CSS.',
		extract: props('ThumbnailStripTrack')
	},
	{
		id: 'api-zoom',
		name: 'Zoom',
		description:
			'Pinch, wheel, double-tap, and keyboard zoom/pan surface. Fills its host and is a CSS size container (`container-type: size`) for nested Media fit-box units. Does not set overflow (clipping belongs on Content / chrome so zoomed media can escape the resting box). Prefer Zoom > Media > img|video so pan/maxZoom use Media’s content box. Publishes to Root’s active-zoom bridge so ZoomIn/ZoomOut in toolbar chrome can target the active slide.',
		extract: props('Zoom'),
		attributesFrom: attrs('LightboxZoomDataAttributes')
	},
	{
		id: 'api-zoom-in',
		name: 'ZoomIn',
		description:
			'Increments zoom. Works inside Zoom, or as global chrome via the active-slide zoom bridge.',
		extract: props('ZoomIn'),
		attributesFrom: attrs('LightboxZoomInDataAttributes')
	},
	{
		id: 'api-zoom-out',
		name: 'ZoomOut',
		description:
			'Decrements zoom. Works inside Zoom, or as global chrome via the active-slide zoom bridge.',
		extract: props('ZoomOut'),
		attributesFrom: attrs('LightboxZoomOutDataAttributes')
	},
	{
		id: 'api-csp-provider',
		name: 'CSPProvider',
		description:
			'Provides the Content-Security-Policy nonce for the few inline <style> tags ramka renders (media fill, active-trigger hide, SSR initial slide). Wrap it around everything that renders lightbox parts — including detached Triggers outside any Root — and pass the same per-request nonce that your server puts in the style-src / style-src-elem directive. Without it, strict-CSP pages refuse those tags and the library falls back to CSSOM delivery after hydration (everything works; only server-paint niceties on SSR-open pages are lost).',
		extract: props('CSPProvider')
	}
];

export const documentViewTransitionMeta: ApiPartMeta = {
	id: 'api-view-transition-document',
	name: 'Document (view transitions)',
	description:
		'While a view-transition morph runs, ramka sets attributes and CSS variables on <html> so you can style ::view-transition-* pseudo-elements. Cleared when the transition finishes.',
	extract: { kind: 'none' },
	attributesFrom: attrs('LightboxDocumentDataAttributes'),
	cssVariablesFrom: vars('LightboxDocumentCssVars')
};

/** Svelte's equivalent of the original's hooks: context getters from `ramka-svelte`. */
export const contextsApiMeta: ApiPartMeta[] = [
	{
		id: 'api-get-trigger-context',
		name: 'getLightboxTriggerContext',
		description:
			'Optional context from the enclosing Trigger. Use in nested wrappers (e.g. a shared <TriggerImage>) to apply the image / morph attachments without threading the children snippet’s arguments.',
		extract: {
			kind: 'function-return',
			functionName: 'getLightboxTriggerContext',
			file: 'LightboxTrigger.svelte'
		}
	},
	{
		id: 'api-get-item-context',
		name: 'getLightboxItemContext',
		description:
			'Optional context from the enclosing Item. Use in nested wrappers to apply the image / morph attachments or read active/index. Prefer Lightbox.Media for the common morph/placeholder host.',
		extract: {
			kind: 'function-return',
			functionName: 'getLightboxItemContext',
			file: 'LightboxItem.svelte'
		}
	},
	{
		id: 'api-get-zoom-context',
		name: 'getLightboxZoomContext',
		description:
			'Optional context from the enclosing Zoom: its live zoom state plus the zoom actions listed under LightboxZoomContext.',
		extract: {
			kind: 'function-return',
			functionName: 'getLightboxZoomContext',
			file: 'LightboxZoom.svelte'
		}
	}
];

export const imperativeApiMeta: ApiPartMeta[] = [
	{
		id: 'api-create-handle',
		name: 'LightboxHandle',
		description:
			'Imperative handle from Lightbox.createHandle(). Pass to Root (and optional detached Triggers).',
		extract: {
			kind: 'interface-members',
			typeName: 'LightboxHandle',
			file: 'lightbox-handle.svelte.ts'
		}
	},
	{
		id: 'api-zoom-handle',
		name: 'LightboxZoomRef',
		description: 'Imperative handle from bind:this on Zoom.',
		extract: {
			kind: 'interface-members',
			typeName: 'LightboxZoomRef',
			file: 'LightboxZoom.svelte'
		}
	},
	{
		id: 'api-zoom-context',
		name: 'LightboxZoomContext',
		description:
			'Zoom state and actions from getLightboxZoomContext() inside a Zoom, for descendants such as in-slide controls. The state fields (zoom, maxZoom, canZoomIn, …) are also passed to Zoom’s children snippet.',
		extract: {
			kind: 'interface-members',
			typeName: 'LightboxZoomContext',
			file: 'LightboxZoom.svelte'
		}
	}
];

export const allApiMeta: ApiPartMeta[] = [
	...lightboxApiMeta,
	documentViewTransitionMeta,
	...contextsApiMeta,
	...imperativeApiMeta
];
