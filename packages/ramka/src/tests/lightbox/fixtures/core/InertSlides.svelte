<!-- Two image slides. -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';

	const images = ['a', 'b'];
</script>

<Lightbox.Root open value={0}>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Inert slide test">
			<SlidesHost count={images.length}>
				{#snippet children(i)}
					<Lightbox.Item index={i} data-testid="item-{i}">
						<img src="{images[i]}.jpg" alt={images[i]} />
					</Lightbox.Item>
				{/snippet}
			</SlidesHost>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
