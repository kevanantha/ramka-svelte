<!-- Per-page <title> ("<title> — ramka-svelte") and description, repeated as
     the Open Graph / Twitter card text. The root layout adds the per-site
     tags: canonical URL, og:url, og:image, and the card type. -->
<script lang="ts">
	import { SITE_NAME } from '#lib/site.js';

	let {
		title,
		description,
		type = 'website'
	}: { title: string; description: string; type?: 'website' | 'article' } = $props();

	const fullTitle = $derived(`${title} — ${SITE_NAME}`);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content={type} />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
</svelte:head>
