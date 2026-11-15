<script lang="ts">
	import PageMeta from '#lib/components/docs/PageMeta.svelte';
	let { data } = $props();
</script>

<PageMeta title="License" description="ramka-svelte is free software under the MIT License." />

<section class="mx-auto w-full max-w-2xl px-6 pt-16 pb-20 md:pt-20 md:pb-24">
	<h1
		class="text-3xl font-semibold tracking-tight text-balance text-neutral-950 md:text-4xl dark:text-neutral-50"
	>
		License
	</h1>
	<p class="mt-4 text-[15px] leading-7 text-neutral-600 dark:text-neutral-400">
		ramka is free software under the MIT License, for open-source and proprietary use.
	</p>
	<pre
		class="mt-8 overflow-x-auto rounded-2xl border border-neutral-200 p-5 text-xs leading-6 whitespace-pre-wrap text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">{data.license}</pre>
	<p class="mt-8 text-[15px] leading-7 text-neutral-600 dark:text-neutral-400">
		Third-party code included in the package is listed in
		<a
			href="/license/notices"
			class="underline decoration-neutral-300 underline-offset-2 transition hover:decoration-neutral-500 dark:decoration-neutral-700 dark:hover:decoration-neutral-500"
			>third-party notices</a
		>.
	</p>
</section>
