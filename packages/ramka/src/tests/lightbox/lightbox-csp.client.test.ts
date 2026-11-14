// Client-side (jsdom) CSP nonce delivery. Unlike the server path — which
// only emits the nonce when the render call is also configured with it
// (lightbox-csp.test.tsx) — client-inserted hoistables carry the nonce prop
// unconditionally. This is the path that matters on frameworks that cannot
// pass a style nonce to the server render yet (Next.js, vercel/next.js#76317):
// every client-side open still injects nonce'd tags that pass a strict CSP.
//
// Svelte: there are no React 19 hoistables (react-style-hoisting.ts). The
// port's tags are the server-paint `<style data-ramka-style>` copies an
// open-at-creation Root renders through `<svelte:head>` (server-paint-styles.ts),
// so `style[data-precedence]` maps to `style[data-ramka-style]` and the
// React-19 `describe.runIf` gate is dropped.
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CSPGallery from './fixtures/misc/CSPGallery.svelte';
import MediaFixture from './fixtures/misc/MediaFixture.svelte';
import { render } from './test-utils';

const NONCE = 'client-nonce-value';

beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
	if (!window.matchMedia) {
		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			configurable: true,
			value: vi.fn().mockImplementation((query: string) => ({
				matches: false,
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn()
			}))
		});
	}
});

function hoistedStyles() {
	return Array.from(document.head.querySelectorAll('style[data-ramka-style]'));
}

describe('Lightbox.CSPProvider (client-inserted hoistables)', () => {
	it('stamps the nonce on the Media fill tag', () => {
		// Svelte: Media renders no tag of its own (its client copy is a CSSOM
		// sheet); the fill tag is the open Root's, so Media sits in an open Root.
		render(MediaFixture, { nonce: NONCE, inOpenRoot: true });
		const hoisted = hoistedStyles();
		expect(hoisted.length).toBeGreaterThan(0);
		for (const tag of hoisted) {
			expect(tag.getAttribute('nonce')).toBe(NONCE);
		}
	});

	it('stamps the nonce on every hoistable a full open gallery inserts (Trigger, Slides, Media)', () => {
		render(CSPGallery, {
			nonce: NONCE,
			value: 0,
			items: 1,
			mediaHeight: 533,
			ssrSlideShift: true,
			src: () => '/photo.jpg'
		});
		const hoisted = hoistedStyles();
		const css = hoisted.map((tag) => tag.textContent ?? '').join('\n');
		// All three rule sets are present…
		expect(css).toContain('[data-ramka-media]:not(#_)'); // media fill
		expect(css).toContain('[data-morph-target]'); // active-trigger hide
		expect(css).toContain('scroll-initial-target'); // SSR initial slide
		// …and every tag carries the nonce.
		for (const tag of hoisted) {
			expect(tag.getAttribute('nonce')).toBe(NONCE);
		}
	});
});
