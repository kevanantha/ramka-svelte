<!-- Tree of "reopening during an in-flight close resets the pull-dismiss state". -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';
</script>

<Lightbox.Root open>
	<Lightbox.Trigger index={0} data-testid="trigger">Open</Lightbox.Trigger>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Reopen after dismiss">
			<SlidesHost>
				{#snippet children()}
					<Lightbox.Item index={0}>
						<img src="test.jpg" alt="test" />
					</Lightbox.Item>
				{/snippet}
			</SlidesHost>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
