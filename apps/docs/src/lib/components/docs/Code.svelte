<!-- Inline `code` in docs prose (the original's `<code className="text-xs">`). -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<code class="text-xs">{@render children()}</code>
