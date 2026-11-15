<script lang="ts">
	import PageMeta from '#lib/components/docs/PageMeta.svelte';
	import InfiniteScrollFeed from './InfiniteScrollFeed.svelte';
</script>

<PageMeta
	title="Infinite scroll example"
	description="An endless photo feed whose lightbox paginates too: swiping near the end fetches the next page and appends slides to the native scroll-snap track while the viewer stays open, built with ramka-svelte."
/>

<InfiniteScrollFeed />
