<!--
	`Gallery` from ramka's lightbox-thumbnail-strip.test.tsx, plus the inline
	trees of its other cases (they differ only in count, Previous / Next and the
	strip's props): an open Root with plain Slides and a ThumbnailStrip.
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import type { LightboxThumbnailStripProps } from '../../../../lib/lightbox';
	import type { TextDirection } from '../../../../lib/lightbox/lightbox-direction';

	let {
		count = 5,
		dir,
		label = 'ThumbnailStrip test',
		withNav = false,
		scrubOnSelect,
		selectViewTransition,
		wrapSelectCommit
	}: {
		count?: number;
		dir?: TextDirection;
		label?: string;
		/** Render Previous / Next (`data-testid="prev"` / `"next"`). */
		withNav?: boolean;
	} & Pick<
		LightboxThumbnailStripProps,
		'scrubOnSelect' | 'selectViewTransition' | 'wrapSelectCommit'
	> = $props();
</script>

<Lightbox.Root open {dir}>
	<Lightbox.Trigger index={0}>open</Lightbox.Trigger>
	<Lightbox.Portal>
		<Lightbox.Content aria-label={label}>
			<Lightbox.Slides data-testid="slides" aria-label="Slides">
				{#each { length: count }, i (i)}
					<Lightbox.Slide>
						<Lightbox.Item index={i}>item {i}</Lightbox.Item>
					</Lightbox.Slide>
				{/each}
			</Lightbox.Slides>
			{#if withNav}
				<Lightbox.Previous data-testid="prev" aria-label="Previous" />
				<Lightbox.Next data-testid="next" aria-label="Next" />
			{/if}
			<Lightbox.ThumbnailStrip
				data-testid="thumbnail-strip"
				{scrubOnSelect}
				{selectViewTransition}
				{wrapSelectCommit}
			>
				<Lightbox.ThumbnailStripTrack data-testid="thumbnail-strip-track" aria-label="Thumbs">
					{#each { length: count }, i (i)}
						<Lightbox.Thumbnail index={i} data-testid="thumb-{i}">t{i}</Lightbox.Thumbnail>
					{/each}
				</Lightbox.ThumbnailStripTrack>
			</Lightbox.ThumbnailStrip>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
