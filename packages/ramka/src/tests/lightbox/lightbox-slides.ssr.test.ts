// Port of ramka's lightbox-slides-ssr.test.tsx (`@vitest-environment node`;
// here the `server` project).
//
// Server rendering of an OPEN lightbox — the SSR initial-slide feature
// (ssr-initial-slide.ts). Runs under node to exercise the real server
// environment (the Item stamp is gated on `!BROWSER`, which `svelte/server`
// builds serve).
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';

import SsrShiftGallery from './fixtures/slides/SsrShiftGallery.svelte';

function renderOpenGallery(options: {
	ssrSlideShift?: boolean;
	dir?: 'ltr' | 'rtl';
	activeIndex?: number;
}): string {
	const { ssrSlideShift, dir, activeIndex = 2 } = options;
	const { head, body } = render(SsrShiftGallery, {
		props: { ssrSlideShift, dir, activeIndex, container: null }
	});
	// Svelte: `<svelte:head>` output comes back separately; join it with the
	// body so the string carries everything React's renderToString emits.
	return head + body;
}

/** Attribute region (up to `>`) of the first tag carrying the given marker. */
function tagAttrs(html: string, marker: string): string {
	const start = html.indexOf(marker);
	expect(start, `${marker} in server HTML`).toBeGreaterThan(-1);
	const open = html.lastIndexOf('<', start);
	// Svelte: the style attribute is the component's string verbatim
	// (`--lightbox-ssr-index: 2;`); React serializes style objects as
	// `prop:value`. Drop the insignificant whitespace after `:` to compare.
	return html.slice(open, html.indexOf('>', start)).replace(/:\s+/g, ':');
}

describe('LightboxSlides server rendering (SSR-open pages)', () => {
	it('ssrSlideShift stamps the scrollport with the shift attribute, index, sign, and freeze', () => {
		const html = renderOpenGallery({ ssrSlideShift: true });
		const scrollport = tagAttrs(html, 'data-ramka-slides');

		expect(scrollport).toContain('data-ssr-shift');
		expect(scrollport).toContain('--lightbox-ssr-index:2');
		// LTR shifts left.
		expect(scrollport).toContain('--lightbox-ssr-shift-sign:-1');
		// Not a scroll container at all while slides are translated — `clip`, on
		// BOTH axes (single-axis clip computes to hidden next to a scrollable
		// value). `hidden` isn't enough: it still freezes swipes, but the box
		// stays programmatically scrollable and Gecko restores element scroll
		// offsets across reloads BEFORE first paint — restored offset + transform
		// double-shifted the track (Firefox painted slide 2×index, or the blank
		// region past the preload window). `clip` pins scrollLeft at 0 until the
		// retire commit makes the box a scroller again and writes the real offset.
		expect(scrollport).toContain('overflow-x:clip');
		expect(scrollport).toContain('overflow-y:clip');
		// Snap must be off while slides are translated: the hydration jump writes
		// the real scrollLeft under the shift, and engines with snap-target
		// tracking (Chromium) would capture the slide *visually* at that offset —
		// slide 2×index — then re-align to it when the transform leaves.
		expect(scrollport).toContain('scroll-snap-type:none');
	});

	it('ssrSlideShift flips the sign under RTL', () => {
		const html = renderOpenGallery({ ssrSlideShift: true, dir: 'rtl' });
		expect(tagAttrs(html, 'data-ramka-slides')).toContain('--lightbox-ssr-shift-sign:1');
	});

	// Svelte: React 19+ only in the original (`it.runIf(REACT_SUPPORTS_STYLE_HOISTING)`,
	// react-style-hoisting.ts). Root renders the rules through `<svelte:head>`
	// on every Svelte version, so the case always runs.
	it('ships the initial-slide rules as a hoisted <style>', () => {
		const html = renderOpenGallery({ ssrSlideShift: true });
		// Strategy 1: browser-computed initial scroll for any layout.
		expect(html).toContain('[data-ssr-active]{scroll-initial-target:nearest;}');
		// Strategy 2 suppresses strategy 1 — both applying would double-shift.
		expect(html).toContain('[data-ssr-shift] [data-ssr-active]{scroll-initial-target:none;}');
		// Strategy 2: the transform shift, sign- and gap-aware.
		expect(html).toContain('[data-ssr-shift] [data-ramka-slide]{transform:translateX(calc(');
		expect(html).toContain('var(--lightbox-ssr-slide-gap,0px)');
	});

	it('stamps data-ssr-active on the active item only — with or without the shift', () => {
		for (const ssrSlideShift of [true, false]) {
			const html = renderOpenGallery({ ssrSlideShift });
			// `data-index` is the stable per-item marker in the markup.
			expect(tagAttrs(html, 'data-index="2"')).toContain('data-ssr-active');
			expect(tagAttrs(html, 'data-index="1"')).not.toContain('data-ssr-active');
			expect(tagAttrs(html, 'data-index="3"')).not.toContain('data-ssr-active');
		}
	});

	it('renders no shift markup without the opt-in', () => {
		const html = renderOpenGallery({ ssrSlideShift: false });
		// The rules text always ships (it also carries scroll-initial-target), so
		// assert on the scrollport's attributes, not the whole document.
		const scrollport = tagAttrs(html, 'data-ramka-slides');
		expect(scrollport).not.toContain('data-ssr-shift');
		expect(scrollport).not.toContain('--lightbox-ssr-index');
	});
});
