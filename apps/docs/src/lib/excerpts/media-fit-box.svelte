<!-- @docs-excerpt-title Media fill + fit-box -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	let {
		src,
		alt,
		width,
		height
	}: { src: string; alt: string; width: number; height: number } = // @docs-hide
		$props(); // @docs-hide
</script>

<Lightbox.Root>
	<Lightbox.Portal>
		<Lightbox.Backdrop />
		<Lightbox.Content class="fixed inset-0 flex flex-col">
			<Lightbox.Slides class="flex-1">
				<Lightbox.Slide class="h-full p-8">
					<Lightbox.Item index={0}>
						<!-- Zoom fills the Slide content box; pad the Slide for chrome insets. -->
						<Lightbox.Zoom>
							<Lightbox.Media {width} {height}>
								<img {width} {height} {src} {alt} />
							</Lightbox.Media>
						</Lightbox.Zoom>
					</Lightbox.Item>
				</Lightbox.Slide>
			</Lightbox.Slides>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
