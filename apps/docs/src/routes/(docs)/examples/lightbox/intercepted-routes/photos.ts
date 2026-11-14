import { mbPhotos } from '#lib/example-photos.js';
import type { GalleryItem } from '#lib/photos.js';

/**
 * Shared photo catalogue for the intercepted routes example. One list serves
 * the grid page, the shallow-routed modal and the standalone photo page
 * (`photos/[id]`), so a photo's URL can never drift from its slide. The
 * photos are the URL-synced state example's.
 */
export interface InterceptedPhoto extends GalleryItem {
	/**
	 * URL segment for the photo route (`…/intercepted-routes/photos/5`). A
	 * stable id looked up by value, never by position.
	 */
	id: string;
	blurDataURL: string;
}

export const EXAMPLE_BASE_PATH = '/examples/lightbox/intercepted-routes';

export const EXAMPLE_PAGE_TITLE = 'Intercepted routes example';

export function interceptedPhotoTitle(photo: InterceptedPhoto): string {
	return `${photo.caption} — ${EXAMPLE_PAGE_TITLE}`;
}

const [mb01, mb02, , mb04, mb05, , mb07, mb08, , mb10, mb11] = mbPhotos;

export const interceptedPhotos: InterceptedPhoto[] = [
	{ id: '1', alt: 'Foggy pine ridge at dawn', caption: 'Dawn ridge', ...mb01! },
	{ id: '2', alt: 'Empty coastal highway', caption: 'Open road', ...mb02! },
	{ id: '3', alt: 'Narrow sunlit alley', caption: 'Warm alley', ...mb04! },
	{ id: '4', alt: 'Wide desert dunes', caption: 'Dunes', ...mb05! },
	{ id: '5', alt: 'Calm lake reflection', caption: 'Still water', ...mb07! },
	{ id: '6', alt: 'Tall concrete staircase', caption: 'Ascent', ...mb08! },
	{ id: '7', alt: 'Panoramic city skyline at dusk', caption: 'Dusk skyline', ...mb10! },
	{ id: '8', alt: 'Single tree in a green field', caption: 'Lone tree', ...mb11! }
];
