<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { SITE_NAME, SITE_URL } from '#lib/site.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const canonical = $derived(SITE_URL + page.url.pathname);
</script>

<!-- Title, description and card text come from each page (PageMeta). -->
<svelte:head>
	<link rel="canonical" href={canonical} />
	<meta property="og:url" content={canonical} />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:locale" content="en_US" />
	<meta property="og:image" content="{SITE_URL}/og.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="The lightbox for Svelte." />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content="{SITE_URL}/og.png" />
</svelte:head>

{@render children()}
