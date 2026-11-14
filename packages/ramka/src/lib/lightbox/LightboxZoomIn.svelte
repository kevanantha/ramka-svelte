<script lang="ts" module>
	import type { HTMLButtonAttributes } from 'svelte/elements';

	export interface LightboxZoomInProps extends HTMLButtonAttributes {
		ref?: HTMLButtonElement | null;
	}
</script>

<script lang="ts">
	import { getLightboxContext } from './lightbox-state.svelte';
	import { accessibleNameWarning } from './accessible-name-warning';
	import { getLightboxZoomContext } from './LightboxZoom.svelte';

	let { ref = $bindable(null), onclick, children, ...rest }: LightboxZoomInProps = $props();

	const lightbox = getLightboxContext();
	// Inside a Lightbox.Zoom it drives that zoom; elsewhere (the chrome) it
	// drives the active slide's.
	const local = getLightboxZoomContext();
	const zoom = $derived(local ?? lightbox.activeZoom);
	const disabled = $derived(!zoom?.canZoomIn);
</script>

<!-- Ships no aria-label: give it visible text or your own localized label. -->
<button
	bind:this={ref}
	{@attach accessibleNameWarning('Lightbox.ZoomIn')}
	type="button"
	{disabled}
	data-disabled={disabled ? '' : undefined}
	{...rest}
	data-ramka-zoom-in=""
	onclick={(event) => {
		onclick?.(event);
		// A Slides swipe is in flight: don't let the click hijack it.
		if (event.currentTarget.disabled || lightbox.navigationLocked) return;
		zoom?.zoomIn();
	}}
>
	{@render children?.()}
</button>
