<!--
	ramka's `StageZoomLightbox` (Lightbox.Stage zoom scoping). `stage={false}`
	is the "ctrl+wheel still zooms without Stage" tree: no Stage, no sidebar.
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';
	import ZoomCapture, { type ZoomRef } from './ZoomCapture.svelte';

	let { zoomRef, stage = true }: { zoomRef: ZoomRef; stage?: boolean } = $props();
</script>

{#snippet slides()}
	<SlidesHost>
		{#snippet children()}
			<Lightbox.Item index={0}>
				<Lightbox.Zoom maxZoom={4}>
					<ZoomCapture {zoomRef} />
					<img src="test.jpg" alt="test" data-testid="zoom-img" />
				</Lightbox.Zoom>
			</Lightbox.Item>
		{/snippet}
	</SlidesHost>
{/snippet}

<Lightbox.Root open>
	<Lightbox.Portal>
		{#if stage}
			<Lightbox.Content data-testid="content" aria-label="Stage zoom scope test">
				<Lightbox.Stage data-testid="stage">
					{@render slides()}
				</Lightbox.Stage>
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<aside data-testid="sidebar" tabindex={0}>Thread</aside>
			</Lightbox.Content>
		{:else}
			<Lightbox.Content data-testid="content" aria-label="No-stage zoom test">
				{@render slides()}
			</Lightbox.Content>
		{/if}
	</Lightbox.Portal>
</Lightbox.Root>
