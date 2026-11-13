<!-- Highlighted code sample with a copy button. -->
<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import CodeBlockCopy from './CodeBlockCopy.svelte';
	import type { Excerpt } from './types';

	let {
		excerpt,
		title = excerpt.title,
		class: className,
		embedded = false
	}: {
		/** From `import x from 'excerpt:…'`. */
		excerpt: Excerpt;
		/** Defaults to the excerpt's `@docs-excerpt-title`. */
		title?: string;
		class?: ClassValue;
		/** Flatten border/radius when nested inside DocsDemo. */
		embedded?: boolean;
	} = $props();
</script>

<div
	class={[
		'code-block overflow-hidden',
		embedded
			? 'rounded-none border-0'
			: 'rounded-lg border border-neutral-200 dark:border-neutral-800',
		className
	]}
>
	{#if title}
		<div
			class="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-3 py-1.5 dark:border-neutral-800 dark:bg-neutral-900"
		>
			<span class="text-xs font-medium text-neutral-500">{title}</span>
			<CodeBlockCopy code={excerpt.code} />
		</div>
	{:else}
		<div
			class="flex justify-end border-b border-neutral-200 bg-neutral-50 px-2 py-1 dark:border-neutral-800 dark:bg-neutral-900"
		>
			<CodeBlockCopy code={excerpt.code} />
		</div>
	{/if}
	<div class="code-block-pre overflow-x-auto bg-neutral-50 dark:bg-neutral-950">
		{@html excerpt.html}
	</div>
</div>
