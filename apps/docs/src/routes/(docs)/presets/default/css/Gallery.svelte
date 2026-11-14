<!--
  Default lightbox, plain-CSS variant: design-system package entry (copy
  with lightbox.css). A Tailwind variant with the identical component API
  lives in `../tailwind/Gallery.svelte`.

  The composed viewer: Portal → Backdrop + Content → Slides/Zoom, glass
  controls, caption + counter placard and the desktop ThumbnailStrip.
  Supports bleed (full-width) and snug (aspect-sized cards) slides via the
  top-right layout toggle or the bindable `slidesLayout`.

  Package boundary: the skin and this Gallery only. Place it under
  `Lightbox.Root`, beside your triggers (spread `triggerProps` on each
  `Lightbox.Trigger`). Trigger layouts, album grids, user cards and other app
  UI belong in your app (docs: `Demo.svelte`), not in this module. The other
  parts take the skin's `lb-` classes directly, e.g.
  `<Lightbox.Close class="lb-control">`.
-->
<script lang="ts" module>
	/** Item shape for the Gallery: pass the real intrinsic pixel size. */
	export type LightboxItem = {
		id?: string | number;
		src: string;
		thumb: string;
		alt: string;
		caption?: string;
		width: number;
		height: number;
	};

	export type SlidesLayout = 'bleed' | 'snug';

	/** Spread on every `Lightbox.Trigger` that opens this Gallery. */
	export const triggerProps = { class: 'lb-trigger' };

	/**
	 * The snug/bleed choice is a user preference, so it survives across
	 * galleries and visits. Guarded reads/writes: localStorage throws in some
	 * private modes, and `window` doesn't exist during SSR (the portal renders
	 * nothing while closed, so the pre-hydration value is never visible).
	 */
	const SLIDES_LAYOUT_STORAGE_KEY = 'ramka-lightbox-slides-layout';

	function readStoredSlidesLayout(): SlidesLayout | null {
		if (typeof window === 'undefined') return null;
		try {
			const value = window.localStorage.getItem(SLIDES_LAYOUT_STORAGE_KEY);
			return value === 'snug' || value === 'bleed' ? value : null;
		} catch {
			return null;
		}
	}

	function storeSlidesLayout(layout: SlidesLayout) {
		try {
			window.localStorage.setItem(SLIDES_LAYOUT_STORAGE_KEY, layout);
		} catch {
			// Storage unavailable: the toggle still works for this session.
		}
	}

	function itemAspectRatio(item: LightboxItem): number {
		return item.width / item.height;
	}
</script>

<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import './lightbox.css';

	let {
		items,
		ariaLabel,
		slidesLayout = $bindable(readStoredSlidesLayout() ?? 'snug'),
		onSlidesLayoutChange
	}: {
		items: LightboxItem[];
		ariaLabel: string;
		/** `snug` (default) or `bleed`; bind it to own the choice. */
		slidesLayout?: SlidesLayout;
		onSlidesLayoutChange?: (layout: SlidesLayout) => void;
	} = $props();

	const snug = $derived(slidesLayout === 'snug');
	// Single item → no thumbnail strip → solo layout (tighter, centered bottom band).
	const solo = $derived(items.length <= 1);

	function toggleSlidesLayout() {
		const next = snug ? 'bleed' : 'snug';
		storeSlidesLayout(next);
		slidesLayout = next;
		onSlidesLayoutChange?.(next);
	}
</script>

<Lightbox.Portal class="lb-portal">
	<Lightbox.Backdrop class="lb-backdrop" />
	<Lightbox.Content
		aria-label={ariaLabel}
		class={['lb-content', snug && 'lb-content-snug', solo && 'lb-content-solo']}
	>
		<!-- Remount the track when the layout flips: the bleed/snug geometry
		     (spacers, widths) shouldn't animate between. -->
		{#key slidesLayout}
			<!-- The library ships no copy, so the words announcing the carousel
			     and its slides live here, next to the rest of your UI strings. -->
			<Lightbox.Slides
				aria-label="Full-size images"
				aria-roledescription="carousel"
				preload={2}
				class={['lb-slides', snug && 'lb-slides-snug']}
				style={snug && items.length > 0
					? `--lb-snug-ratio-start: ${itemAspectRatio(items[0]!)}; --lb-snug-ratio-end: ${itemAspectRatio(items[items.length - 1]!)}`
					: undefined}
			>
				{#each items as item, i (item.id ?? i)}
					<Lightbox.Slide
						class={['lb-slide', snug && 'lb-slide-snug']}
						style={snug ? `--lb-snug-ratio: ${itemAspectRatio(item)}` : undefined}
					>
						<!-- With the strip the item is a `tabpanel` its thumbnail tab
						     already names, so only the solo shape needs a name here. -->
						<Lightbox.Item
							index={i}
							caption={item.caption ?? item.alt}
							aria-roledescription="slide"
							aria-label={solo ? `${i + 1} of ${items.length}` : undefined}
						>
							<Lightbox.Zoom maxZoom={6}>
								<Lightbox.Media class="lb-media" width={item.width} height={item.height}>
									<img
										width={item.width}
										height={item.height}
										src={item.src}
										alt={item.alt}
										loading="eager"
										draggable="false"
									/>
								</Lightbox.Media>
							</Lightbox.Zoom>
						</Lightbox.Item>
					</Lightbox.Slide>
				{/each}
			</Lightbox.Slides>
		{/key}

		<div class="lb-top-right lb-chrome-gesture-hide">
			<!-- Layout toggle. User copy: "theater" = bleed (one wide slide),
			     "peek" = snug (card with neighbours peeking). The icon is a
			     miniature of the CURRENT layout; the label names the TARGET. -->
			<button
				type="button"
				class="lb-control lb-control-md lb-control-layout"
				aria-pressed={snug}
				aria-label={snug ? 'Switch to theater layout' : 'Switch to peek layout'}
				onclick={toggleSlidesLayout}
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.25"
					aria-hidden="true"
				>
					{#if snug}
						<!-- Snug: a centered card with the neighbours peeking in. -->
						<rect x="8.5" y="7" width="7" height="10" rx="1.5" />
						<path d="M4 9v6M20 9v6" stroke-linecap="round" />
					{:else}
						<!-- Bleed: one slide, edge to edge. -->
						<rect x="4" y="7" width="16" height="10" rx="1.5" />
					{/if}
				</svg>
			</button>
			<!-- Zoom −/+ share one capsule with a hairline divider. -->
			<div class="lb-control-group lb-control-md">
				<Lightbox.ZoomOut class="lb-control lb-control-md" aria-label="Zoom out">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.25"
						aria-hidden="true"
					>
						<circle cx="11" cy="11" r="8" />
						<path d="m21 21-4.3-4.3M8 11h6" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</Lightbox.ZoomOut>
				<Lightbox.ZoomIn class="lb-control lb-control-md" aria-label="Zoom in">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.25"
						aria-hidden="true"
					>
						<circle cx="11" cy="11" r="8" />
						<path d="m21 21-4.3-4.3M11 8v6M8 11h6" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</Lightbox.ZoomIn>
			</div>
			<Lightbox.Close class="lb-control" aria-label="Close">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.25"
					aria-hidden="true"
				>
					<path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</Lightbox.Close>
		</div>

		<div class={['lb-bottom', 'lb-chrome-gesture-hide', solo && 'lb-bottom-solo']}>
			<!-- Caption under the media, placard-style. The counter is visible on
			     mobile where there's no strip to show position; on md+ the strip
			     covers that, so the counter collapses to sr-only and keeps only
			     its aria-live announcement role. -->
			<div class="lb-caption-group">
				<Lightbox.Caption class="lb-caption" />
				<!-- "1 of 1" is noise: skip the counter for single-item galleries. -->
				{#if !solo}
					<Lightbox.Counter class="lb-counter">
						{#snippet children({ current, total })}{current} of {total}{/snippet}
					</Lightbox.Counter>
				{/if}
			</div>
			{#if !solo}
				<Lightbox.ThumbnailStrip class="lb-thumbnail-strip lb-thumbnail-strip-desktop">
					<Lightbox.ThumbnailStripTrack aria-label="Photo thumbnails">
						{#each items as item, i (item.id ?? i)}
							<Lightbox.Thumbnail index={i}>
								<img src={item.thumb} alt={item.alt} draggable="false" />
							</Lightbox.Thumbnail>
						{/each}
					</Lightbox.ThumbnailStripTrack>
					<!-- Decorative ring over the active tab; the track scrolls under it. -->
					<span class="lb-thumbnail-strip-indicator" aria-hidden="true"></span>
				</Lightbox.ThumbnailStrip>
			{/if}
		</div>
	</Lightbox.Content>
</Lightbox.Portal>
