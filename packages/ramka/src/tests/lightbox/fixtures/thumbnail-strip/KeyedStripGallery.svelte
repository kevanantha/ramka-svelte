<!--
	Port-only fixture: an open Root whose slides and thumbs are keyed by item
	id, so inserting or removing an item shifts the indices of the thumbs that
	stay mounted (StripGallery keys by index, which never shifts).
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';

	let { ids }: { ids: string[] } = $props();
</script>

<Lightbox.Root open>
	<Lightbox.Trigger index={0}>open</Lightbox.Trigger>
	<Lightbox.Portal>
		<Lightbox.Content aria-label="Keyed ThumbnailStrip test">
			<Lightbox.Slides data-testid="slides" aria-label="Slides">
				{#each ids as id, i (id)}
					<Lightbox.Slide>
						<Lightbox.Item index={i}>item {id}</Lightbox.Item>
					</Lightbox.Slide>
				{/each}
			</Lightbox.Slides>
			<Lightbox.ThumbnailStrip data-testid="thumbnail-strip">
				<Lightbox.ThumbnailStripTrack data-testid="thumbnail-strip-track" aria-label="Thumbs">
					{#each ids as id, i (id)}
						<Lightbox.Thumbnail index={i}>{id}</Lightbox.Thumbnail>
					{/each}
				</Lightbox.ThumbnailStripTrack>
			</Lightbox.ThumbnailStrip>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
