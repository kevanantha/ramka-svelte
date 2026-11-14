import { readSourceFiles } from '#lib/server/read-source-files.js';
import gallery from './Gallery.svelte?raw';
import threadPanel from './ThreadPanel.svelte?raw';
import css from './lightbox.css?raw';
import demo from './Demo.svelte?raw';

export async function load() {
	return {
		files: await readSourceFiles([
			{ name: 'Gallery.svelte', code: gallery, group: 'package' },
			{ name: 'ThreadPanel.svelte', code: threadPanel, group: 'package' },
			{ name: 'lightbox.css', code: css, group: 'package' },
			{
				name: 'Demo.svelte',
				code: demo,
				group: 'example',
				note: 'App composition for the preview — uses Tailwind. Not part of the package; swap utility classes for your own tokens/CSS.'
			}
		])
	};
}
