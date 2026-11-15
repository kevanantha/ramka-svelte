import { lightboxDocsPages } from '#lib/content/docs-pages.js';
import { lightboxExamples } from '#lib/content/examples.js';
import { lightboxPresets } from '#lib/content/presets.js';
import { SITE_URL } from '#lib/site.js';

/** Every indexable page: the sidebar's pages plus home and the license pages. */
const paths = [
	'/',
	'/docs',
	...Object.values(lightboxDocsPages).map((page) => page.href),
	...lightboxPresets.map((preset) => preset.href),
	...lightboxExamples.map((example) => `/examples/lightbox/${example.slug}`),
	'/license',
	'/license/notices'
];

export const prerender = true;

export const GET = () =>
	new Response(
		`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `<url><loc>${SITE_URL}${path}</loc></url>`).join('\n')}
</urlset>
`,
		{ headers: { 'Content-Type': 'application/xml' } }
	);
