import { readSourceFiles } from '#lib/server/read-source-files.js';
import tailwindGallery from './tailwind/Gallery.svelte?raw';
import cssGallery from './css/Gallery.svelte?raw';
import css from './css/lightbox.css?raw';
import demo from './Demo.svelte?raw';

const demoFile = {
	name: 'Demo.svelte',
	code: demo,
	group: 'example' as const,
	note: 'App composition for the preview — renders either variant. In your app, import one variant directly; trigger layout classes use Tailwind.'
};

export async function load() {
	const [tailwindFiles, cssFiles] = await Promise.all([
		readSourceFiles([
			{
				name: 'Gallery.svelte',
				code: tailwindGallery,
				group: 'package',
				note: 'Single file, no stylesheet. Requires Tailwind CSS v4 and @lucide/svelte.'
			},
			demoFile
		]),
		readSourceFiles([
			{ name: 'Gallery.svelte', code: cssGallery, group: 'package' },
			{ name: 'lightbox.css', code: css, group: 'package' },
			demoFile
		])
	]);
	return { tailwindFiles, cssFiles };
}
