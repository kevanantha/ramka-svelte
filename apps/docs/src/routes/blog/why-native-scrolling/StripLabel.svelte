<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div
	class="mb-2 text-[12px] font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400"
>
	{@render children()}
</div>
