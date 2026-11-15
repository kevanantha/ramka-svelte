<script lang="ts">
	import PageMeta from '#lib/components/docs/PageMeta.svelte';
	import ExampleShell from '#lib/components/ExampleShell.svelte';
	import PresetVariantPreview from '#lib/components/PresetVariantPreview.svelte';
	import Demo from './Demo.svelte';

	let { data } = $props();

	const strong = 'font-medium text-neutral-800 dark:text-neutral-200';
</script>

<PageMeta
	title="Default lightbox preset"
	description="A copy-paste Svelte lightbox preset: morphing open, swipe navigation, zoom, thumbnails, and captions, styled like the ramka docs and ready for a design system."
/>

<ExampleShell title="Default" docsHref="/docs/lightbox" docsLabel="Lightbox overview">
	{#snippet description()}
		Pick a styling flavor with the toggle:
		<strong class={strong}>Tailwind</strong> is a single <code class="text-xs">Gallery.svelte</code>
		(utilities only, no stylesheet), <strong class={strong}>CSS</strong> pairs
		<code class="text-xs">Gallery.svelte</code> with <code class="text-xs">lightbox.css</code>. Both
		export the identical <code class="text-xs">Gallery</code> API — drop the
		<strong class={strong}>Package</strong> files into a design-system entry, then compose triggers
		in your app. Gallery includes a top-right <strong class={strong}>Theater / Peek</strong> toggle
		(desktop) to switch between full-width and aspect-sized slide tracks. The
		<strong class={strong}>Example</strong> tab shows the live preview (<code class="text-xs"
			>+N</code
		>
		crossfade, child <code class="text-xs">morph</code>, whole-trigger morph) — it is app UI, not
		part of the skin.
	{/snippet}
	<PresetVariantPreview
		variants={[
			{ id: 'tailwind', label: 'Tailwind', files: data.tailwindFiles },
			{ id: 'css', label: 'CSS', files: data.cssFiles }
		]}
	>
		{#snippet preview(variant)}
			<Demo {variant} />
		{/snippet}
	</PresetVariantPreview>
</ExampleShell>
