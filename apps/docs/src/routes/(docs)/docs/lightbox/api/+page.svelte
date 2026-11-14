<script lang="ts">
	import DocsLink from '#lib/components/docs/DocsLink.svelte';
	import DocsPager from '#lib/components/docs/DocsPager.svelte';
	import DocsSection from '#lib/components/docs/DocsSection.svelte';
	import DocsShell from '#lib/components/docs/DocsShell.svelte';
	import PageMeta from '#lib/components/docs/PageMeta.svelte';
	import ApiPartSection from '#lib/components/docs/api/ApiPartSection.svelte';
	import type { DocsTocItem } from '#lib/components/docs/types.js';
	import {
		contextsApi,
		documentViewTransitionApi,
		imperativeApi,
		lightboxApiParts
	} from '#lib/content/api/parts.js';
	import { lightboxApiHref as api, lightboxDocsPages as pages } from '#lib/content/docs-pages.js';

	const byConcern: { label: string; links: { href: string; title: string }[] }[] = [
		{
			label: 'State',
			links: [
				{ href: api.root, title: 'Root' },
				{ href: api.createHandle, title: 'createHandle' }
			]
		},
		{
			label: 'Trigger / Item',
			links: [
				{ href: api.trigger, title: 'Trigger' },
				{ href: api.item, title: 'Item' },
				{ href: api.media, title: 'Media' }
			]
		},
		{
			label: 'Layout',
			links: [
				{ href: api.slides, title: 'Slides' },
				{ href: api.slide, title: 'Slide' }
			]
		},
		{
			label: 'View transitions',
			links: [
				{ href: api.root, title: 'Root (VT props)' },
				{ href: api.documentVt, title: 'Document (VT)' }
			]
		},
		{
			label: 'Shell',
			links: [
				{ href: api.portal, title: 'Portal' },
				{ href: api.backdrop, title: 'Backdrop' },
				{ href: api.content, title: 'Content' }
			]
		},
		{
			label: 'Gestures',
			links: [
				{ href: api.content, title: 'Content' },
				{ href: api.zoom, title: 'Zoom' },
				{ href: api.zoomIn, title: 'ZoomIn' },
				{ href: api.zoomOut, title: 'ZoomOut' }
			]
		},
		{
			label: 'Chrome',
			links: [
				{ href: api.close, title: 'Close' },
				{ href: api.previous, title: 'Previous' },
				{ href: api.next, title: 'Next' },
				{ href: api.counter, title: 'Counter' },
				{ href: api.caption, title: 'Caption' },
				{ href: api.thumbnailGroup, title: 'ThumbnailGroup' },
				{ href: api.thumbnail, title: 'Thumbnail' },
				{ href: api.thumbnailStrip, title: 'ThumbnailStrip' },
				{ href: api.thumbnailStripTrack, title: 'ThumbnailStripTrack' }
			]
		}
	];

	const toc: DocsTocItem[] = [
		{ id: 'by-concern', title: 'By concern' },
		...lightboxApiParts.map((p) => ({ id: p.id, title: p.name })),
		{ id: documentViewTransitionApi.id, title: 'Document (VT)' },
		{ id: 'types', title: 'Types' },
		{
			id: 'contexts',
			title: 'Contexts',
			children: contextsApi.map((p) => ({ id: p.id, title: p.name }))
		},
		{
			id: 'imperative',
			title: 'Imperative handles',
			children: imperativeApi.map((p) => ({ id: p.id, title: p.name }))
		}
	];
</script>

<PageMeta
	title="Lightbox API reference"
	description="Full API reference for ramka lightbox primitives: Root, Trigger, Slides, Zoom, Thumbnails, Captions, Counter, contexts, types, and imperative handles."
/>

{#snippet description()}
	Props, data attributes, and CSS variables for every
	<DocsLink href={pages.overview.href}>Lightbox</DocsLink> part. Tables are generated from the components'
	TypeScript props + JSDoc.
{/snippet}

<DocsShell title="API reference" {description} {toc}>
	<p class="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
		Each part accepts native element attributes for its default host element (spread onto it).
		Custom props are listed below. Guides:
		<DocsLink href={pages.composition.href}>Composition</DocsLink>,
		<DocsLink href={pages.viewTransitions.href}>View transitions</DocsLink>,
		<DocsLink href={pages.gestures.href}>Gestures</DocsLink>.
	</p>

	<DocsSection id="by-concern" title="By concern">
		<ul class="space-y-3">
			{#each byConcern as group (group.label)}
				<li>
					<div class="text-xs font-semibold tracking-wider text-neutral-500 uppercase">
						{group.label}
					</div>
					<div class="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
						{#each group.links as link (link.title)}
							<DocsLink href={link.href}>{link.title}</DocsLink>
						{/each}
					</div>
				</li>
			{/each}
		</ul>
	</DocsSection>

	{#each lightboxApiParts as part (part.id)}
		<ApiPartSection {part} />
	{/each}

	<ApiPartSection part={documentViewTransitionApi} />

	<DocsSection id="types" title="Types">
		<p>
			Helper types you will see in callbacks and snippet arguments (exported from
			<code class="text-xs">ramka-svelte/lightbox</code>):
		</p>
		<ul class="list-disc space-y-2 pl-5">
			<li>
				<code class="text-xs">NavigationSource</code> —
				<code class="text-xs"
					>'trigger' | 'keyboard' | 'thumbnail' | 'button' | 'scroll' | 'imperative'</code
				>. Second argument to Root <code class="text-xs">onValueChange</code>. Handle
				<code class="text-xs">open</code>/<code class="text-xs">goTo</code> use
				<code class="text-xs">'imperative'</code>; scroll-driven Slides use
				<code class="text-xs">'scroll'</code>.
			</li>
			<li>
				<code class="text-xs">LightboxCrossfade</code> —
				<code class="text-xs">'open' | 'close' | 'both'</code> for Trigger
				<code class="text-xs">crossfade</code>. See
				<DocsLink href="{pages.viewTransitions.href}#crossfade"
					>View transitions → crossfade</DocsLink
				>.
			</li>
			<li>
				Snippet-argument types such as <code class="text-xs">LightboxTriggerRenderState</code> and
				<code class="text-xs">LightboxItemRenderState</code>
				(<code class="text-xs">active</code>, <code class="text-xs">visible</code>, the
				<code class="text-xs">image</code> / <code class="text-xs">morph</code> attachments) —
				documented on <DocsLink href={api.trigger}>Trigger</DocsLink> /
				<DocsLink href={api.item}>Item</DocsLink>.
			</li>
		</ul>
	</DocsSection>

	<DocsSection id="contexts" title="Contexts">
		<p>
			Optional contexts for nested wrapper components — the counterparts of ramka's React hooks.
			Call them during component initialisation.
		</p>
	</DocsSection>
	{#each contextsApi as part (part.id)}
		<ApiPartSection {part} />
	{/each}

	<DocsSection id="imperative" title="Imperative handles">
		<p>
			Use <code class="text-xs">Lightbox.createHandle()</code> on Root (and optional detached
			Triggers). Zoom exposes its zoom controls through
			<code class="text-xs">getLightboxZoomContext()</code>.
		</p>
	</DocsSection>
	{#each imperativeApi as part (part.id)}
		<ApiPartSection {part} />
	{/each}

	<DocsPager prev={pages.csp} />
</DocsShell>
