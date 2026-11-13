<script lang="ts">
	import type { Snippet } from 'svelte';
	import { docsLinkClass } from './classes';

	let {
		href,
		class: className,
		children
	}: { href: string; class?: string; children: Snippet } = $props();
</script>

<a {href} class={[docsLinkClass, className]}>{@render children()}</a>
