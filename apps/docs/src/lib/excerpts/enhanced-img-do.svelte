<!-- @docs-excerpt-title Do — blur on trigger only -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import { blurPlaceholder } from '../blur-placeholder'; // @docs-replace import { blurPlaceholder } from '$lib/blur-placeholder';
	import photo from '../assets/photos/nextjs-image-do.jpg?enhanced'; // @docs-replace import photo from './photo.jpg?enhanced';
	import lqip from '../assets/photos/nextjs-image-do.jpg?w=8&format=webp&inline'; // @docs-replace import lqip from './photo.jpg?w=8&format=webp&inline';
	const { w: width, h: height } = photo.img;
</script>

<Lightbox.Root>
	<Lightbox.Trigger index={0}>
		{#snippet children({ image })}
			<enhanced:img
				{@attach image}
				src={photo}
				alt="Photo"
				style={blurPlaceholder(lqip, photo.img)}
				class="aspect-square size-full object-cover"
			/>
		{/snippet}
	</Lightbox.Trigger>

	<Lightbox.Portal>
		<Lightbox.Backdrop />
		<Lightbox.Content>
			<Lightbox.Slides>
				<Lightbox.Slide>
					<Lightbox.Item index={0}>
						<Lightbox.Zoom>
							<Lightbox.Media {width} {height}>
								<!-- No placeholder — Ramka owns the open bridge. -->
								<enhanced:img src={photo} alt="Photo" sizes="100vw" fetchpriority="high" />
							</Lightbox.Media>
						</Lightbox.Zoom>
					</Lightbox.Item>
				</Lightbox.Slide>
			</Lightbox.Slides>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
