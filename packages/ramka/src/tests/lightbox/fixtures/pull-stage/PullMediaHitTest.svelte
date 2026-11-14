<!-- Tree of "touch pull starts from Stage-wide targets but not interactive controls". -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';
</script>

<Lightbox.Root open>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Pull media hit-test">
			<SlidesHost>
				{#snippet children()}
					<Lightbox.Item index={0} class="relative">
						<div data-testid="chrome" style="position: absolute; inset: 0;">chrome</div>
						<button type="button" data-testid="control">Close</button>
						<Lightbox.Media data-testid="media">
							<img src="test.jpg" alt="test" />
						</Lightbox.Media>
					</Lightbox.Item>
				{/snippet}
			</SlidesHost>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
