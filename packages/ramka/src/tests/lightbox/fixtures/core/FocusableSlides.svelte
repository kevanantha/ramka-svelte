<!-- Three slides, each with a consumer-provided focusable button. -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';
</script>

<Lightbox.Root open value={0}>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Containment test">
			<SlidesHost preload={2} count={3}>
				{#snippet children(i)}
					<Lightbox.Item index={i} data-testid="item-{i}">
						<button data-testid="btn-{i}" type="button">Slide {i}</button>
					</Lightbox.Item>
				{/snippet}
			</SlidesHost>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
