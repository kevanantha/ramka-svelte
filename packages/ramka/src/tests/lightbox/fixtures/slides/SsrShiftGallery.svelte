<!--
	The open 4-slide gallery of the `ssrSlideShift` cases: the client test's
	inline tree and the SSR test's `renderOpenGallery`. `container` is the
	Portal's (the SSR test renders in place with `null`).
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import type { TextDirection } from '../../../../lib/lightbox';

	let {
		ssrSlideShift,
		dir,
		activeIndex = 2,
		container,
		contentLabel = 'viewer',
		itemLabel = 'item',
		slidesTestId
	}: {
		ssrSlideShift?: boolean;
		dir?: TextDirection;
		activeIndex?: number;
		container?: Element | string | null;
		contentLabel?: string;
		itemLabel?: string;
		slidesTestId?: string;
	} = $props();
</script>

<Lightbox.Root open value={activeIndex} {dir}>
	<Lightbox.Trigger index={0}>open</Lightbox.Trigger>
	<Lightbox.Portal {container}>
		<Lightbox.Content aria-label={contentLabel}>
			<Lightbox.Slides data-testid={slidesTestId} aria-label="Slides" {ssrSlideShift}>
				{#each [0, 1, 2, 3] as i (i)}
					<Lightbox.Slide>
						<Lightbox.Item index={i} aria-label="{i + 1} of 4">{itemLabel} {i}</Lightbox.Item>
					</Lightbox.Slide>
				{/each}
			</Lightbox.Slides>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
