<!-- Metadata only, like the original's layout.tsx. -->
<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<title>Text message example — ramka-svelte</title>
	<meta
		name="description"
		content="An iMessage-style chat in Svelte where photo attachments open in a morphing lightbox from a single morphTo=&quot;origin&quot; trigger, built with ramka-svelte."
	/>
</svelte:head>

{@render children()}
