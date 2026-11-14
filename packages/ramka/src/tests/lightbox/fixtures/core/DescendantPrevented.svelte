<!-- A descendant that handles ArrowRight itself (preventDefault) before Content. -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';
</script>

<Lightbox.Root open value={0}>
	<Lightbox.Trigger index={0}>Trigger 0</Lightbox.Trigger>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Dedupe test">
			<div
				role="presentation"
				data-testid="descendant"
				onkeydown={(event) => {
					if (event.key === 'ArrowRight') event.preventDefault();
				}}
			>
				<SlidesHost preload={1} count={3}>
					{#snippet children(i)}
						<Lightbox.Item index={i} data-testid="item-{i}">Item {i}</Lightbox.Item>
					{/snippet}
				</SlidesHost>
			</div>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
