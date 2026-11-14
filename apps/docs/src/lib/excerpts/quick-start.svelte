<!-- @docs-excerpt-title App.svelte -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import type { Photo } from './types'; // @docs-hide

	let { items }: { items: Photo[] } = $props(); // @docs-hide
</script>

<Lightbox.Root>
	{#each items as item, i (item.id)}
		<Lightbox.Trigger index={i}>
			{#snippet children({ image })}
				<img {@attach image} src={item.thumb} alt={item.alt} />
			{/snippet}
		</Lightbox.Trigger>
	{/each}

	<Lightbox.Portal>
		<Lightbox.Backdrop />
		<!-- Every string here is yours — the library ships none, so nothing it
		     renders is ever in the wrong language. -->
		<Lightbox.Content aria-label="Photo viewer">
			<Lightbox.Slides aria-label="Photos" aria-roledescription="carousel">
				{#each items as item, i (item.id)}
					<Lightbox.Slide>
						<Lightbox.Item
							index={i}
							caption={item.caption ?? item.alt}
							aria-roledescription="slide"
							aria-label="{i + 1} of {items.length}"
						>
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
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
