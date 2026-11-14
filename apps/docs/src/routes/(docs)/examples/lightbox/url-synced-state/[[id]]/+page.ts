import { error } from '@sveltejs/kit';
import { galleryPhotos } from '../photos';
import type { EntryGenerator, PageLoad } from './$types';

/**
 * `[[id]]` is an optional param: `/examples/lightbox/url-synced-state` renders
 * the grid and `/examples/lightbox/url-synced-state/5` is the same page deep
 * linked into the lightbox. One route (one page component) for both URL
 * shapes, so the viewer never remounts while it rewrites the URL.
 */

/** Prerender the grid plus every photo permalink (triggers aren't links). */
export const entries: EntryGenerator = () => [
	{ id: undefined },
	...galleryPhotos.map((photo) => ({ id: photo.id }))
];

export const load: PageLoad = ({ params }) => {
	// Unknown photo ids 404 like any other dynamic route; a second segment
	// already 404s because `[[id]]` matches one at most.
	if (params.id !== undefined && !galleryPhotos.some((photo) => photo.id === params.id)) {
		error(404, 'Not found');
	}
};
