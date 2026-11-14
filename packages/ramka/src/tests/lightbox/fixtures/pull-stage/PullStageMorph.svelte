<!-- Tree of "applies transform to the Stage morphRef node instead of the item". -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';
</script>

<Lightbox.Root open>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Pull stage morph">
			<Lightbox.Stage>
				{#snippet children({ morph })}
					<div {@attach morph} data-testid="frame">
						<SlidesHost>
							{#snippet children()}
								<Lightbox.Item index={0}>
									<img src="test.jpg" alt="test" />
								</Lightbox.Item>
							{/snippet}
						</SlidesHost>
					</div>
				{/snippet}
			</Lightbox.Stage>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
