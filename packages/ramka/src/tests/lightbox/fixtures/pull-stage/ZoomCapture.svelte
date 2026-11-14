<!--
	Stands in for React's `<Lightbox.Zoom ref={zoomRef}>` imperative handle:
	rendered inside a `Lightbox.Zoom`, it publishes that zoom's context
	(`zoom`, `zoomTo`, `zoomIn`, …) into `zoomRef.current`.
-->
<script lang="ts" module>
	import type { LightboxZoomContext } from '../../../../lib/lightbox/LightboxZoom.svelte';

	export type ZoomRef = { current: LightboxZoomContext | null };

	export function createZoomRef(): ZoomRef {
		return { current: null };
	}
</script>

<script lang="ts">
	import { getLightboxZoomContext } from '../../../../lib/lightbox/LightboxZoom.svelte';

	let { zoomRef }: { zoomRef?: ZoomRef } = $props();

	const zoom = getLightboxZoomContext();

	$effect.pre(() => {
		const target = zoomRef;
		if (!target) return;
		target.current = zoom ?? null;
		return () => {
			if (target.current === zoom) target.current = null;
		};
	});
</script>
