// The server case of lightbox-media.test.tsx (it called renderToString from a
// jsdom file). Svelte: server rendering needs server-compiled components,
// which only the `server` project produces, so it lives here under the same
// describe; the document is `head + body`.
import { describe, expect, it } from 'vitest';
import { renderToString } from './ssr-test-utils';

import MediaFixture from './fixtures/misc/MediaFixture.svelte';

const FILL_DECLARATIONS = 'width:100%;height:100%;min-width:0;min-height:0';

describe('LightboxMedia child fill rules', () => {
	it('serializes the fill rules into server HTML', () => {
		// A page that server-renders an open lightbox (deep links with
		// `Portal container={null}`) must letterbox correctly on the very first
		// paint — before hydration runs any effect. That only holds if the fill
		// rules exist in the server markup itself.
		// Svelte: the fill tag is the open Root's (server-paint-styles.ts), not
		// Media's own, so Media renders inside an open Root.
		const html = renderToString(MediaFixture, { props: { inOpenRoot: true } });
		expect(html).toContain(FILL_DECLARATIONS);
	});
});
