// The original's Next.js Image guide is the SvelteKit images guide here.
import { redirect } from '@sveltejs/kit';
import { lightboxDocsPages } from '#lib/content/docs-pages.js';

export const load = () => redirect(308, lightboxDocsPages.sveltekitImage.href);
