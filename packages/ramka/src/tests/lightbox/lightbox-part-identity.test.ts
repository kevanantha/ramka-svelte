import { describe, expect, it } from 'vitest';

import { LIGHTBOX_PART_IDENTITY_ATTRIBUTES } from '../../lib/lightbox/lightbox-data-attributes';
import FullChromeLightbox from './fixtures/misc/FullChromeLightbox.svelte';
import { render } from './test-utils';

describe('Lightbox part identity markers', () => {
	it('lists only data-ramka-* identity attributes', () => {
		for (const attr of LIGHTBOX_PART_IDENTITY_ATTRIBUTES) {
			expect(attr.startsWith('data-ramka-')).toBe(true);
		}
	});

	it('publishes every listed identity marker on a mounted tree', () => {
		render(FullChromeLightbox);

		const missing = LIGHTBOX_PART_IDENTITY_ATTRIBUTES.filter(
			(attr) => document.querySelector(`[${attr}]`) === null
		);

		expect(missing).toEqual([]);
	});
});
