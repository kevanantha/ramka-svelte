<!-- Metadata only, like the original's layout.tsx. -->
<script lang="ts">
	import PageMeta from '#lib/components/docs/PageMeta.svelte';
	let { children } = $props();
</script>

<PageMeta
	title="Film trailers example"
	description="A Svelte video lightbox example: movie posters morph into fullscreen videos that autoplay on becoming active, built with ramka-svelte."
/>

{@render children()}
