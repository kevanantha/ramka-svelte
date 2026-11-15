<script lang="ts">
	import PageMeta from '#lib/components/docs/PageMeta.svelte';
	import ComponentPreview from '#lib/components/ComponentPreview.svelte';
	import ExampleShell from '#lib/components/ExampleShell.svelte';
	import Demo from './Demo.svelte';

	let { data } = $props();
</script>

<PageMeta
	title="Stories lightbox preset"
	description="An Instagram Stories-style viewer for Svelte: an avatar tray that crossfades into 9:16 video with a scroll-driven 3D page turn, built with ramka-svelte."
/>

<ExampleShell title="Stories" docsHref="/docs/lightbox" docsLabel="Lightbox overview">
	{#snippet description()}
		Instagram-style stories: a horizontal row of avatars, each dissolving into a vertical video via
		<code class="text-xs">crossfade="both"</code> (the circle is not the 9:16 frame, so a geometry
		morph would look wrong). Inside the viewer, slides are a native snap scroller with a CSS
		view-timeline rotateY — cards hinge on their leading edge as they enter and on their trailing
		edge as they leave. Copy the
		<strong class="font-medium text-neutral-800 dark:text-neutral-200">Package</strong>
		files (<code class="text-xs">Gallery.svelte</code> +
		<code class="text-xs">lightbox.css</code>) into your design system, then wire triggers in your
		app.
	{/snippet}
	<ComponentPreview files={data.files} frame={false}>
		<Demo />
	</ComponentPreview>
</ExampleShell>
