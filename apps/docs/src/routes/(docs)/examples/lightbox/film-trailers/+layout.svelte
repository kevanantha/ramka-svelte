<!-- Metadata only, like the original's layout.tsx. -->
<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<title>Film trailers example — ramka-svelte</title>
	<meta
		name="description"
		content="A Svelte video lightbox example: movie posters morph into fullscreen videos that autoplay on becoming active, built with ramka-svelte."
	/>
</svelte:head>

{@render children()}
