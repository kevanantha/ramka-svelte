<script lang="ts">
	import CodeBlock from '#lib/components/docs/CodeBlock.svelte';
	import PageMeta from '#lib/components/docs/PageMeta.svelte';
	import { docsLinkClass } from '#lib/components/docs/classes.js';
	import { lightboxDocsPages } from '#lib/content/docs-pages.js';
	import install from 'excerpt:excerpts/install.sh';
	import quickStart from 'excerpt:excerpts/quick-start.svelte';

	const h2 = 'text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50';
</script>

<PageMeta
	title="Installation"
	description="Install the ramka Svelte lightbox with npm, pnpm, or yarn, and open your first morphing image gallery in a few lines of code."
/>

<div class="mx-auto w-full max-w-3xl px-6 py-14 md:px-10 md:py-16">
	<p
		class="text-xs font-semibold tracking-[0.1em] text-neutral-400 uppercase dark:text-neutral-600"
	>
		Getting started
	</p>
	<h1 class="mt-3 text-5xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
		ramka
	</h1>
	<p
		class="mt-5 max-w-2xl text-[17px] leading-7 text-pretty text-neutral-500 dark:text-neutral-400"
	>
		Unstyled, accessible lightbox primitives for Svelte — in the style of Bits UI. Compose your own
		lightbox UI on headless parts with view-transition morph by default, swipe slides, zoom, and
		pull-to-dismiss.
	</p>

	<section class="mt-14 space-y-4">
		<h2 class={h2}>Installation</h2>
		<CodeBlock excerpt={install} />
		<p class="text-[15px] leading-7 text-neutral-600 dark:text-neutral-400">
			Peer dependency: <code class="text-xs">svelte</code> &gt;= 5.40.
		</p>
	</section>

	<section class="mt-14 space-y-4">
		<h2 class={h2}>Quick start</h2>
		<CodeBlock excerpt={quickStart} />
	</section>

	<section class="mt-14 space-y-4">
		<h2 class={h2}>Licensing</h2>
		<p class="text-[15px] leading-7 text-neutral-600 dark:text-neutral-400">
			ramka is free software under the
			<a href="https://github.com/arturbien/ramka/blob/main/LICENSE" class={docsLinkClass}
				>MIT License</a
			>, for open-source and proprietary use.
		</p>
	</section>

	<section class="mt-14 rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
		<h2 class="text-base font-semibold text-neutral-900 dark:text-neutral-50">Next steps</h2>
		<ul class="mt-3 space-y-2.5 text-[15px] leading-7 text-neutral-600 dark:text-neutral-400">
			<li>
				<a href={lightboxDocsPages.overview.href} class={docsLinkClass}>Lightbox overview</a>
				— guidelines and anatomy, then
				<a href={lightboxDocsPages.composition.href} class={docsLinkClass}>Composition</a>.
			</li>
			<li>
				<a href="/examples/lightbox/photos-app" class={docsLinkClass}>Examples</a>
				— live product demos and API pattern pages.
			</li>
		</ul>
	</section>
</div>
