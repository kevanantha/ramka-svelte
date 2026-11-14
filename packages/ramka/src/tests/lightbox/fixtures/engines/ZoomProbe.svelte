<!-- Hands the enclosing Zoom's context out, where React's suite took a `LightboxZoomRef`. -->
<script lang="ts">
	import {
		getLightboxZoomContext,
		type LightboxZoomContext
	} from '../../../../lib/lightbox/LightboxZoom.svelte';

	let { onzoom }: { onzoom: (zoom: LightboxZoomContext | undefined) => void } = $props();

	// svelte-ignore state_referenced_locally
	onzoom(getLightboxZoomContext());
</script>
