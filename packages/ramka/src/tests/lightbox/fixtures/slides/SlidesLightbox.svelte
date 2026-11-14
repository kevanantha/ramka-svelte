<!--
	ramka's `SlidesLightbox` harness from lightbox-slides.test.tsx: an open
	Root with `itemCount` triggers, slides and thumbnails. `defaultValue` is
	passed unbound, so Root owns the index after mount.
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import type { NavigationSource, TextDirection } from '../../../../lib/lightbox';

	let {
		itemCount = 8,
		defaultValue = 0,
		loop = false,
		dir = 'ltr',
		onValueChange
	}: {
		itemCount?: number;
		defaultValue?: number;
		loop?: boolean;
		dir?: TextDirection;
		onValueChange?: (value: number, metadata: { source: NavigationSource }) => void;
	} = $props();
</script>

<Lightbox.Root open value={defaultValue} {loop} {dir} {onValueChange}>
	{#each { length: itemCount }, i (i)}
		<Lightbox.Trigger index={i} data-testid="trigger-{i}">Trigger {i}</Lightbox.Trigger>
	{/each}

	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Slides lightbox">
			<Lightbox.Slides data-testid="slides" preload={itemCount}>
				{#each { length: itemCount }, i (i)}
					<Lightbox.Slide data-testid="slide-{i}">
						<Lightbox.Item index={i} data-testid="item-{i}">Item {i}</Lightbox.Item>
					</Lightbox.Slide>
				{/each}
			</Lightbox.Slides>

			<Lightbox.ThumbnailGroup data-testid="thumb-group">
				{#each { length: itemCount }, i (i)}
					<Lightbox.Thumbnail index={i} data-testid="thumb-{i}">Thumb {i}</Lightbox.Thumbnail>
				{/each}
			</Lightbox.ThumbnailGroup>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
