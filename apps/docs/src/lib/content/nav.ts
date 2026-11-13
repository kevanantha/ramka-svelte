import { debugPagesList } from './debug-pages';
import { lightboxDocsPages } from './docs-pages';
import { lightboxExamples } from './examples';
import { lightboxPresets } from './presets';

export interface NavLink {
	href: string;
	title: string;
	description?: string;
	/**
	 * `exact` (default): only an exact pathname match is active. `prefix`
	 * keeps a parent route highlighted on nested pages.
	 */
	match?: 'exact' | 'prefix';
}

export interface NavSection {
	title: string;
	links: NavLink[];
	/** Optional nested groups under a section title. */
	groups?: { title: string; links: NavLink[] }[];
}

const baseNavSections: NavSection[] = [
	{ title: 'Getting started', links: [{ href: '/docs', title: 'Installation' }] },
	{
		title: 'Lightbox',
		links: [
			lightboxDocsPages.overview,
			lightboxDocsPages.stateLifecycle,
			lightboxDocsPages.composition,
			lightboxDocsPages.sveltekitImage,
			lightboxDocsPages.viewTransitions,
			lightboxDocsPages.gestures,
			lightboxDocsPages.zoom,
			lightboxDocsPages.rtl,
			lightboxDocsPages.csp,
			lightboxDocsPages.api
		]
	},
	{ title: 'Presets', links: lightboxPresets },
	{
		title: 'Examples',
		links: lightboxExamples.map((ex) => ({
			href: `/examples/lightbox/${ex.slug}`,
			title: ex.title,
			description: ex.description
		}))
	}
];

/** Sidebar sections. Debug links are included only outside production builds. */
export const navSections: NavSection[] = import.meta.env.DEV
	? [...baseNavSections, { title: 'Debug', links: debugPagesList.map((page) => ({ ...page })) }]
	: baseNavSections;

/** Whether a nav link matches the current pathname. */
export function isActive(pathname: string, href: string, match: NavLink['match'] = 'exact') {
	if (href === '/') return pathname === '/';
	if (match === 'prefix') return pathname === href || pathname.startsWith(`${href}/`);
	return pathname === href;
}
