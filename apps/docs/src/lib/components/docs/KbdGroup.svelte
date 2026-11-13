<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<kbd class="inline-flex items-center gap-1">{@render children()}</kbd>
