<script lang="ts">
	import CodeBlock from '#lib/components/docs/CodeBlock.svelte';
	import DocsLink from '#lib/components/docs/DocsLink.svelte';
	import DocsPager from '#lib/components/docs/DocsPager.svelte';
	import DocsSection from '#lib/components/docs/DocsSection.svelte';
	import DocsShell from '#lib/components/docs/DocsShell.svelte';
	import PageMeta from '#lib/components/docs/PageMeta.svelte';
	import { strongClass } from '#lib/components/docs/classes.js';
	import type { DocsTocItem } from '#lib/components/docs/types.js';
	import HeroDemo from '#lib/components/guides/HeroDemo.svelte';
	import { lightboxDocsPages as pages } from '#lib/content/docs-pages.js';
	import anatomy from 'excerpt:excerpts/anatomy.svelte';

	const guideLinks = [
		{
			title: 'State & lifecycle',
			description: 'Controlled open/index, createHandle, and open-change callbacks.',
			href: pages.stateLifecycle.href
		},
		{
			title: 'Composition',
			description: 'Slides + Zoom chrome, media fill / fit-box sizing, and itemCount.',
			href: pages.composition.href
		},
		{
			title: 'SvelteKit images',
			description:
				'@sveltejs/enhanced-img with Ramka — destination blur only when that item has no trigger image.',
			href: pages.sveltekitImage.href
		},
		{
			title: 'View transitions',
			description:
				'Morph attachments (on by default), crossfade, morphTo, and scrollTriggerIntoView.',
			href: pages.viewTransitions.href
		},
		{
			title: 'Gestures',
			description: 'Pull-to-dismiss, zoom bridge, keyboard, and what wins when.',
			href: pages.gestures.href
		},
		{
			title: 'RTL support',
			description: 'Reading direction, what mirrors and what stays physical, and styling notes.',
			href: pages.rtl.href
		},
		{
			title: 'API reference',
			description: 'Props, data attributes, and CSS variables for every part.',
			href: pages.api.href
		}
	];

	const toc: DocsTocItem[] = [
		{ id: 'usage-guidelines', title: 'Usage guidelines' },
		{ id: 'anatomy', title: 'Anatomy' },
		{ id: 'next-steps', title: 'Next steps' }
	];
</script>

<PageMeta
	title="Svelte lightbox overview"
	description="Headless lightbox primitives for Svelte built on native scrolling and View Transitions: morphing open, swipe navigation, pinch to zoom, and pull to dismiss. Start here."
/>

<DocsShell
	title="Lightbox"
	description="Accessible primitives for fullscreen media lightboxes — compound parts in the style of Base UI and Bits UI. Cosmetically unstyled: you own colors, chrome, and radius values. Ramka owns state, focus, gestures, morphs, and structural styles required for those mechanics."
	{toc}
>
	<div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
		<HeroDemo />
	</div>

	<DocsSection id="usage-guidelines" title="Usage guidelines">
		<p>Work through these decisions in order:</p>
		<ol class="list-decimal space-y-3 pl-5">
			<li>
				<strong class={strongClass}>State</strong> — bindable props, createHandle, or both? See
				<DocsLink href={pages.stateLifecycle.href}>State & lifecycle</DocsLink>.
			</li>
			<li>
				<strong class={strongClass}>Layout</strong> — default to the swipe carousel (<DocsLink
					href="{pages.composition.href}#slides">Slides + Zoom</DocsLink
				>). See <DocsLink href={pages.composition.href}>Composition</DocsLink>.
			</li>
			<li>
				<strong class={strongClass}>Morph</strong> — on by default; wrap destination media in
				<code class="text-xs">Lightbox.Media</code> (and the <code class="text-xs">image</code>
				attachment on Trigger thumbs), choose <code class="text-xs">crossfade</code> /
				<code class="text-xs">morphTo</code>, or pass
				<code class="text-xs">viewTransition={'{false}'}</code> to opt out. See
				<DocsLink href={pages.viewTransitions.href}>View transitions</DocsLink>.
			</li>
			<li>
				<strong class={strongClass}>Gestures</strong> — pull-to-dismiss on Content, Zoom on media,
				keyboard on Content. See <DocsLink href={pages.gestures.href}>Gestures</DocsLink>.
			</li>
			<li>
				<strong class={strongClass}>Cosmetics vs mechanics</strong>
				— colors, chrome, and radius <em>values</em> are yours. Structural styles (view-transition
				morph CSS, morph host box, zoom overflow, slide snap alignment, placeholders) are applied by
				the library or via Media <code class="text-xs">width</code>/<code class="text-xs"
					>height</code
				>; slide track width (full-bleed vs snug cards) is consumer CSS — see
				<DocsLink href="{pages.composition.href}#slides">Composition → Slides + Zoom</DocsLink>.
				Style with documented <code class="text-xs">data-*</code> attributes and CSS variables from
				the <DocsLink href={pages.api.href}>API reference</DocsLink>.
			</li>
		</ol>
	</DocsSection>

	<DocsSection id="anatomy" title="Anatomy">
		<p>
			Import the namespace and compose parts. The sketch below is the default gallery shape (Slides
			+ Zoom + chrome). Every part is optional except Root for state.
		</p>
		<CodeBlock excerpt={anatomy} />
	</DocsSection>

	<DocsSection id="next-steps" title="Next steps">
		<ul class="grid gap-3 sm:grid-cols-2">
			{#each guideLinks as ex (ex.href)}
				<li>
					<a
						href={ex.href}
						class="block h-full rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:hover:bg-neutral-800"
					>
						<div class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
							{ex.title}
						</div>
						<p class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{ex.description}</p>
					</a>
				</li>
			{/each}
		</ul>
		<p class="mt-4">
			Browse product demos under <DocsLink href="/examples/lightbox/photos-app">Examples</DocsLink>.
			Guides above are canonical for behavior; examples are compositions.
		</p>
	</DocsSection>

	<DocsPager next={pages.stateLifecycle} />
</DocsShell>
