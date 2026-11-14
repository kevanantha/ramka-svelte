<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export interface LightboxCaptionProps extends HTMLAttributes<HTMLDivElement> {
		/**
		 * Fallback shown while no item has registered a caption yet (a viewer
		 * rendered already open). Pass the initially-active item's caption.
		 */
		children?: Snippet;
		ref?: HTMLDivElement | null;
	}
</script>

<script lang="ts">
	import { getLightboxContext } from './lightbox-state.svelte';

	let { ref = $bindable(null), children, ...rest }: LightboxCaptionProps = $props();

	const lightbox = getLightboxContext();

	/** The active item's caption (registered by `Lightbox.Item`). */
	const caption = $derived(lightbox.captions.get(lightbox.activeIndex));
	const useFallback = $derived(caption === undefined && lightbox.captions.size === 0 && !!children);
	const hasCaption = $derived(caption !== undefined || useFallback);
</script>

<div
	bind:this={ref}
	aria-live="polite"
	aria-atomic="true"
	data-has-caption={hasCaption ? '' : undefined}
	{...rest}
	data-ramka-caption=""
>
	{#if typeof caption === 'string'}
		{caption}
	{:else if caption}
		{@render caption()}
	{:else if useFallback}
		{@render children?.()}
	{/if}
</div>
