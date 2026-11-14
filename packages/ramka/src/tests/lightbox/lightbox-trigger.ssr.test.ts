// Server rendering of an OPEN lightbox (deep links rendering the Portal in
// place). Runs under node — no jsdom — to exercise the real server
// environment (the trigger's `data-morph-target` stamp is gated on
// `useIsServerPaint`, whose server snapshot renderToString serves in any
// environment).
//
// Svelte: rendered with `svelte/server`; the document is `head + body`.
import { describe, expect, it } from 'vitest';
import { renderToString } from './ssr-test-utils';

import StripSSR from './fixtures/misc/StripSSR.svelte';
import TriggerSSR from './fixtures/misc/TriggerSSR.svelte';

/** Attribute region (up to `>`) of the button tagged with the given testid. */
function buttonAttrs(html: string, testid: string): string {
	const chunk = html
		.split('<button')
		.slice(1)
		.find((c) => c.slice(0, c.indexOf('>')).includes(`data-testid="${testid}"`));
	expect(chunk, `button ${testid} in server HTML`).toBeTruthy();
	return chunk!.slice(0, chunk!.indexOf('>'));
}

describe('LightboxTrigger server rendering (SSR-open pages)', () => {
	it('stamps data-morph-target on the active trigger and ships the hide rule', () => {
		const html = renderToString(TriggerSSR, { props: { root: { open: true, value: 1 } } });

		// The active trigger is hidden from the very first paint: the attribute is
		// stamped on the trigger root (the server cannot know about morphRef
		// nodes; hydration re-syncs), and the hide rule rides along as a hoisted
		// <style>, so no effect has to run before the trigger disappears.
		expect(buttonAttrs(html, 'trigger-1')).toContain('data-morph-target');
		expect(buttonAttrs(html, 'trigger-0')).not.toContain('data-morph-target');
		expect(buttonAttrs(html, 'trigger-2')).not.toContain('data-morph-target');
		// Svelte: no React-19 hoisting gate — the open Root always ships the rule.
		expect(html).toContain('[data-morph-target]{opacity:0');
	});

	it('stamps the active trigger under morphTo="closest" (ref maps are empty on the server)', () => {
		// The client-side `closest` resolver walks the trigger-element ref map,
		// which never populates during server rendering — resolving through it
		// would stamp nothing and resurrect the un-hidden-trigger flash for
		// non-default configs. The stamp derives from `active` instead, which is
		// what `closest` resolves to after hydration whenever the active trigger
		// is registered (it is — it's in this same markup).
		const html = renderToString(TriggerSSR, {
			props: { root: { open: true, value: 2, morphTo: 'closest' } }
		});
		expect(buttonAttrs(html, 'trigger-2')).toContain('data-morph-target');
		expect(buttonAttrs(html, 'trigger-0')).not.toContain('data-morph-target');
	});

	it('stamps nothing under morphTo="origin" — a server render has no opening trigger', () => {
		const html = renderToString(TriggerSSR, {
			props: { root: { open: true, value: 1, morphTo: 'origin' } }
		});
		for (const i of [0, 1, 2]) {
			expect(buttonAttrs(html, `trigger-${i}`)).not.toContain('data-morph-target');
		}
	});

	it('does not stamp data-morph-target when server-rendered closed', () => {
		const html = renderToString(TriggerSSR, { props: { triggers: 1 } });
		expect(buttonAttrs(html, 'trigger-0')).not.toContain('data-morph-target');
	});
});

describe('LightboxThumbnailStrip server rendering (SSR-open pages)', () => {
	it('never serializes data-positioned — the server cannot position the track', () => {
		// `data-positioned` is the consumer's cue that the track has genuinely
		// been measured and placed against the Slides scroller, which requires
		// client layout. If it ever leaked into server HTML, CSS hiding the strip
		// until positioning would stop working and the pre-hydration strip would
		// paint at offset 0. Pin the absence.
		const html = renderToString(StripSSR);
		expect(html).toContain('data-ramka-thumbnail-strip');
		expect(html).not.toContain('data-positioned');
	});
});
