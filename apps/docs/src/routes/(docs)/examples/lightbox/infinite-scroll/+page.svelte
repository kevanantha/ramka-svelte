<script lang="ts">
	import InfiniteScrollFeed from './InfiniteScrollFeed.svelte';
</script>

<svelte:head>
	<title>Infinite scroll example — ramka-svelte</title>
	<meta
		name="description"
		content="An endless photo feed whose lightbox paginates too: swiping near the end fetches the next page and appends slides to the native scroll-snap track while the viewer stays open, built with ramka-svelte."
	/>
</svelte:head>

<InfiniteScrollFeed />
