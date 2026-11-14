<!-- Item 0 registers a caption, item 1 has none; Caption has a fallback. -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';
</script>

<Lightbox.Root open value={0}>
	<Lightbox.Portal>
		<Lightbox.Content aria-label="Test">
			<SlidesHost count={2}>
				{#snippet children(i)}
					<Lightbox.Item index={i} caption={i === 0 ? 'Registered caption' : undefined}>
						Item {i}
					</Lightbox.Item>
				{/snippet}
			</SlidesHost>
			<Lightbox.Caption data-testid="fallback-caption">Stale fallback</Lightbox.Caption>
			<Lightbox.Next data-testid="fallback-next">Next</Lightbox.Next>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
