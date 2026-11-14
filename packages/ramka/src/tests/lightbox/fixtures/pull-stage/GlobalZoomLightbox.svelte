<!-- ramka's `GlobalZoomLightbox` (global zoom controls). -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';
	import ZoomCapture, { type ZoomRef } from './ZoomCapture.svelte';

	let { refs, maxZoom = 4 }: { refs?: ZoomRef[]; maxZoom?: number } = $props();

	const images = [
		{ src: 'a.jpg', alt: 'a' },
		{ src: 'b.jpg', alt: 'b' }
	];
</script>

<Lightbox.Root open>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Global zoom test">
			<SlidesHost count={2}>
				{#snippet children(i)}
					<Lightbox.Item index={i} data-testid="item-{i}">
						<Lightbox.Zoom {maxZoom}>
							<ZoomCapture zoomRef={refs?.[i]} />
							<img src={images[i].src} alt={images[i].alt} />
						</Lightbox.Zoom>
					</Lightbox.Item>
				{/snippet}
			</SlidesHost>
			<!-- Single shared control set outside every Zoom -->
			<Lightbox.ZoomIn data-testid="zoom-in">+</Lightbox.ZoomIn>
			<Lightbox.ZoomOut data-testid="zoom-out">-</Lightbox.ZoomOut>
			<Lightbox.Next data-testid="next">Next</Lightbox.Next>
			<Lightbox.Previous data-testid="prev">Previous</Lightbox.Previous>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
