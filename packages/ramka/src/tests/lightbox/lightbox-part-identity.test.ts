import { describe, expect, it } from 'vitest';

import { LIGHTBOX_PART_IDENTITY_ATTRIBUTES } from '../../lib/lightbox/lightbox-data-attributes';

describe('Lightbox part identity markers', () => {
	it('lists only data-ramka-* identity attributes', () => {
		for (const attr of LIGHTBOX_PART_IDENTITY_ATTRIBUTES) {
			expect(attr.startsWith('data-ramka-')).toBe(true);
		}
	});

	// Pending ThumbnailStrip port: the full-chrome tree mounts
	// Lightbox.ThumbnailStrip / ThumbnailStripTrack.
	it.skip('publishes every listed identity marker on a mounted tree', () => {});
});
