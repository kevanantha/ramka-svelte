<!--
	Stands in for React's `<Lightbox.Zoom ref={ref}>` (`LightboxZoomRef`):
	rendered inside a `Lightbox.Zoom` and given that Zoom's `bind:this`
	instance, it publishes a ref-shaped object into `zoomRef.current`. The
	pose reads go through the instance's live `getPose()`, like React's ref
	getters; `maxZoom` comes from the zoom context.
-->
<script lang="ts" module>
	/** React's `LightboxZoomRef`. */
	export interface LightboxZoomRef {
		readonly zoom: number;
		readonly maxZoom: number;
		readonly offsetX: number;
		readonly offsetY: number;
		zoomIn(): void;
		zoomOut(): void;
		zoomTo(target: number, options?: { rapid?: boolean; dx?: number; dy?: number }): void;
		reset(rapid?: boolean): void;
	}

	export type ZoomRef = { current: LightboxZoomRef | null };

	export function createZoomRef(): ZoomRef {
		return { current: null };
	}
</script>

<script lang="ts">
	import { getLightboxZoomContext } from '../../../../lib/lightbox/LightboxZoom.svelte';
	import type * as Lightbox from '../../../../lib/lightbox';

	let {
		zoomRef,
		instance
	}: { zoomRef: ZoomRef; instance: ReturnType<typeof Lightbox.Zoom> | undefined } = $props();

	const zoom = getLightboxZoomContext();

	$effect.pre(() => {
		const target = zoomRef;
		const handleOf = instance;
		if (!zoom || !handleOf) return;
		const handle: LightboxZoomRef = {
			get zoom() {
				return handleOf.getPose().zoom;
			},
			get maxZoom() {
				return zoom.maxZoom;
			},
			get offsetX() {
				return handleOf.getPose().offsetX;
			},
			get offsetY() {
				return handleOf.getPose().offsetY;
			},
			zoomIn: handleOf.zoomIn,
			zoomOut: handleOf.zoomOut,
			zoomTo: handleOf.zoomTo,
			reset: handleOf.reset
		};
		target.current = handle;
		return () => {
			if (target.current === handle) target.current = null;
		};
	});
</script>
