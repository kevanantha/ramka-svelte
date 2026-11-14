<!-- @docs-excerpt-title Setting the direction -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import type { Photo } from './types'; // @docs-hide
	let { images }: { images: Photo[] } = $props(); // @docs-hide
</script>

<Lightbox.Root dir="rtl">
	<Lightbox.Portal>
		<Lightbox.Backdrop />
		<Lightbox.Content aria-label="גלריית תמונות">
			<Lightbox.Slides>
				{#each images as img, i (img.id)}
					<Lightbox.Slide>
						<Lightbox.Item index={i}>
							<Lightbox.Media>
								<img src={img.src} alt={img.alt} />
							</Lightbox.Media>
						</Lightbox.Item>
					</Lightbox.Slide>
				{/each}
			</Lightbox.Slides>
			<Lightbox.Close aria-label="סגירה" />
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
