<!-- A guide section. A string title gets a `#id` self-link; pass a snippet
     when the title holds other links (avoid nesting <a>). -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		id,
		title,
		level = 2,
		children
	}: {
		id: string;
		title: string | Snippet;
		level?: 2 | 3;
		children: Snippet;
	} = $props();
</script>

<section {id} class="scroll-mt-20">
	<svelte:element
		this={level === 2 ? 'h2' : 'h3'}
		class={level === 2
			? 'text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50'
			: 'text-[17px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50'}
	>
		{#if typeof title === 'string'}
			<a href="#{id}" class="hover:underline">{title}</a>
		{:else}
			{@render title()}
		{/if}
	</svelte:element>
	<div class="mt-4 space-y-4 text-[15px] leading-7 text-neutral-600 dark:text-neutral-400">
		{@render children()}
	</div>
</section>
