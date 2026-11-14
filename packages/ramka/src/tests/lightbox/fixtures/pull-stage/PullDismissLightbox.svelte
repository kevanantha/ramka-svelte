<!-- ramka's `PullDismissLightbox` (pull-to-dismiss). -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';
	import ZoomCapture, { type ZoomRef } from './ZoomCapture.svelte';

	let {
		pullToClose,
		withZoom = false,
		zoomRef,
		label = 'Pull dismiss test'
	}: { pullToClose?: boolean; withZoom?: boolean; zoomRef?: ZoomRef; label?: string } = $props();
</script>

<Lightbox.Root open>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label={label} {pullToClose}>
			<SlidesHost>
				{#snippet children()}
					<Lightbox.Item index={0}>
						{#if withZoom}
							<Lightbox.Zoom maxZoom={4}>
								<ZoomCapture {zoomRef} />
								<img src="test.jpg" alt="test" />
							</Lightbox.Zoom>
						{:else}
							<img src="test.jpg" alt="test" />
						{/if}
					</Lightbox.Item>
				{/snippet}
			</SlidesHost>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
