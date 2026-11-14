<!-- @docs-excerpt-title Active-zoom bridge -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	let { src, alt }: { src: string; alt: string } = $props(); // @docs-hide
</script>

<Lightbox.Root>
	<Lightbox.Portal>
		<Lightbox.Backdrop />
		<Lightbox.Content>
			<!-- Toolbar chrome — targets the active slide's Zoom -->
			<Lightbox.ZoomOut aria-label="Zoom out" />
			<Lightbox.ZoomIn aria-label="Zoom in" />

			<Lightbox.Slides>
				<Lightbox.Slide>
					<Lightbox.Item index={0}>
						<Lightbox.Zoom>
							<Lightbox.Media>
								<img {src} {alt} />
							</Lightbox.Media>
						</Lightbox.Zoom>
					</Lightbox.Item>
				</Lightbox.Slide>
			</Lightbox.Slides>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
