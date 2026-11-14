<script lang="ts">
	import ComponentPreview from '#lib/components/ComponentPreview.svelte';
	import ExampleShell from '#lib/components/ExampleShell.svelte';
	import Demo from './Demo.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Editorial lightbox preset — ramka-svelte</title>
	<meta
		name="description"
		content="A newsroom article-figure lightbox for Svelte: near-black surface with a caption and credit block, built with ramka-svelte."
	/>
</svelte:head>

<ExampleShell title="Editorial" docsHref="/docs/lightbox" docsLabel="Lightbox overview">
	{#snippet description()}
		The viewer newsrooms use for article figures: a near-black surface in both color schemes, a
		typography-forward caption and credit block under the media, and ghost controls. Keyboard-first,
		no zoom — a reading context, not an inspection one. Copy the
		<strong class="font-medium text-neutral-800 dark:text-neutral-200">Package</strong>
		files (<code class="text-xs">Gallery.svelte</code> +
		<code class="text-xs">lightbox.css</code>) into your design system, then wire triggers in your
		app. The
		<strong class="font-medium text-neutral-800 dark:text-neutral-200">Example</strong>
		tab shows an article excerpt whose inline figures open the viewer with their caption and credit.
	{/snippet}
	<ComponentPreview files={data.files} frame={false}>
		<Demo />
	</ComponentPreview>
</ExampleShell>
