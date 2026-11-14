<!-- One slide holding a Zoom surface. -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';
</script>

<Lightbox.Root open value={0}>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Non-focusable slide test">
			<SlidesHost>
				{#snippet children(i)}
					<Lightbox.Item index={i} data-testid="item-0">
						<Lightbox.Zoom maxZoom={4}>
							<img src="a.jpg" alt="a" />
						</Lightbox.Zoom>
					</Lightbox.Item>
				{/snippet}
			</SlidesHost>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
