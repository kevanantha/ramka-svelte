<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export interface LightboxBackdropProps extends HTMLAttributes<HTMLDivElement> {
		ref?: HTMLDivElement | null;
	}
</script>

<script lang="ts">
	import { getLightboxContext } from './lightbox-state.svelte';
	import { getLightboxPortalContext } from './LightboxPortal.svelte';
	import { containTouchScroll } from './touch-scroll-containment';

	let {
		ref = $bindable(null),
		onclick,
		style,
		children,
		...rest
	}: LightboxBackdropProps = $props();

	const lightbox = getLightboxContext();
	const portal = getLightboxPortalContext();

	const present = $derived(lightbox.mounted || portal.keepMounted);
	const parked = $derived(portal.keepMounted && !lightbox.mounted);

	$effect(() => {
		const el = ref;
		if (!el) return;
		lightbox.backdropElement = el;
		return () => {
			if (lightbox.backdropElement === el) lightbox.backdropElement = null;
		};
	});
</script>

{#if present}
	<div
		bind:this={ref}
		aria-hidden="true"
		inert={parked || undefined}
		data-open={lightbox.open ? '' : undefined}
		data-closed={lightbox.open ? undefined : ''}
		{...rest}
		style="{style ? `${style};` : ''}{lightbox.preparing || parked
			? 'visibility: hidden;'
			: ''}{parked ? 'pointer-events: none;' : ''}"
		data-ramka-backdrop=""
		{@attach lightbox.mounted && !parked ? containTouchScroll : null}
		onclick={(event) => {
			onclick?.(event);
			if (!lightbox.mounted) return;
			lightbox.setOpen(false, { focusVisible: false });
		}}
	>
		{@render children?.()}
	</div>
{/if}
