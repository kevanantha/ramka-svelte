<!-- @docs-excerpt-title Anatomy -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
</script>

<Lightbox.Root>
	<Lightbox.Trigger index={0}><!-- thumb --></Lightbox.Trigger>
	<Lightbox.Portal>
		<Lightbox.Backdrop />
		<Lightbox.Content>
			<Lightbox.Slides>
				<Lightbox.Slide>
					<Lightbox.Item index={0}>
						<Lightbox.Zoom>
							<Lightbox.Media>
								<img alt="" />
							</Lightbox.Media>
						</Lightbox.Zoom>
					</Lightbox.Item>
				</Lightbox.Slide>
			</Lightbox.Slides>
			<Lightbox.Counter />
			<Lightbox.ZoomOut aria-label="Zoom out" />
			<Lightbox.ZoomIn aria-label="Zoom in" />
			<Lightbox.Close aria-label="Close" />
			<Lightbox.Caption />
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
