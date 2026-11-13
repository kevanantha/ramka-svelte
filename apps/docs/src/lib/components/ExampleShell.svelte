<!-- Example / preset page frame: title, description, "See also" docs link. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		docsHref,
		docsLabel = 'Lightbox docs',
		children
	}: {
		title: string;
		description?: Snippet;
		/** Deep link into Lightbox docs (e.g. `/docs/lightbox/api#api-root`). */
		docsHref?: string;
		docsLabel?: string;
		children: Snippet;
	} = $props();
</script>

<div class="mx-auto w-full max-w-4xl px-6 py-14 md:px-10 md:py-16">
	<header class="mb-10">
		<h1
			class="text-4xl font-semibold tracking-tight text-balance text-neutral-900 dark:text-neutral-50"
		>
			{title}
		</h1>
		{#if description}
			<div
				class="mt-4 max-w-2xl text-[15px] leading-7 text-pretty text-neutral-500 dark:text-neutral-400"
			>
				{@render description()}
			</div>
		{/if}
		{#if docsHref}
			<p class="mt-4 text-[13px] text-neutral-500">
				See also:
				<a
					href={docsHref}
					class="font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2 transition-colors hover:text-blue-700 hover:decoration-blue-700/50 dark:text-blue-400 dark:decoration-blue-400/40 dark:hover:text-blue-300 dark:hover:decoration-blue-300/60"
				>
					{docsLabel}
				</a>
			</p>
		{/if}
	</header>
	<div>{@render children()}</div>
</div>
