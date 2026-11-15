<!-- Metadata only, like the original's layout.tsx. -->
<script lang="ts">
	import PageMeta from '#lib/components/docs/PageMeta.svelte';
	let { children } = $props();
</script>

<PageMeta
	title="Text message example"
	description={'An iMessage-style chat in Svelte where photo attachments open in a morphing lightbox from a single morphTo="origin" trigger, built with ramka-svelte.'}
/>

{@render children()}
