<!-- @docs-excerpt-title Destination blur for +N extras -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import { blurPlaceholder } from '../blur-placeholder'; // @docs-replace import { blurPlaceholder } from '$lib/blur-placeholder';
	import type { Picture } from '@sveltejs/enhanced-img';

	// `?enhanced` pictures, each with its `?w=8&format=webp&inline` LQIP.
	let { photos, visible }: { photos: { photo: Picture; lqip: string }[]; visible: number } =
		$props();
</script>

<Lightbox.Root morphTo="closest">
	{#each photos.slice(0, visible) as { photo, lqip }, i (photo.img.src)}
		<Lightbox.Trigger index={i} crossfade={i === visible - 1 ? 'both' : undefined}>
			{#snippet children({ image })}
				<enhanced:img {@attach image} src={photo} alt="" style={blurPlaceholder(lqip, photo.img)} />
			{/snippet}
		</Lightbox.Trigger>
	{/each}

	<Lightbox.Portal>
		<Lightbox.Backdrop />
		<Lightbox.Content>
			<Lightbox.Slides>
				{#each photos as { photo, lqip }, i (photo.img.src)}
					<Lightbox.Slide>
						<Lightbox.Item index={i}>
							<Lightbox.Zoom>
								<Lightbox.Media width={photo.img.w} height={photo.img.h}>
									<!-- Overflow indexes only — siblings with trigger thumbs stay clean. -->
									<enhanced:img
										src={photo}
										alt=""
										sizes="100vw"
										fetchpriority="high"
										style={i >= visible ? blurPlaceholder(lqip, photo.img) : undefined}
									/>
								</Lightbox.Media>
							</Lightbox.Zoom>
						</Lightbox.Item>
					</Lightbox.Slide>
				{/each}
			</Lightbox.Slides>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
