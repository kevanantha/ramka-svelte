<!--
	Trees without a ref: `orphan-in` / `orphan-out` render a ZoomIn / ZoomOut
	with no Zoom anywhere; `default-max` a Zoom without `maxZoom` or image.
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';

	let { variant }: { variant: 'orphan-in' | 'orphan-out' | 'default-max' } = $props();
</script>

<Lightbox.Root open>
	<Lightbox.Portal>
		{#if variant === 'default-max'}
			<Lightbox.Content aria-label="Default maxZoom">
				<SlidesHost>
					{#snippet children()}
						<Lightbox.Item index={0}>
							<Lightbox.Zoom>
								<div>No image</div>
							</Lightbox.Zoom>
						</Lightbox.Item>
					{/snippet}
				</SlidesHost>
			</Lightbox.Content>
		{:else}
			<Lightbox.Content aria-label="No zoom">
				{#if variant === 'orphan-in'}
					<Lightbox.ZoomIn data-testid="orphan-zoom-in">+</Lightbox.ZoomIn>
				{:else}
					<Lightbox.ZoomOut data-testid="orphan-zoom-out">-</Lightbox.ZoomOut>
				{/if}
			</Lightbox.Content>
		{/if}
	</Lightbox.Portal>
</Lightbox.Root>
