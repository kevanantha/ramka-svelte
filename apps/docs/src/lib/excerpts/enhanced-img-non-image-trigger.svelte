<!-- @docs-excerpt-title Destination blur for non-image triggers -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import { blurPlaceholder } from '../blur-placeholder'; // @docs-replace import { blurPlaceholder } from '$lib/blur-placeholder';
	import photo from '../assets/photos/nextjs-image-do.jpg?enhanced'; // @docs-replace import photo from './portrait.jpg?enhanced';
	import lqip from '../assets/photos/nextjs-image-do.jpg?w=8&format=webp&inline'; // @docs-replace import lqip from './portrait.jpg?w=8&format=webp&inline';
</script>

<Lightbox.Root>
	<Lightbox.Trigger index={0} crossfade="both">
		<div class="flex size-16 items-center justify-center rounded-full bg-sky-700 text-white">
			AC
		</div>
	</Lightbox.Trigger>

	<Lightbox.Portal>
		<Lightbox.Backdrop />
		<Lightbox.Content>
			<Lightbox.Slides>
				<Lightbox.Slide>
					<Lightbox.Item index={0}>
						<Lightbox.Zoom>
							<Lightbox.Media width={photo.img.w} height={photo.img.h}>
								<enhanced:img
									src={photo}
									alt="Portrait"
									sizes="100vw"
									fetchpriority="high"
									style={blurPlaceholder(lqip, photo.img)}
								/>
							</Lightbox.Media>
						</Lightbox.Zoom>
					</Lightbox.Item>
				</Lightbox.Slide>
			</Lightbox.Slides>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
