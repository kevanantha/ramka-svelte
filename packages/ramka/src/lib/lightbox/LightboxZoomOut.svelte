<script lang="ts" module>
	import type { HTMLButtonAttributes } from 'svelte/elements';

	export interface LightboxZoomOutProps extends HTMLButtonAttributes {
		ref?: HTMLButtonElement | null;
	}
</script>

<script lang="ts">
	import { getLightboxContext } from './lightbox-state.svelte';
	import { accessibleNameWarning } from './accessible-name-warning';
	import { getLightboxZoomContext } from './LightboxZoom.svelte';

	let { ref = $bindable(null), onclick, children, ...rest }: LightboxZoomOutProps = $props();

	const lightbox = getLightboxContext();
	// Inside a Lightbox.Zoom it drives that zoom; elsewhere (the chrome) it
	// drives the active slide's.
	const local = getLightboxZoomContext();
	const zoom = $derived(local ?? lightbox.activeZoom);
	const disabled = $derived(!zoom?.canZoomOut);
</script>

<!-- Ships no aria-label: give it visible text or your own localized label. -->
<button
	bind:this={ref}
	{@attach accessibleNameWarning('Lightbox.ZoomOut')}
	type="button"
	{...rest}
	{disabled}
	data-ramka-zoom-out=""
	data-disabled={disabled ? '' : undefined}
	onclick={(event) => {
		onclick?.(event);
		// A Slides swipe is in flight: don't let the click hijack it.
		if (event.defaultPrevented || lightbox.navigationLocked) return;
		zoom?.zoomOut();
	}}
>
	{@render children?.()}
</button>
