<!--
  A keyboard key. With `label`, the glyph is an icon (arrows, ⌘, +, −): the
  name goes in visually hidden text, not aria-label, since `kbd` has no ARIA
  role and naming a generic element is prohibited (axe: aria-prohibited-attr).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { label, children }: { label?: string; children: Snippet } = $props();
</script>

<kbd
	data-slot="kbd"
	class="pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm bg-neutral-100 px-1 font-sans text-xs font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 [&_svg:not([class*='size-'])]:size-3"
>
	{#if label}
		<span aria-hidden="true" class="contents">{@render children()}</span>
		<span class="sr-only">{label}</span>
	{:else}
		{@render children()}
	{/if}
</kbd>
