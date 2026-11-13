// ---------------------------------------------------------------------------
// Structural fill for a direct media child of `Lightbox.Media`. HTML
// `width`/`height` are presentational hints that defeat Grid stretch; this
// author rule beats them without cloning children.
//
// `min-width/min-height: 0` overrides Grid's default `min-*: auto` so a broken
// WebKit `<img>` (square content minimum) cannot overflow the fit-box.
// `:not(#_)` adds id-level specificity so consumer CSS cannot accidentally
// outrank the rule and collapse the fit-box. Constant text, so one copy
// serves every Media (see server-paint-styles.ts for the markup copy).
// ---------------------------------------------------------------------------

/** Marker for the `<style>` fallback in environments without CSSOM sheets. */
const MEDIA_FILL_MARKER = 'data-ramka-media-fill';

const MEDIA_FILL_HOST = '[data-ramka-media]:not(#_)';
const MEDIA_FILL_CSS =
	`${MEDIA_FILL_HOST} > img:not([data-ramka-media-poster]),` +
	`${MEDIA_FILL_HOST} > video,${MEDIA_FILL_HOST} > canvas{` +
	`width:100%;height:100%;min-width:0;min-height:0;` +
	`}`;

export { MEDIA_FILL_CSS, MEDIA_FILL_MARKER };
