<!--
	The tree of ramka's "hydration handoff" case: an open, server-rendered
	(Portal in place) Root on slide 2 with `ssrSlideShift` Slides and a
	ThumbnailStrip.
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
</script>

<Lightbox.Root open value={2}>
	{#each { length: 4 }, i (i)}
		<Lightbox.Trigger index={i} data-testid="trigger-{i}">open {i}</Lightbox.Trigger>
	{/each}
	<Lightbox.Portal container={null}>
		<Lightbox.Content aria-label="hydration handoff">
			<Lightbox.Slides data-testid="slides" ssrSlideShift aria-label="Slides">
				{#each { length: 4 }, i (i)}
					<Lightbox.Slide>
						<Lightbox.Item index={i} aria-label="{i + 1} of 4">Item {i}</Lightbox.Item>
					</Lightbox.Slide>
				{/each}
			</Lightbox.Slides>
			<Lightbox.ThumbnailStrip data-testid="strip">
				<Lightbox.ThumbnailStripTrack aria-label="Thumbs">
					{#each { length: 4 }, i (i)}
						<Lightbox.Thumbnail index={i}>t{i}</Lightbox.Thumbnail>
					{/each}
				</Lightbox.ThumbnailStripTrack>
			</Lightbox.ThumbnailStrip>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
