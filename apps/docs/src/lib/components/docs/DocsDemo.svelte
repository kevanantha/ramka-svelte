<!-- Preview: live demo on top, code excerpt below, one shared border. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import CodeBlock from './CodeBlock.svelte';
	import type { Excerpt } from './types';

	let { excerpt, title, children }: { excerpt: Excerpt; title?: string; children: Snippet } =
		$props();
</script>

<div class="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
	<div
		class="border-b border-neutral-200 bg-white p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-950"
	>
		{@render children()}
	</div>
	<CodeBlock {excerpt} {title} embedded />
</div>
