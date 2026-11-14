<!--
	`FullChromeLightbox` from ramka's lightbox-part-identity.test.tsx: every
	DOM-rendering part, mounted open, so identity-marker coverage is one pass.
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
</script>

<Lightbox.Root open>
	<Lightbox.Trigger index={0}>Open</Lightbox.Trigger>
	<Lightbox.Portal>
		<Lightbox.Backdrop />
		<Lightbox.Content aria-label="Gallery">
			<Lightbox.Stage>
				<Lightbox.Close aria-label="Close" />
				<Lightbox.Previous aria-label="Previous" />
				<Lightbox.Next aria-label="Next" />
				<Lightbox.Counter />
				<Lightbox.Caption />
				<Lightbox.ZoomIn aria-label="Zoom in" />
				<Lightbox.ZoomOut aria-label="Zoom out" />
				<Lightbox.Slides aria-label="Slides">
					<Lightbox.Slide>
						<Lightbox.Item index={0} caption="One">
							<Lightbox.Zoom>
								<Lightbox.Media width={100} height={100}>
									<img src="/a.jpg" alt="A" width={100} height={100} />
								</Lightbox.Media>
							</Lightbox.Zoom>
						</Lightbox.Item>
					</Lightbox.Slide>
				</Lightbox.Slides>
				<Lightbox.ThumbnailStrip>
					<Lightbox.ThumbnailStripTrack aria-label="Filmstrip">
						<Lightbox.Thumbnail index={0}>1</Lightbox.Thumbnail>
					</Lightbox.ThumbnailStripTrack>
				</Lightbox.ThumbnailStrip>
			</Lightbox.Stage>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
