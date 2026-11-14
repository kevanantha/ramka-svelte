<!--
	The one-off `<Lightbox.Zoom ref={ref}>` trees of describe('zoom'): slide 0
	holds a Zoom whose `bind:this` handle is published into `zoomRef` (React's
	imperative `LightboxZoomRef`), optionally with `ZoomPanProbe`.

	- `slides={2}` adds a second zoomable slide; `next` a Next button.
	- `controls` renders ZoomIn / ZoomOut after the slides (outside any Zoom).
	- `media` wraps the image in `Lightbox.Media data-testid="media"`.
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';
	import ZoomRefCapture, { type ZoomRef } from './ZoomRefCapture.svelte';
	import ZoomPanProbe, { type PanRef } from './ZoomPanProbe.svelte';

	let {
		zoomRef,
		panRef,
		label,
		testid,
		onZoomChange,
		slides = 1,
		next = false,
		controls = false,
		media = false
	}: {
		zoomRef: ZoomRef;
		panRef?: PanRef;
		label: string;
		/** Content's `data-testid`. */
		testid?: string;
		onZoomChange?: (zoom: number) => void;
		slides?: 1 | 2;
		next?: boolean;
		controls?: boolean;
		media?: boolean;
	} = $props();

	let zoomInstance: ReturnType<typeof Lightbox.Zoom> | undefined = $state();
</script>

<Lightbox.Root open>
	<Lightbox.Portal>
		<Lightbox.Content data-testid={testid} aria-label={label}>
			<SlidesHost count={slides}>
				{#snippet children(i)}
					<Lightbox.Item index={i}>
						{#if i === 0}
							<Lightbox.Zoom bind:this={zoomInstance} maxZoom={4} {onZoomChange}>
								<ZoomRefCapture {zoomRef} instance={zoomInstance} />
								{#if media}
									<Lightbox.Media data-testid="media">
										<img src="test.jpg" alt="test" />
									</Lightbox.Media>
								{:else}
									<img src="test.jpg" alt="test" data-testid="zoom-img" />
								{/if}
								{#if panRef}
									<ZoomPanProbe {panRef} />
								{/if}
							</Lightbox.Zoom>
						{:else}
							<Lightbox.Zoom maxZoom={4}>
								<img src="test2.jpg" alt="test2" />
							</Lightbox.Zoom>
						{/if}
					</Lightbox.Item>
				{/snippet}
			</SlidesHost>
			{#if next}
				<Lightbox.Next data-testid="next">Next</Lightbox.Next>
			{/if}
			{#if controls}
				<Lightbox.ZoomIn data-testid="zoom-in">+</Lightbox.ZoomIn>
				<Lightbox.ZoomOut data-testid="zoom-out">-</Lightbox.ZoomOut>
			{/if}
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
