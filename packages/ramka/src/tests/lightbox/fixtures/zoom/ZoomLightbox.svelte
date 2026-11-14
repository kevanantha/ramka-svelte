<!-- ramka's `ZoomLightbox` (describe('zoom')): two zoomable slides, controls inside slide 0. -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';

	let { maxZoom = 4, onZoomChange }: { maxZoom?: number; onZoomChange?: (z: number) => void } =
		$props();
</script>

<Lightbox.Root open>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Zoom test">
			<SlidesHost count={2}>
				{#snippet children(i)}
					<Lightbox.Item index={i} data-testid="item-{i}">
						{#if i === 0}
							<Lightbox.Zoom {maxZoom} {onZoomChange}>
								<img src="test.jpg" alt="test" data-testid="zoom-img" />
								<Lightbox.ZoomIn data-testid="zoom-in">+</Lightbox.ZoomIn>
								<Lightbox.ZoomOut data-testid="zoom-out">-</Lightbox.ZoomOut>
							</Lightbox.Zoom>
						{:else}
							<Lightbox.Zoom {maxZoom}>
								<img src="test2.jpg" alt="test2" />
							</Lightbox.Zoom>
						{/if}
					</Lightbox.Item>
				{/snippet}
			</SlidesHost>
			<Lightbox.Next data-testid="next">Next</Lightbox.Next>
			<Lightbox.Previous data-testid="prev">Previous</Lightbox.Previous>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
