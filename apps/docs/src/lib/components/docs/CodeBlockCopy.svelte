<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import { CopyFeedback } from './copy-text.svelte';

	let { code }: { code: string } = $props();

	const feedback = new CopyFeedback();
</script>

<button
	type="button"
	onclick={() => feedback.copy(code)}
	class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-neutral-500 transition hover:bg-neutral-200/70 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
	aria-label="Copy code"
>
	{#if feedback.copied}<Check class="size-3.5" />{:else}<Copy class="size-3.5" />{/if}
	{feedback.copied ? 'Copied' : 'Copy'}
</button>
