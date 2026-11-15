<!-- Metadata only, like the original's layout.tsx. -->
<script lang="ts">
	import PageMeta from '#lib/components/docs/PageMeta.svelte';
	let { children } = $props();
</script>

<PageMeta
	title="3D models example"
	description="A Three.js product grid in a Svelte lightbox: onBeforeOpen preheats GLB models before the morph, with a shared orbit between trigger and slide."
/>

{@render children()}
