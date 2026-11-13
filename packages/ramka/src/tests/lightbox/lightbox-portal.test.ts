// Svelte-only: no counterpart in ramka's suite. React's createPortal removes
// its host on unmount for free; the Svelte Portal moves its host out of the
// component's DOM range, so it has to remove it itself.
import { describe, expect, it } from 'vitest';

import TestLightbox from './fixtures/TestLightbox.svelte';
import { render } from './test-utils';

describe('Portal', () => {
	it('removes the portalled host when an open lightbox unmounts', () => {
		const { unmount } = render(TestLightbox, { defaultOpen: true });
		const host = document.querySelector('[data-ramka-portal]');
		expect(host?.parentElement).toBe(document.body);
		unmount();
		expect(host?.isConnected).toBe(false);
		expect(document.querySelector('[data-ramka-portal]')).toBeNull();
	});
});
