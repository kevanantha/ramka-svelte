<!-- External link in article prose: opens in a new tab. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { link } from './article';

	let { href, children }: { href: string; children: Snippet } = $props();
</script>

<a {href} target="_blank" rel="noreferrer" class={link}>{@render children()}</a>
