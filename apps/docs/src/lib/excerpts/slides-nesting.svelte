<!-- @docs-excerpt-title Slides + Slide nesting -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import type { Photo } from './types'; // @docs-hide
	let { items }: { items: Photo[] } = $props(); // @docs-hide
</script>

<Lightbox.Root>
	<Lightbox.Portal>
		<Lightbox.Backdrop />
		<Lightbox.Content>
			<Lightbox.Slides preload={1}>
				{#each items as item, i (item.id)}
					<Lightbox.Slide>
						<Lightbox.Item index={i}>
							<Lightbox.Zoom>
								<Lightbox.Media>
									<img src={item.src} alt={item.alt} />
								</Lightbox.Media>
							</Lightbox.Zoom>
						</Lightbox.Item>
					</Lightbox.Slide>
				{/each}
			</Lightbox.Slides>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
