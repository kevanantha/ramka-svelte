<!--
	The tree of ramka's "never serializes data-positioned" case: an open Root
	on slide 1, Portal in place, Slides and a ThumbnailStrip.
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
</script>

<Lightbox.Root open value={1}>
	<Lightbox.Trigger index={0}>open</Lightbox.Trigger>
	<Lightbox.Portal container={null}>
		<Lightbox.Content aria-label="viewer">
			<Lightbox.Slides aria-label="Slides">
				{#each [0, 1, 2] as i (i)}
					<Lightbox.Slide>
						<Lightbox.Item index={i}>item {i}</Lightbox.Item>
					</Lightbox.Slide>
				{/each}
			</Lightbox.Slides>
			<Lightbox.ThumbnailStrip data-testid="strip">
				<Lightbox.ThumbnailStripTrack aria-label="Thumbs">
					{#each [0, 1, 2] as i (i)}
						<Lightbox.Thumbnail index={i}>t{i}</Lightbox.Thumbnail>
					{/each}
				</Lightbox.ThumbnailStripTrack>
			</Lightbox.ThumbnailStrip>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
