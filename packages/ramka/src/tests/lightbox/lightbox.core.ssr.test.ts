// The two server-rendering cases of ramka's `lightbox.test.tsx`
// `Lightbox > caption and counter` (they call `renderToString` from a jsdom
// file). Svelte renders on the server only with server-compiled components,
// so they run in the `server` project; the rest of the section is in
// `lightbox.core.test.ts`.
import { describe, it, expect } from 'vitest';
import { renderBodyToString } from './ssr-test-utils';

import CaptionSsr from './fixtures/core/CaptionSsr.svelte';
import CountSsr from './fixtures/core/CountSsr.svelte';

const renderToString = renderBodyToString;

describe('Lightbox', () => {
	describe('caption and counter', () => {
		it('paints the children fallback on the server, where captions cannot register', () => {
			// Caption registration is an effect — it never runs during server
			// rendering, so without the fallback an SSR-open page paints an empty
			// caption region until hydration.
			expect(renderToString(CaptionSsr, { props: { fallback: 'Caption 1' } })).toContain(
				'Caption 1'
			);
			// The pre-fallback baseline this guards against.
			expect(renderToString(CaptionSsr, { props: {} })).not.toContain('Caption 1');
		});

		it('paints the `count` fallback on the server, where items cannot register', () => {
			// Item registration is an effect — it never runs during server
			// rendering, so without the fallback an SSR-open page paints the
			// counter as "6 / 0" and (loop off) boundary-disables Next until
			// hydration. `count` is what makes that first paint correct.
			const withCount = renderToString(CountSsr, { props: { count: 12 } });
			expect(withCount).toContain('6 / 12');
			expect(withCount).not.toContain('disabled');

			// The pre-`count` baseline this guards against.
			const withoutCount = renderToString(CountSsr, { props: {} });
			expect(withoutCount).toContain('6 / 0');
			expect(withoutCount).toContain('disabled');
		});
	});
});
