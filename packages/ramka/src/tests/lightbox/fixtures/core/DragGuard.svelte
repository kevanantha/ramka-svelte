<!-- An image slide plus chrome next to Slides, for the drag-dismiss guard. -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';
</script>

<Lightbox.Root open>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Drag dismiss guard">
			<SlidesHost>
				{#snippet children(i)}
					<Lightbox.Item index={i}>
						<img data-testid="media" src="test.jpg" alt="test" />
					</Lightbox.Item>
				{/snippet}
			</SlidesHost>
			<div data-testid="chrome">Caption / strip / sidebar</div>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
