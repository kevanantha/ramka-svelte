<script lang="ts" module>
	import type { LightboxThumbnailGroupProps } from './LightboxThumbnailGroup.svelte';

	export type LightboxThumbnailStripTrackProps = LightboxThumbnailGroupProps;
</script>

<script lang="ts">
	/**
	 * Linked tablist track for `Lightbox.ThumbnailStrip`.
	 *
	 * A `ThumbnailGroup` that registers as the ScrollTimeline transform target.
	 * The parent ThumbnailStrip writes midline `padding-inline`, the travel CSS
	 * var, and the link animation. Flex, gap, and thumb sizing stay consumer CSS.
	 */
	import LightboxThumbnailGroup from './LightboxThumbnailGroup.svelte';
	import { getLightboxThumbnailStripContext } from './lightbox-thumbnail-strip-context';

	let { ref = $bindable(null), ...rest }: LightboxThumbnailStripTrackProps = $props();

	const strip = getLightboxThumbnailStripContext();

	$effect(() => {
		const node = ref;
		if (!node) return;
		strip.registerTrack(node);
		return () => strip.registerTrack(null);
	});
</script>

<LightboxThumbnailGroup bind:ref {...rest} data-ramka-thumbnail-strip-track="" />
