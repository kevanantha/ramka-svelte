<!--
  Blog article frame: page metadata (the document title targets the search
  topic, the visible H1 keeps the editorial headline), TechArticle JSON-LD,
  and the date / headline / lede header above the body.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		published,
		date,
		title,
		seoTitle,
		seoDescription,
		ldHeadline = title,
		ldDescription,
		keywords,
		lede,
		children
	}: {
		/** ISO date, e.g. `2026-08-29`. */
		published: string;
		/** The visible date, e.g. `August 29, 2026`. */
		date: string;
		title: string;
		seoTitle: string;
		seoDescription: string;
		ldHeadline?: string;
		ldDescription: string;
		keywords: string;
		lede: Snippet;
		children: Snippet;
	} = $props();

	const fullTitle = $derived(`${seoTitle} — ramka-svelte`);
	const structuredData = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'TechArticle',
			headline: ldHeadline,
			description: ldDescription,
			datePublished: published,
			author: { '@type': 'Person', name: 'Artur Bień' },
			keywords
		}).replaceAll('<', '\\u003c')
	);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={seoDescription} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={seoDescription} />
	<meta property="og:type" content="article" />
	<meta property="og:site_name" content="ramka-svelte" />
	<meta property="article:published_time" content={published} />
	<meta property="article:author" content="Artur Bień" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={seoDescription} />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${structuredData}</script>`}
</svelte:head>

<article class="mx-auto w-full max-w-2xl px-6 pt-16 pb-20 md:pt-20 md:pb-24">
	<p class="text-[13px] font-medium tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
		<time datetime={published}>{date}</time>
	</p>
	<h1
		class="mt-3 text-3xl font-semibold tracking-tight text-balance text-neutral-950 md:text-4xl dark:text-neutral-50"
	>
		{title}
	</h1>
	<p class="mt-5 text-[17px] leading-7 text-pretty text-neutral-500 dark:text-neutral-400">
		{@render lede()}
	</p>
	{@render children()}
</article>
