<!-- @docs-excerpt-title Minimal morph -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	let { src, thumb }: { src: string; thumb: string } = $props(); // @docs-hide
</script>

<Lightbox.Root morphTo="active">
	<Lightbox.Trigger index={0}>
		{#snippet children({ image })}<img {@attach image} src={thumb} alt="" />{/snippet}
	</Lightbox.Trigger>

	<Lightbox.Portal>
		<Lightbox.Backdrop />
		<Lightbox.Content>
			<Lightbox.Slides>
				<Lightbox.Slide>
					<Lightbox.Item index={0}>
						<Lightbox.Zoom>
							<Lightbox.Media>
								<img {src} alt="" />
							</Lightbox.Media>
						</Lightbox.Zoom>
					</Lightbox.Item>
				</Lightbox.Slide>
			</Lightbox.Slides>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
