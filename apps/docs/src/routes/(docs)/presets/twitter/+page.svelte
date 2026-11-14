<script lang="ts">
	import ComponentPreview from '#lib/components/ComponentPreview.svelte';
	import ExampleShell from '#lib/components/ExampleShell.svelte';
	import Demo from './Demo.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Twitter-style lightbox preset — ramka-svelte</title>
	<meta
		name="description"
		content="A Twitter-style media viewer for Svelte: split media and thread sidebar, translucent backdrop, and edge navigation, built with ramka-svelte."
	/>
</svelte:head>

<ExampleShell title="Twitter" docsHref="/docs/lightbox" docsLabel="Lightbox overview">
	{#snippet description()}
		X-style split viewer: a semi-translucent dark media pane with close (top-left) and previous/next
		on the gallery edges. Desktop keeps a white thread sidebar; mobile shows a bottom engagement bar
		and opens the thread as a full-screen sheet from the comment control. Copy the
		<strong class="font-medium text-neutral-800 dark:text-neutral-200">Package</strong>
		files (<code class="text-xs">Gallery.svelte</code>,
		<code class="text-xs">ThreadPanel.svelte</code> +
		<code class="text-xs">lightbox.css</code>) into your design system, then wire triggers in your
		app. The
		<strong class="font-medium text-neutral-800 dark:text-neutral-200">Example</strong>
		tab shows a three-post feed with Facebook-style image grids — single image, three-up, and a
		<code class="text-xs">+N</code> crossfade tile — each opening the split viewer (Tailwind layout only).
	{/snippet}
	<ComponentPreview files={data.files} frame={false}>
		<Demo />
	</ComponentPreview>
</ExampleShell>
