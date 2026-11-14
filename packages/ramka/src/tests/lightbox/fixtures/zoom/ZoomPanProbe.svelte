<!--
	ramka's `ZoomPanProbe`: publishes the enclosing Zoom's `changeOffsets`
	(called with the gesture path's extra `overscroll` / `overflowAxesOnly`
	arguments) into `panRef.current`.
-->
<script lang="ts" module>
	export type OverscrollPan = (
		dx: number,
		dy: number,
		overscroll?: boolean,
		overflowAxesOnly?: boolean
	) => void;

	export type PanRef = { current: OverscrollPan | null };
</script>

<script lang="ts">
	import { getLightboxZoomContext } from '../../../../lib/lightbox/LightboxZoom.svelte';

	let { panRef }: { panRef: PanRef } = $props();

	const zoom = getLightboxZoomContext();

	$effect.pre(() => {
		panRef.current = (zoom?.changeOffsets ?? null) as OverscrollPan | null;
	});
</script>
