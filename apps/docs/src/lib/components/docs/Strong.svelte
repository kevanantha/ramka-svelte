<script lang="ts">
	import type { Snippet } from 'svelte';
	import { strongClass } from './classes';

	let { children }: { children: Snippet } = $props();
</script>

<strong class={strongClass}>{@render children()}</strong>
