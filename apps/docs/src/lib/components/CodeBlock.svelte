<!-- Highlighted code card with a copy button. `html` is Shiki output from
     highlightCode at prerender (see the blog pages' +page.server.ts). -->
<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import '../styles/code-block.css';
	import { copyText } from './source-file';

	let {
		code,
		html,
		title,
		class: className = ''
	}: { code: string; html: string; title?: string; class?: string } = $props();

	let copied = $state(false);
	let copiedTimer = 0;

	function copy() {
		if (!copyText(code)) return;
		copied = true;
		window.clearTimeout(copiedTimer);
		copiedTimer = window.setTimeout(() => (copied = false), 1500);
	}
</script>

{#snippet copyButton()}
	<button
		type="button"
		onclick={copy}
		class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-neutral-500 transition hover:bg-neutral-200/70 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
		aria-label="Copy code"
	>
		{#if copied}
			<Check class="size-3.5" />
		{:else}
			<Copy class="size-3.5" />
		{/if}
		{copied ? 'Copied' : 'Copy'}
	</button>
{/snippet}

<div
	class="code-block overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 {className}"
>
	{#if title}
		<div
			class="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-3 py-1.5 dark:border-neutral-800 dark:bg-neutral-900"
		>
			<span class="text-xs font-medium text-neutral-500">{title}</span>
			{@render copyButton()}
		</div>
	{:else}
		<div
			class="flex justify-end border-b border-neutral-200 bg-neutral-50 px-2 py-1 dark:border-neutral-800 dark:bg-neutral-900"
		>
			{@render copyButton()}
		</div>
	{/if}
	<div class="code-block-pre overflow-x-auto bg-neutral-50 dark:bg-neutral-950">
		<!-- Shiki output, highlighted from our own strings at prerender. -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html html}
	</div>
</div>
