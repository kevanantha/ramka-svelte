<!--
	ramka's `GestureLightbox` harness (lightbox-slides.test.tsx, "gesture
	suppression while scrolling"). React hands the observed slide's imperative
	`LightboxZoomRef` to `zoomRef`; here `zoomRef.current` receives that slide's
	zoom state (the `Lightbox.Zoom` children snippet argument, whose `zoom`
	getter stays live).
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import type { LightboxZoomState } from '../../../../lib/lightbox';

	let {
		withZoom = false,
		withButtons = false,
		zoomRef,
		observedIndex = 0,
		itemCount = 8
	}: {
		withZoom?: boolean;
		withButtons?: boolean;
		zoomRef?: { current: LightboxZoomState | null };
		observedIndex?: number;
		itemCount?: number;
	} = $props();

	function observe(index: number, state: LightboxZoomState) {
		return () => {
			if (index !== observedIndex || !zoomRef) return;
			zoomRef.current = state;
			return () => {
				if (zoomRef.current === state) zoomRef.current = null;
			};
		};
	}
</script>

<Lightbox.Root open value={0}>
	{#each { length: itemCount }, i (i)}
		<Lightbox.Trigger index={i}>Trigger {i}</Lightbox.Trigger>
	{/each}
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Gesture lightbox">
			{#if withButtons}
				<Lightbox.ZoomIn data-testid="zoom-in">+</Lightbox.ZoomIn>
			{/if}
			<Lightbox.Slides data-testid="slides" preload={itemCount}>
				{#each { length: itemCount }, i (i)}
					<Lightbox.Slide data-testid="slide-{i}">
						<Lightbox.Item index={i} data-testid="item-{i}">
							{#if withZoom}
								<Lightbox.Zoom maxZoom={4}>
									{#snippet children(state)}
										<img
											{@attach observe(i, state)}
											src="p{i}.jpg"
											alt="photo {i}"
											data-testid="img-{i}"
										/>
									{/snippet}
								</Lightbox.Zoom>
							{:else}
								<img src="p{i}.jpg" alt="photo {i}" data-testid="img-{i}" />
							{/if}
						</Lightbox.Item>
					</Lightbox.Slide>
				{/each}
			</Lightbox.Slides>
			<Lightbox.ThumbnailGroup data-testid="thumb-group">
				{#each { length: itemCount }, i (i)}
					<Lightbox.Thumbnail index={i} data-testid="thumb-{i}">Thumb {i}</Lightbox.Thumbnail>
				{/each}
			</Lightbox.ThumbnailGroup>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
