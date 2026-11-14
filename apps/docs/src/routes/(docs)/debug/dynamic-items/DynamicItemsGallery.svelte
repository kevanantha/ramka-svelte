<!-- Docs chrome gallery with exit classes for slides mid-removal. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Lightbox from 'ramka-svelte/lightbox';
	import X from '@lucide/svelte/icons/x';
	import ZoomIn from '@lucide/svelte/icons/zoom-in';
	import ZoomOut from '@lucide/svelte/icons/zoom-out';
	import { chromeButton, chromeButtonMd } from '#lib/components/chrome.js';
	import type { DynamicItem } from './animated-item-removal.svelte';
	import './dynamic-items.css';

	let {
		items,
		ariaLabel,
		isRemoving,
		overlay
	}: {
		items: DynamicItem[];
		ariaLabel: string;
		isRemoving: (item: DynamicItem) => boolean;
		/** In-viewer controls, rendered between the slides and the chrome. */
		overlay?: Snippet;
	} = $props();
</script>

<Lightbox.Portal>
	<Lightbox.Backdrop class="lightbox-demo-backdrop lightbox-demo-backdrop-light fixed inset-0" />
	<Lightbox.Content
		aria-label={ariaLabel}
		class="dynamic-items-root lightbox-demo-content fixed inset-0 flex flex-col overscroll-contain outline-none"
	>
		<Lightbox.Slides
			aria-label="Full-size images"
			preload={2}
			class="lightbox-demo-slides flex-1 gap-5 md:gap-0 [&::-webkit-scrollbar]:hidden"
		>
			{#each items as item, i (item.id)}
				<Lightbox.Slide class="lightbox-demo-slide-pad h-full">
					<Lightbox.Item index={i} caption={item.caption}>
						<div class="dynamic-items-exit-layer" data-removing={isRemoving(item) || undefined}>
							<Lightbox.Zoom maxZoom={6}>
								<Lightbox.Media
									width={item.width}
									height={item.height}
									class="overflow-hidden rounded-none md:rounded-lg"
								>
									<img
										src={item.src}
										alt={item.alt}
										width={item.width}
										height={item.height}
										loading="eager"
										draggable="false"
										class="select-none"
									/>
								</Lightbox.Media>
							</Lightbox.Zoom>
						</div>
					</Lightbox.Item>
				</Lightbox.Slide>
			{/each}
		</Lightbox.Slides>

		{@render overlay?.()}

		<div
			class="lightbox-demo-chrome-top lightbox-demo-chrome-hide absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] left-3 z-30"
		>
			<Lightbox.Counter
				class="min-w-[3.5rem] font-mono text-sm text-black/70 tabular-nums dark:text-white/70"
			/>
		</div>

		<div
			class="lightbox-demo-chrome-top lightbox-demo-chrome-hide absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] right-3 z-30 flex gap-2"
		>
			<Lightbox.ZoomOut class={chromeButtonMd} aria-label="Zoom out">
				<ZoomOut aria-hidden="true" class="h-4 w-4" strokeWidth={2.25} />
			</Lightbox.ZoomOut>
			<Lightbox.ZoomIn class={chromeButtonMd} aria-label="Zoom in">
				<ZoomIn aria-hidden="true" class="h-4 w-4" strokeWidth={2.25} />
			</Lightbox.ZoomIn>
			<Lightbox.Close class={chromeButton} aria-label="Close">
				<X aria-hidden="true" class="h-[18px] w-[18px]" strokeWidth={2.25} />
			</Lightbox.Close>
		</div>

		<div
			class="lightbox-demo-chrome-bottom lightbox-demo-chrome-hide pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-3 px-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
		>
			<Lightbox.Caption
				class="pointer-events-auto block min-h-[1.25rem] max-w-full truncate px-6 text-center text-sm text-black/70 dark:text-white/80"
			/>
			{#if items.length > 1}
				<Lightbox.ThumbnailStrip
					class="lightbox-demo-thumbnail-strip pointer-events-auto hidden md:block"
				>
					<Lightbox.ThumbnailStripTrack aria-label="Photo thumbnails">
						{#each items as item, i (item.id)}
							<Lightbox.Thumbnail
								index={i}
								class={isRemoving(item) ? 'dynamic-items-thumb-removing' : undefined}
							>
								<img src={item.thumb} alt={item.alt} draggable="false" />
							</Lightbox.Thumbnail>
						{/each}
					</Lightbox.ThumbnailStripTrack>
					<span class="lightbox-demo-thumbnail-strip-indicator" aria-hidden="true"></span>
				</Lightbox.ThumbnailStrip>
			{/if}
		</div>
	</Lightbox.Content>
</Lightbox.Portal>
