<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export interface LightboxCounterState {
		/** 1-based position of the active item. */
		current: number;
		total: number;
	}

	export interface LightboxCounterProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		/** Custom wording. Defaults to `"{current} / {total}"`. */
		children?: Snippet<[LightboxCounterState]>;
		ref?: HTMLDivElement | null;
	}
</script>

<script lang="ts">
	import { getLightboxContext } from './lightbox-state.svelte';

	let { ref = $bindable(null), children, ...rest }: LightboxCounterProps = $props();

	const lightbox = getLightboxContext();
	const current = $derived(lightbox.activeIndex + 1);
	const total = $derived(lightbox.itemCount);
</script>

<div bind:this={ref} aria-live="polite" aria-atomic="true" {...rest} data-ramka-counter="">
	{#if children}
		{@render children({ current, total })}
	{:else}
		{current} / {total}
	{/if}
</div>
