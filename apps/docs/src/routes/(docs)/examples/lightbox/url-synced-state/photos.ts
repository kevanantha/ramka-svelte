import { mbPhotos } from '#lib/example-photos.js';
import type { GalleryItem } from '#lib/photos.js';

/**
 * Shared photo catalogue for the URL-synced state example: the demo maps it
 * into grid tiles and slides, and the route (`[[id]]/+page.ts`) uses the same
 * ids for `entries` and 404s. One list, so a photo's URL can never drift from
 * its slide.
 */
export interface GalleryPhoto extends GalleryItem {
	/**
	 * URL segment for the photo's deep link (`…/url-synced-state/5`). An
	 * opaque, stable id: the routing looks photos up by this value, never by
	 * position, so reordering or removing photos can't repoint links.
	 */
	id: string;
	blurDataURL: string;
}

/** The grid's URL; every photo also lives at `${BASE_PATH}/${id}`. */
export const BASE_PATH = '/examples/lightbox/url-synced-state';

/** Page titles, shared by the route's head and the demo's live title. */
export const GALLERY_PAGE_TITLE = 'URL-synced state example';

export function photoPageTitle(photo: GalleryPhoto): string {
	return `${photo.caption} — ${GALLERY_PAGE_TITLE}`;
}

export const galleryPhotos: GalleryPhoto[] = [
	{ id: '1', alt: 'Foggy pine ridge at dawn', caption: 'Dawn ridge' },
	{ id: '2', alt: 'Empty coastal highway', caption: 'Open road' },
	{ id: '3', alt: 'Overhead of a linen breakfast table', caption: 'Slow morning' },
	{ id: '4', alt: 'Narrow sunlit alley', caption: 'Warm alley' },
	{ id: '5', alt: 'Wide desert dunes', caption: 'Dunes' },
	{ id: '6', alt: 'Rain on a window', caption: 'Rainy glass' },
	{ id: '7', alt: 'Calm lake reflection', caption: 'Still water' },
	{ id: '8', alt: 'Tall concrete staircase', caption: 'Ascent' },
	{ id: '9', alt: 'Close-up of dried flowers', caption: 'Pressed petals' },
	{ id: '10', alt: 'Panoramic city skyline at dusk', caption: 'Dusk skyline' },
	{ id: '11', alt: 'Single tree in a green field', caption: 'Lone tree' },
	{ id: '12', alt: 'Textured stone wall', caption: 'Stonework' }
].map((photo, i) => ({ ...mbPhotos[i]!, ...photo }));
