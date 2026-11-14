<!-- Hands the enclosing Zoom's context out (React's `LightboxZoom` ref). -->
<script lang="ts">
	import {
		getLightboxZoomContext,
		type LightboxZoomContext
	} from '../../../../lib/lightbox/LightboxZoom.svelte';

	let { onzoom }: { onzoom: (zoom: LightboxZoomContext) => void } = $props();

	const zoom = getLightboxZoomContext();
	// svelte-ignore state_referenced_locally
	if (zoom) onzoom(zoom);
</script>
