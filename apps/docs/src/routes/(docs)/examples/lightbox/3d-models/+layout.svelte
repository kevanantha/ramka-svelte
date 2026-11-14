<!-- Metadata only, like the original's layout.tsx. -->
<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<title>3D models example — ramka-svelte</title>
	<meta
		name="description"
		content="A Three.js product grid in a Svelte lightbox: onBeforeOpen preheats GLB models before the morph, with a shared orbit between trigger and slide."
	/>
</svelte:head>

{@render children()}
