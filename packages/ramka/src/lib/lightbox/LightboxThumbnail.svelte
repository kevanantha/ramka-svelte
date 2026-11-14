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
	import { getLightboxThumbnailStripContextOptional } from './lightbox-thumbnail-strip-context';

	let {
		index,
		ref = $bindable(null),
		onclick,
		children,
		...rest
	}: LightboxThumbnailProps = $props();

	const lightbox = getLightboxContext();
	const group = getLightboxThumbnailGroupContext();
	// Inside a ThumbnailStrip, selection goes through the strip so taps can
	// scrub the linked track; elsewhere a click sets the index directly.
	const strip = getLightboxThumbnailStripContextOptional();
	const active = $derived(lightbox.activeIndex === index);

	$effect(() => {
		const node = ref;
		const i = index;
		if (!node) return;
		group?.set(i, node);
		strip?.registerThumb(i, node);
		return () => {
			if (group?.get(i) === node) group.delete(i);
			strip?.registerThumb(i, null);
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
	data-active={active ? '' : undefined}
	data-index={index}
	{...rest}
	data-ramka-thumbnail=""
	onclick={(event) => {
		onclick?.(event);
		if (strip) strip.selectIndex(index);
		else lightbox.setActiveIndex(index, 'thumbnail');
	}}
>
	{@render children?.()}
</button>
