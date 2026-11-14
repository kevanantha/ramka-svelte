<!-- @docs-excerpt-title Do — same source aspect -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import photo from '../assets/photos/nextjs-image-do.jpg?enhanced'; // @docs-replace import photo from './photo.jpg?enhanced';
	const { w: width, h: height } = photo.img;
</script>

<Lightbox.Root>
	<Lightbox.Trigger index={0}>
		{#snippet children({ image })}
			<enhanced:img
				{@attach image}
				src={photo}
				alt="Photo"
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
								<enhanced:img src={photo} alt="Photo" sizes="100vw" fetchpriority="high" />
							</Lightbox.Media>
						</Lightbox.Zoom>
					</Lightbox.Item>
				</Lightbox.Slide>
			</Lightbox.Slides>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
