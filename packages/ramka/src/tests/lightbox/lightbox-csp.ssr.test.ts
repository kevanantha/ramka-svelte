// CSP nonce delivery for the hoistable <style> tags (lightbox-csp.tsx).
// React 19.2's contract: hoisted styles carry a nonce only when the SAME
// value arrives twice — on the <style> element (via Lightbox.CSPProvider)
// AND on the server render call (`renderToReadableStream(el, { nonce:
// { style } })`). `renderToString` has no nonce option, so these tests render
// through the stream API.
//
// Svelte: `svelte/server`'s `render` has no nonce option and needs none — the
// port stamps the provider's nonce itself on the server-paint tags an open
// Root writes into `<svelte:head>` (server-paint-styles.ts). The document is
// `head + body`; the React-19 `describe.runIf` gate is dropped.
import { describe, expect, it } from 'vitest';
import { renderToString } from './ssr-test-utils';

import CSPGallery from './fixtures/misc/CSPGallery.svelte';
import DetachedTriggerCSP from './fixtures/misc/DetachedTriggerCSP.svelte';

const NONCE = 'test-nonce-value';

/** An open gallery exercising all three hoistable-style owners (Trigger, Slides, Media). */
const openGallery = { value: 1, items: 2, mediaHeight: 600, inPlace: true };

const renderToHtml = renderToString;
// Svelte: the provider alone carries the nonce (no render-call option).
const renderWithStyleNonce = renderToString;

/** Attribute region (up to `>`) of every `<style>` tag in the document. */
function styleTagAttrs(html: string): string[] {
	return Array.from(html.matchAll(/<style[^>]*/g), (m) => m[0]);
}

describe('Lightbox.CSPProvider (hoistable style nonce)', () => {
	it('stamps the nonce on the hoisted style tags when provider and render option agree', () => {
		const html = renderWithStyleNonce(CSPGallery, { props: { ...openGallery, nonce: NONCE } });

		const tags = styleTagAttrs(html);
		expect(tags.length).toBeGreaterThan(0);
		for (const tag of tags) {
			expect(tag).toContain(`nonce="${NONCE}"`);
		}
		// Assert the RULE TEXTS, not DOM markers: under a nonce-configured render
		// React silently DROPS any same-precedence hoistable whose element is
		// missing the nonce (verified empirically — it logs an error and omits
		// the rule), so a component that forgets to stamp would vanish here.
		expect(html).toContain('[data-ramka-media]:not(#_)'); // Media fill
		expect(html).toContain('[data-morph-target]'); // Trigger hide
		expect(html).toContain('scroll-initial-target'); // Slides initial slide
	});

	it('covers a detached Trigger outside any Root — the reason CSPProvider is not a Root prop', () => {
		// Svelte: the hide rule is the open Root's server-paint tag, not the
		// Trigger's own, so the detached Trigger renders next to (outside) the
		// open Root it is bound to, both under the one provider.
		const html = renderWithStyleNonce(DetachedTriggerCSP, { props: { nonce: NONCE } });

		// The detached trigger ships the morph-target-hide hoistable, nonce'd.
		expect(html).toContain('[data-morph-target]');
		for (const tag of styleTagAttrs(html)) {
			expect(tag).toContain(`nonce="${NONCE}"`);
		}
	});

	it('renders un-nonced tags without a provider (the pre-CSP baseline)', () => {
		const html = renderToHtml(CSPGallery, { props: openGallery });
		const tags = styleTagAttrs(html);
		expect(tags.length).toBeGreaterThan(0);
		for (const tag of tags) {
			expect(tag).not.toContain('nonce');
		}
	});
});
