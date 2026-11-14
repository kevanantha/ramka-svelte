<!--
  The shared fullscreen viewer from the original docs: backdrop, Slides +
  Media, Close (top-end), the Peek/Theater toggle, caption + counter and the
  scroll-linked thumbnail strip (desktop). Place beside Triggers under Lightbox.Root.
  The `slide` snippet replaces the default Zoom + Media + img of each item.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import X from '@lucide/svelte/icons/x';
	import GalleryHorizontal from '@lucide/svelte/icons/gallery-horizontal';
	import RectangleHorizontal from '@lucide/svelte/icons/rectangle-horizontal';
	import ZoomIn from '@lucide/svelte/icons/zoom-in';
	import ZoomOut from '@lucide/svelte/icons/zoom-out';
	import { flushSync, type Snippet } from 'svelte';
	import {
		chromeButton,
		chromeButtonGroup,
		chromeButtonMd,
		chromeButtonSegment,
		chromeSegmentDivider
	} from './chrome';
	import type { GalleryItem } from '#lib/photos.js';

	type SlidesLayout = 'bleed' | 'snug';

	let {
		items,
		ariaLabel,
		preload = 3,
		maxZoom = 6,
		zoomControls = true,
		backdrop = 'scrim',
		slidesLayout = 'bleed',
		layoutToggle = false,
		thumbnails = 'desktop',
		slide
	}: {
		items: GalleryItem[];
		ariaLabel: string;
		preload?: number;
		maxZoom?: number;
		/** Desktop zoom −/+ buttons in the top chrome. */
		zoomControls?: boolean;
		/** `scrim` — translucent; `solid` — opaque page color. */
		backdrop?: 'scrim' | 'solid';
		/**
		 * `bleed` — each slide spans the viewport. `snug` — on `md+` each slide
		 * is as wide as its photo, with a gap, so the neighbours peek in.
		 */
		slidesLayout?: SlidesLayout;
		/**
		 * Desktop Peek/Theater toggle. `slidesLayout` is then only the
		 * first-visit default; the user's choice persists in localStorage.
		 */
		layoutToggle?: boolean;
		/** Thumbnail strip on desktop (multi-item galleries), or `never`. */
		thumbnails?: 'desktop' | 'never';
		/** Custom slide content (video, 3D, …) in place of Zoom + Media + img. */
		slide?: Snippet<[item: GalleryItem, index: number]>;
	} = $props();

	// Same key as the original docs, so the preference carries over.
	const STORAGE_KEY = 'ramka-docs-slides-layout';

	function readStoredLayout(): SlidesLayout | null {
		if (typeof window === 'undefined') return null;
		try {
			const value = localStorage.getItem(STORAGE_KEY);
			return value === 'snug' || value === 'bleed' ? value : null;
		} catch {
			return null;
		}
	}

	let chosenLayout = $state<SlidesLayout | null>(readStoredLayout());
	const layout = $derived(layoutToggle ? (chosenLayout ?? slidesLayout) : slidesLayout);
	const snug = $derived(layout === 'snug');

	const ratio = (item: GalleryItem) => item.width / item.height;

	function toggleLayout() {
		const flip = () => {
			chosenLayout = snug ? 'bleed' : 'snug';
			try {
				localStorage.setItem(STORAGE_KEY, chosenLayout);
			} catch {
				// Storage unavailable: the toggle still works for this session.
			}
		};
		// Default root crossfade between the two layouts (the keyed Slides
		// remount swaps the geometry; the transition dissolves old → new).
		const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduceMotion || typeof document.startViewTransition !== 'function') flip();
		else document.startViewTransition(() => flushSync(flip));
	}

	// No strip → solo layout: tighter bottom band with the placard centered in it.
	const showStrip = $derived(thumbnails !== 'never' && items.length > 1);

	const backdropTone = $derived(
		backdrop === 'solid' ? 'bg-white dark:bg-black' : 'lightbox-demo-backdrop-light'
	);
</script>

<Lightbox.Portal>
	<Lightbox.Backdrop class="lightbox-demo-backdrop {backdropTone} fixed inset-0" />
	<Lightbox.Content
		aria-label={ariaLabel}
		class="lightbox-demo-content fixed inset-0 flex flex-col overscroll-contain outline-none {snug
			? 'lightbox-demo-content-snug'
			: ''} {showStrip ? '' : 'lightbox-demo-content-solo'}"
	>
		<!-- Remount the track when the layout flips: the bleed/snug geometry
		     (spacers, widths) shouldn't animate between. -->
		{#key layout}
			<Lightbox.Slides
				aria-label="Full-size images"
				aria-roledescription="carousel"
				{preload}
				class={snug
					? 'lightbox-demo-slides lightbox-demo-slides-snug flex-1 [&::-webkit-scrollbar]:hidden'
					: 'lightbox-demo-slides flex-1 gap-5 md:gap-0 [&::-webkit-scrollbar]:hidden'}
				style={snug && items.length > 0
					? `--lightbox-snug-ratio-start: ${ratio(items[0]!)}; --lightbox-snug-ratio-end: ${ratio(items[items.length - 1]!)};`
					: undefined}
			>
				{#each items as item, i (item.src)}
					<Lightbox.Slide
						class={snug
							? 'lightbox-demo-slide-snug lightbox-demo-slide-pad z-0 h-full'
							: 'lightbox-demo-slide-pad h-full'}
						style={snug ? `--lightbox-snug-ratio: ${ratio(item)};` : undefined}
					>
						<!-- Only the strip-less shape needs naming here: with a strip the
						     item is a tabpanel already named by its thumbnail tab. -->
						<Lightbox.Item
							index={i}
							caption={item.caption}
							aria-roledescription="slide"
							aria-label={showStrip ? undefined : `${i + 1} of ${items.length}`}
						>
							{#snippet children()}
								{#if slide}
									{@render slide(item, i)}
								{:else}
									<Lightbox.Zoom {maxZoom}>
										<Lightbox.Media
											width={item.width}
											height={item.height}
											class="overflow-hidden rounded-none after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit] md:rounded-lg md:after:shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.1)] md:dark:after:shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.12)]"
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
								{/if}
							{/snippet}
						</Lightbox.Item>
					</Lightbox.Slide>
				{/each}
			</Lightbox.Slides>
		{/key}

		<div
			class="lightbox-demo-chrome-top lightbox-demo-chrome-hide absolute end-3 top-[calc(0.75rem+env(safe-area-inset-top,0px))] z-30 flex gap-2"
		>
			{#if layoutToggle}
				<!-- "Theater" = bleed, "Peek" = snug. The icon shows the CURRENT
				     layout; the label names the target. -->
				<button
					type="button"
					class="{chromeButtonMd} lightbox-demo-chrome-hide lightbox-demo-zoom-hide"
					aria-pressed={snug}
					aria-label={snug ? 'Switch to theater layout' : 'Switch to peek layout'}
					title={snug ? 'Theater' : 'Peek'}
					onclick={toggleLayout}
				>
					{#if snug}
						<GalleryHorizontal aria-hidden="true" class="h-4 w-4" strokeWidth={2.25} />
					{:else}
						<RectangleHorizontal aria-hidden="true" class="h-4 w-4" strokeWidth={2.25} />
					{/if}
				</button>
			{/if}
			{#if zoomControls}
				<!-- Zoom −/+ share one capsule with a hairline divider. -->
				<div class={chromeButtonGroup}>
					<Lightbox.ZoomOut class={chromeButtonSegment} aria-label="Zoom out" title="Zoom out">
						<ZoomOut aria-hidden="true" class="h-4 w-4" strokeWidth={2.25} />
					</Lightbox.ZoomOut>
					<Lightbox.ZoomIn
						class="{chromeButtonSegment} {chromeSegmentDivider}"
						aria-label="Zoom in"
						title="Zoom in"
					>
						<ZoomIn aria-hidden="true" class="h-4 w-4" strokeWidth={2.25} />
					</Lightbox.ZoomIn>
				</div>
			{/if}
			<Lightbox.Close class={chromeButton} aria-label="Close" title="Close">
				<X aria-hidden="true" class="h-[18px] w-[18px]" strokeWidth={2.25} />
			</Lightbox.Close>
		</div>

		<div
			class="lightbox-demo-chrome-bottom lightbox-demo-chrome-hide {showStrip
				? ''
				: 'lightbox-demo-chrome-bottom-solo'} pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-3 px-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
		>
			<div class="flex max-w-full flex-col items-center text-center">
				<Lightbox.Caption
					class="block max-w-full truncate text-[13px] leading-tight font-medium text-neutral-900 dark:text-neutral-50"
				/>
				{#if items.length > 1}
					<Lightbox.Counter
						class="text-[11px] leading-tight text-neutral-500 tabular-nums md:sr-only dark:text-neutral-400"
					>
						{#snippet children({ current, total })}{current} of {total}{/snippet}
					</Lightbox.Counter>
				{/if}
			</div>
			{#if showStrip}
				<!-- Visibility only (desktop); the linked layout and sync live in
				     Lightbox.ThumbnailStrip. Square thumbs + a stationary midline square. -->
				<Lightbox.ThumbnailStrip
					class="lightbox-demo-thumbnail-strip pointer-events-auto hidden md:block"
				>
					<Lightbox.ThumbnailStripTrack aria-label="Photo thumbnails">
						{#each items as item, i (item.src)}
							<Lightbox.Thumbnail index={i}>
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
