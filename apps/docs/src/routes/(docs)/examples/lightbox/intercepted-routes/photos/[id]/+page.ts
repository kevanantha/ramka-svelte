import { error } from '@sveltejs/kit';
import { interceptedPhotos } from '../../photos';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => interceptedPhotos.map((photo) => ({ id: photo.id }));

export const load: PageLoad = ({ params }) => {
	const photo = interceptedPhotos.find((p) => p.id === params.id);
	if (!photo) error(404, 'Not found');
	return { photo };
};
