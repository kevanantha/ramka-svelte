<!-- Tree of "does not activate when touch starts on controls outside an item". -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';
</script>

<Lightbox.Root open>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Controls test">
			<SlidesHost>
				{#snippet children()}
					<Lightbox.Item index={0}>
						<img src="test.jpg" alt="test" />
					</Lightbox.Item>
				{/snippet}
			</SlidesHost>
			<button data-testid="close-btn">Close</button>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
