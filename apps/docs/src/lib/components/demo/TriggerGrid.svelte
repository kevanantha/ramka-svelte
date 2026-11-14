<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="grid max-w-md grid-cols-3 gap-3">{@render children()}</div>
