<!-- Tree of "wheel pull ignores events whose target is outside Stage". -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';
</script>

<Lightbox.Root open>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Stage wheel test">
			<Lightbox.Stage data-testid="stage">
				<SlidesHost>
					{#snippet children()}
						<Lightbox.Item index={0}>
							<img src="test.jpg" alt="test" />
						</Lightbox.Item>
					{/snippet}
				</SlidesHost>
			</Lightbox.Stage>
			<aside data-testid="sidebar">Thread</aside>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
