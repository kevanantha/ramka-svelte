<!-- The page frame the original's articles render around themselves: site
     header (wordmark links home), the article, site footer. -->
<script lang="ts">
	import SiteFooter from '#lib/components/SiteFooter.svelte';
	import SiteHeader from '#lib/components/SiteHeader.svelte';

	let { children } = $props();
</script>

<div class="isolate flex min-h-screen flex-col">
	<SiteHeader home />
	<main class="flex-1">{@render children()}</main>
	<SiteFooter />
</div>
