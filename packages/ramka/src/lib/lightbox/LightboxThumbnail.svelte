<script lang="ts" module>
	import type { HTMLButtonAttributes } from 'svelte/elements';

	export interface LightboxThumbnailProps extends HTMLButtonAttributes {
		/** Item index this thumbnail selects. */
		index: number;
		ref?: HTMLButtonElement | null;
	}
</script>

<script lang="ts">
	import { getLightboxContext } from './lightbox-state.svelte';
	import { getLightboxThumbnailGroupContext } from './LightboxThumbnailGroup.svelte';

	let {
		index,
		ref = $bindable(null),
		onclick,
		children,
		...rest
	}: LightboxThumbnailProps = $props();

	const lightbox = getLightboxContext();
	const group = getLightboxThumbnailGroupContext();
	const active = $derived(lightbox.activeIndex === index);

	$effect(() => {
		const node = ref;
		const i = index;
		if (!node || !group) return;
		group.set(i, node);
		return () => {
			if (group.get(i) === node) group.delete(i);
		};
	});
</script>

<button
	bind:this={ref}
	type="button"
	role="tab"
	id="{lightbox.baseId}-tab-{index}"
	aria-selected={active}
	aria-controls="{lightbox.baseId}-panel-{index}"
	tabindex={active ? 0 : -1}
	{...rest}
	data-ramka-thumbnail=""
	data-active={active ? '' : undefined}
	data-index={index}
	onclick={(event) => {
		onclick?.(event);
		if (!event.defaultPrevented) lightbox.setActiveIndex(index, 'thumbnail');
	}}
>
	{@render children?.()}
</button>
