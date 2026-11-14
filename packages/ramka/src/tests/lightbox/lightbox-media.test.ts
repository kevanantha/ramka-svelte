// Svelte: there are no React 19 hoistables (react-style-hoisting.ts). Media's
// client delivery is `ensureLibrarySheet` (an adopted sheet in browsers, a
// marker-deduped `<style>` in jsdom); the server-paint copy is the open Root's
// `<svelte:head>` tag (server-paint-styles.ts). The React-19 `runIf` gates are
// dropped. The server case needs server-compiled components, so it lives in
// lightbox-media.ssr.test.ts under the same describe.
import { describe, expect, it } from 'vitest';

import MediaFixture from './fixtures/misc/MediaFixture.svelte';
import { render } from './test-utils';

const FILL_DECLARATIONS = 'width:100%;height:100%;min-width:0;min-height:0';

function headStyleText(): string {
	return Array.from(document.head.querySelectorAll('style'))
		.map((el) => el.textContent ?? '')
		.join('\n');
}

describe('LightboxMedia child fill rules', () => {
	it('hoists the fill rules into <head> on the client', () => {
		render(MediaFixture, { count: 1 });
		const css = headStyleText();
		expect(css).toContain('[data-ramka-media]');
		expect(css).toContain(FILL_DECLARATIONS);
	});

	it('dedupes the hoistable to one tag across many Media instances', () => {
		// The constant `href` + constant rule text is what makes the hoistable
		// sound: React 19 never removes precedence styles, so per-instance text
		// would leak one dead tag per viewer open. Pin the dedupe — N instances,
		// exactly one hoisted copy of the rule.
		render(MediaFixture, { count: 3 });
		// Svelte: no `data-precedence` hoistable; the once-per-document copy is
		// ensureLibrarySheet's marker-deduped `<style>` (jsdom), so count every tag.
		const hoisted = Array.from(document.head.querySelectorAll('style')).filter((el) =>
			(el.textContent ?? '').includes(FILL_DECLARATIONS)
		);
		expect(hoisted).toHaveLength(1);
	});
});
