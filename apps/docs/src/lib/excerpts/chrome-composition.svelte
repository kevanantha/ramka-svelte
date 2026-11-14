<!-- @docs-excerpt-title Chrome composition -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';

	type Item = { src: string; thumb: string; alt: string; caption: string }; // @docs-hide
	let { items }: { items: Item[] } = $props(); // @docs-hide
</script>

<Lightbox.Root>
	<Lightbox.Portal>
		<Lightbox.Backdrop />
		<Lightbox.Content>
			<Lightbox.Slides>
				{#each items as item, i (item.src)}
					<Lightbox.Slide>
						<Lightbox.Item index={i} caption={item.caption}>
							<Lightbox.Zoom>
								<Lightbox.Media>
									<img src={item.src} alt={item.alt} />
								</Lightbox.Media>
							</Lightbox.Zoom>
						</Lightbox.Item>
					</Lightbox.Slide>
				{/each}
			</Lightbox.Slides>

			<Lightbox.Counter />
			<Lightbox.ZoomOut aria-label="Zoom out" />
			<Lightbox.ZoomIn aria-label="Zoom in" />
			<Lightbox.Close aria-label="Close" />

			<Lightbox.Caption />
			<Lightbox.ThumbnailStrip>
				<Lightbox.ThumbnailStripTrack aria-label="Photo thumbnails">
					{#each items as item, i (item.src)}
						<Lightbox.Thumbnail index={i}>
							<img src={item.thumb} alt="" />
						</Lightbox.Thumbnail>
					{/each}
				</Lightbox.ThumbnailStripTrack>
				<!-- Optional midline chrome — plain consumer markup -->
				<span aria-hidden="true"></span>
			</Lightbox.ThumbnailStrip>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
