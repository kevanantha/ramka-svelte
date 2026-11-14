<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Third-party notices — ramka-svelte</title>
	<meta name="description" content="Third-party code included in ramka-svelte, with its license." />
</svelte:head>

<section class="mx-auto w-full max-w-2xl px-6 pt-16 pb-20 md:pt-20 md:pb-24">
	<h1
		class="text-3xl font-semibold tracking-tight text-balance text-neutral-950 md:text-4xl dark:text-neutral-50"
	>
		{data.title}
	</h1>
	<!-- Rendered at prerender from the package's own THIRD-PARTY-NOTICES.md. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html data.html}
</section>
