import { SITE_URL } from '#lib/site.js';

export const prerender = true;

export const GET = () =>
	new Response(
		`User-agent: *
Allow: /
Disallow: /debug/

Sitemap: ${SITE_URL}/sitemap.xml
`,
		{ headers: { 'Content-Type': 'text/plain' } }
	);
