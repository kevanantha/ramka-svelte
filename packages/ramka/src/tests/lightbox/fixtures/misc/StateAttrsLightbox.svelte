<!--
	lightbox-state-attributes.test.tsx's tree: every state-bearing part mounted
	open, with trigger 0's image doubling as its morph element.
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
</script>

<Lightbox.Root open value={0}>
	<Lightbox.Trigger index={0} data-testid="trigger-0">
		{#snippet children({ image, morph })}
			<img {@attach image} {@attach morph} data-testid="morph-el" src="thumb.jpg" alt="thumb" />
		{/snippet}
	</Lightbox.Trigger>
	<Lightbox.Trigger index={1}>
		<img src="thumb-b.jpg" alt="thumb b" />
	</Lightbox.Trigger>
	<Lightbox.Portal>
		<Lightbox.Backdrop />
		<Lightbox.Content aria-label="state attrs">
			<Lightbox.Close>Close</Lightbox.Close>
			<Lightbox.Counter />
			<Lightbox.Caption />
			<Lightbox.Slides>
				<Lightbox.Slide>
					<Lightbox.Item index={0} caption="First">
						<Lightbox.Zoom maxZoom={4}>
							<Lightbox.Media width={800} height={600}>
								<img src="full.jpg" alt="full" width={800} height={600} />
							</Lightbox.Media>
							<Lightbox.ZoomIn data-testid="zoom-in">+</Lightbox.ZoomIn>
							<Lightbox.ZoomOut>-</Lightbox.ZoomOut>
						</Lightbox.Zoom>
					</Lightbox.Item>
				</Lightbox.Slide>
				<Lightbox.Slide>
					<Lightbox.Item index={1} caption="Second">
						<img src="full-b.jpg" alt="full b" />
					</Lightbox.Item>
				</Lightbox.Slide>
			</Lightbox.Slides>
			<Lightbox.ThumbnailGroup>
				<Lightbox.Thumbnail index={0}>0</Lightbox.Thumbnail>
				<Lightbox.Thumbnail index={1}>1</Lightbox.Thumbnail>
			</Lightbox.ThumbnailGroup>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
