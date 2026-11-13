import { MEDIA_FILL_CSS } from './media-fill';
import { MORPH_TARGET_HIDE_CSS } from './morph-target-hide';
import { SSR_INITIAL_SLIDE_CSS, SSR_INITIAL_SLIDE_HREF } from './ssr-initial-slide';

// ---------------------------------------------------------------------------
// Markup copies of the rules a server-rendered OPEN lightbox needs on its
// first paint, before any client code has run: media fill (Media's fit-box),
// the active trigger's hide (`data-morph-target`), and the SSR initial slide.
// The first two also arrive as CSSOM sheets on the client, which CSP never
// polices; these tags are the server-paint path, and a strict `style-src`
// accepts them only with the page's nonce (`Lightbox.CSPProvider`).
//
// `Lightbox.Root` renders them into `<svelte:head>` when it is open at
// creation — the only case with a server paint to style — so closed galleries
// add nothing to the document. The text is constant, so hash-based policies
// can allowlist it.
// ---------------------------------------------------------------------------

const SERVER_PAINT_STYLES: ReadonlyArray<readonly [id: string, css: string]> = [
	['ramka-media-fill', MEDIA_FILL_CSS],
	['ramka-morph-target-hide', MORPH_TARGET_HIDE_CSS],
	[SSR_INITIAL_SLIDE_HREF, SSR_INITIAL_SLIDE_CSS]
];

function escapeAttribute(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** The `<style>` tags as HTML, stamped with `nonce` when given. */
function serverPaintStyleTags(nonce: string | undefined): string {
	const nonceAttribute = nonce ? ` nonce="${escapeAttribute(nonce)}"` : '';
	return SERVER_PAINT_STYLES.map(
		([id, css]) => `<style data-ramka-style="${id}"${nonceAttribute}>${css}</style>`
	).join('');
}

export { serverPaintStyleTags };
