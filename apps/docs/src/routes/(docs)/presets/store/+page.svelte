<script lang="ts">
	import PageMeta from '#lib/components/docs/PageMeta.svelte';
	import ComponentPreview from '#lib/components/ComponentPreview.svelte';
	import ExampleShell from '#lib/components/ExampleShell.svelte';
	import Demo from './Demo.svelte';

	let { data } = $props();
</script>

<PageMeta
	title="Store gallery lightbox preset"
	description="An e-commerce product gallery lightbox for Svelte: thumbnail rail and a buy panel with price, highlights, and a CTA, built from ramka-svelte lightbox primitives."
/>

<ExampleShell title="Store" docsHref="/docs/lightbox" docsLabel="Lightbox overview">
	{#snippet description()}
		A full commerce viewer: the media stage (vertical thumbnail rail, pager, corner zoom) sits
		beside a buy panel with price, highlights, and the add-to-cart CTA — on mobile the panel
		collapses into a sticky price + CTA bar, so the shopper never loses the buy button while
		inspecting photos. Copy the
		<strong class="font-medium text-neutral-800 dark:text-neutral-200">Package</strong> files (<code
			class="text-xs">Gallery.svelte</code
		>
		+ <code class="text-xs">lightbox.css</code>) into your design system, then wire triggers in your
		app. The
		<strong class="font-medium text-neutral-800 dark:text-neutral-200">Example</strong> tab shows a product
		card whose thumbnails swap the main image, viewer navigation synced back so the close morph lands
		on the visible image, and add-to-cart state shared between the card and the viewer.
	{/snippet}
	<ComponentPreview files={data.files} frame={false}>
		<Demo />
	</ComponentPreview>
</ExampleShell>
