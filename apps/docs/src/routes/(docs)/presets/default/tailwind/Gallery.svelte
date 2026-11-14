<!--
  Default lightbox, Tailwind variant: single-file design-system package entry
  (no CSS file to copy). A plain-CSS variant with the identical component API
  lives in `../css/Gallery.svelte`.

  The composed viewer: Portal → Backdrop + Content → Slides/Zoom, glass
  controls, caption + counter placard and the desktop ThumbnailStrip.
  Supports bleed (full-width) and snug (aspect-sized cards) slides via the
  top-right layout toggle or the bindable `slidesLayout`.

  Conventions:
  - Requires Tailwind CSS v4 (`starting:`, `not-*`, bare `data-*` variants)
    and `@lucide/svelte`.
  - Variables named `--lightbox-*` are written by the ramka runtime (gesture
    progress, motion timing); this file only reads them. Variables named
    `--lb-*` are this skin's own tokens, declared via arbitrary properties.
  - Gesture-driven state rides on data attributes ramka sets on Content
    (`data-open`, `data-pulling`, `data-pull-dismissing`, `data-zoomed`),
    consumed here through the named `group/lb` on Content. All
    view-transition CSS (morph group, snapshots, crossfade) is injected by
    the library; the skin ships none of it.
  - Each recipe is one conflict-free class list: where a layout swaps a
    utility (snug vs bleed, solo vs strip), the markup picks one of two
    strings instead of stacking overrides.

  Package boundary: the skin and this Gallery only. Place it under
  `Lightbox.Root`, beside your triggers (spread `triggerProps` on each
  `Lightbox.Trigger`). Trigger layouts, album grids, user cards and other app
  UI belong in your app (docs: `Demo.svelte`), not in this module.
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
	export const triggerProps = {
		'data-slot': 'lightbox-trigger',
		class:
			'cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500'
	};

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

	/* ── Shared class recipes ───────────────────────────────────────────── */

	/**
	 * Glass control pill (iOS-style liquid glass). The focus ring rides on
	 * box-shadow (the pill clips outlines poorly), so focus-visible restates
	 * the resting shadows plus the ring. Hover/press tint is a
	 * background-image overlay so one recipe serves both the standalone pills
	 * and the transparent segments inside a control group. Note `scale` in the
	 * transition list: Tailwind v4 scale utilities write the `scale` property,
	 * not `transform`.
	 */
	const controlClass = [
		'inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full',
		'border border-black/20 bg-white/55 text-neutral-900',
		'shadow-[0_0.5px_1px_rgb(0_0_0/0.12),0_1px_2px_rgb(0_0_0/0.08),inset_0_0.5px_0_rgb(255_255_255/0.65)]',
		'backdrop-blur-[40px] backdrop-saturate-150',
		'transition-[background-color,box-shadow,transform,scale,opacity,color] duration-150 ease-out',
		'outline-none',
		'hover:[background-image:linear-gradient(rgb(0_0_0/0.05),rgb(0_0_0/0.05))]',
		'active:scale-[0.96] active:[background-image:linear-gradient(rgb(0_0_0/0.09),rgb(0_0_0/0.09))]',
		'focus-visible:shadow-[0_0_0_2px_rgb(0_0_0/0.25),0_0.5px_1px_rgb(0_0_0/0.12),0_1px_2px_rgb(0_0_0/0.08),inset_0_0.5px_0_rgb(255_255_255/0.65)]',
		'disabled:pointer-events-none disabled:opacity-30',
		'[&_svg]:block',
		'dark:border-white/25 dark:bg-neutral-900/45 dark:text-white',
		'dark:shadow-[0_0_0_0.5px_#000,0_0.5px_1px_rgb(0_0_0/0.45),0_1px_2px_rgb(0_0_0/0.35),inset_0_0.5px_0_rgb(255_255_255/0.14)]',
		'dark:hover:[background-image:linear-gradient(rgb(255_255_255/0.08),rgb(255_255_255/0.08))]',
		'dark:active:[background-image:linear-gradient(rgb(255_255_255/0.12),rgb(255_255_255/0.12))]',
		'dark:focus-visible:shadow-[0_0_0_2px_rgb(255_255_255/0.4),0_0_0_0.5px_#000,0_0.5px_1px_rgb(0_0_0/0.45),0_1px_2px_rgb(0_0_0/0.35),inset_0_0.5px_0_rgb(255_255_255/0.14)]'
	].join(' ');

	/**
	 * Joined capsule: one glass pill holding several segments (zoom −/+) with
	 * a hairline divider, like iOS grouped controls. The pill owns the glass
	 * chrome; segments become flat, full-height hit areas.
	 */
	const controlGroupClass = [
		'inline-flex items-stretch overflow-hidden rounded-full max-md:hidden',
		'border border-black/20 bg-white/55',
		'shadow-[0_0.5px_1px_rgb(0_0_0/0.12),0_1px_2px_rgb(0_0_0/0.08),inset_0_0.5px_0_rgb(255_255_255/0.65)]',
		'backdrop-blur-[40px] backdrop-saturate-150',
		'dark:border-white/25 dark:bg-neutral-900/45',
		'dark:shadow-[0_0_0_0.5px_#000,0_0.5px_1px_rgb(0_0_0/0.45),0_1px_2px_rgb(0_0_0/0.35),inset_0_0.5px_0_rgb(255_255_255/0.14)]'
	].join(' ');

	/**
	 * Segment inside the capsule: no glass chrome of its own (the pill owns
	 * it), doesn't shrink on press (the pill is one rigid control), and uses
	 * an inset focus ring (the pill clips outset rings). Each segment is as
	 * wide as the pill is tall → a two-segment capsule is exactly 2:1.
	 */
	const controlSegmentClass = [
		'inline-flex size-9 shrink-0 cursor-pointer items-center justify-center border-black/20 text-neutral-900',
		'transition-[background-color,box-shadow,transform,scale,opacity,color] duration-150 ease-out outline-none',
		'hover:[background-image:linear-gradient(rgb(0_0_0/0.05),rgb(0_0_0/0.05))]',
		'active:[background-image:linear-gradient(rgb(0_0_0/0.09),rgb(0_0_0/0.09))]',
		'disabled:pointer-events-none disabled:opacity-30 [&_svg]:block [&_svg]:size-4',
		'dark:border-white/25 dark:text-white',
		'dark:hover:[background-image:linear-gradient(rgb(255_255_255/0.08),rgb(255_255_255/0.08))]',
		'dark:active:[background-image:linear-gradient(rgb(255_255_255/0.12),rgb(255_255_255/0.12))]',
		'max-md:hidden relative h-auto w-9 rounded-none border-0 bg-transparent shadow-none',
		'backdrop-blur-none backdrop-saturate-100 active:scale-100',
		'focus-visible:shadow-[inset_0_0_0_2px_rgb(0_0_0/0.25)]',
		'dark:bg-transparent dark:shadow-none dark:focus-visible:shadow-[inset_0_0_0_2px_rgb(255_255_255/0.4)]'
	].join(' ');

	/** Hairline divider on the leading edge of a follow-up capsule segment. */
	const controlSegmentDividerClass =
		'before:absolute before:inset-y-[22%] before:start-0 before:w-px before:bg-black/15 dark:before:bg-white/20';

	/**
	 * Chrome that gets out of the way during gestures. `visibility` (not just
	 * opacity/pointer-events) keeps hidden controls out of the tab order; its
	 * 0s flip is delayed to the end of the fade-out, instant on fade-in.
	 * Pull-to-dismiss (and the dismiss animation) hides all gesture chrome;
	 * `starting:` fades it in on open.
	 */
	const chromeGestureHideClass = [
		'visible opacity-100 [transition:opacity_200ms,visibility_0s_linear_0s] starting:opacity-0',
		'group-data-pulling/lb:invisible group-data-pulling/lb:opacity-0',
		'group-data-pulling/lb:[transition:opacity_200ms,visibility_0s_linear_200ms]',
		'group-data-pull-dismissing/lb:invisible group-data-pull-dismissing/lb:opacity-0',
		'group-data-pull-dismissing/lb:[transition:opacity_200ms,visibility_0s_linear_200ms]'
	].join(' ');

	/* ── Styled parts ───────────────────────────────────────────────────── */

	const backdropClass = [
		// Solid: the page underneath is fully covered while open.
		'fixed inset-0 bg-white opacity-0 dark:bg-black',
		// Duration cascade: `--lightbox-pull-snap-*` exist only while a
		// cancelled pull-to-dismiss springs back (so the refade matches the
		// item's spring); otherwise `--lightbox-vt-duration`, the Root's
		// `viewTransition` preset timing, which the library always sets on the
		// Portal host. The 360ms literal is just a safety net.
		'transition-opacity',
		'duration-[var(--lightbox-pull-snap-duration,var(--lightbox-vt-duration,360ms))]',
		'ease-[var(--lightbox-pull-snap-easing,var(--lb-ease-out-expo))]',
		// `--lightbox-pull-progress` is 0 → 1 while pull-to-dismiss drags;
		// `starting:` fades from 0 on the first frame after [data-open].
		'data-open:opacity-[calc(1_-_var(--lightbox-pull-progress,0)*0.6)]',
		'data-open:starting:opacity-0',
		'data-pulling:transition-none' // follow the finger
	].join(' ');

	const contentClass = [
		// `group/lb` publishes ramka's state attributes (data-pulling,
		// data-pull-dismissing, data-zoomed) to all chrome below.
		'group/lb fixed inset-0 flex flex-col overscroll-contain opacity-0 outline-none',
		// Same preset clock as the backdrop and the morph.
		'transition-opacity duration-[var(--lightbox-vt-duration,360ms)] ease-(--lb-ease-out-expo)',
		'data-open:opacity-100 data-open:starting:opacity-0',
		// Letterbox insets around the media (read by Slide padding and the
		// snug width formula). Mobile: equal top/bottom so the media is
		// vertically centered: 4rem clears the close-button row above and the
		// caption + counter below. Desktop: roomier (the bottom and inline
		// insets depend on the layout, see `contentInsetClass`).
		'[--lb-inset-top:calc(4rem_+_env(safe-area-inset-top,0px))]',
		'[--lb-inset-bottom:calc(4rem_+_env(safe-area-inset-bottom,0px))]',
		'[--lb-inset-inline:0px]',
		'md:[--lb-inset-top:calc(4.5rem_+_env(safe-area-inset-top,0px))]'
	].join(' ');

	/**
	 * Desktop insets. Bottom: the thumbnail-strip row (5.125rem: 4.5rem thumbs
	 * + indicator padding) + a one-line caption bar; solo (single item, no
	 * strip) matches the top inset so the letterbox stays symmetric. Inline:
	 * snug turns the inset into a scrollport gutter consumed by the card
	 * width formula, not per-slide padding.
	 */
	function contentInsetClass(snug: boolean, solo: boolean) {
		return [
			solo
				? 'md:[--lb-inset-bottom:calc(4.5rem_+_env(safe-area-inset-bottom,0px))]'
				: 'md:[--lb-inset-bottom:calc(8.625rem_+_env(safe-area-inset-bottom,0px))]',
			snug ? 'md:[--lb-inset-inline:2rem]' : 'md:[--lb-inset-inline:3rem]'
		];
	}

	const slidesClass = 'flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

	/*
	 * Snug card width = the largest size that fits the letterbox at the
	 * item's aspect ratio: min(scrollport width minus gutters, letterbox
	 * height × ratio). The `--lb-snug-ratio*` values are per-item aspect
	 * ratios set inline by the Gallery; cqw/cqh resolve against the Slides
	 * scrollport (the library makes it a size container). -start/-end are the
	 * first/last item's ratios, needed by the ::before/::after spacers so the
	 * first/last card can center in the scrollport under scroll-snap.
	 */
	const snugSlidesClass = [
		'[--lb-snug-gap:1.25rem] gap-(--lb-snug-gap)',
		'[--lb-snug-width-start:min(calc(100cqw_-_2*var(--lb-inset-inline)),calc((100cqh_-_var(--lb-inset-top)_-_var(--lb-inset-bottom))*var(--lb-snug-ratio-start,1)))]',
		'[--lb-snug-width-end:min(calc(100cqw_-_2*var(--lb-inset-inline)),calc((100cqh_-_var(--lb-inset-top)_-_var(--lb-inset-bottom))*var(--lb-snug-ratio-end,1)))]',
		'md:before:pointer-events-none md:before:flex-[0_0_calc((100cqw_-_var(--lb-snug-width-start))/2_-_var(--lb-snug-gap))]',
		'md:after:pointer-events-none md:after:flex-[0_0_calc((100cqw_-_var(--lb-snug-width-end))/2_-_var(--lb-snug-gap))]'
	].join(' ');

	const slideClass = 'h-full min-w-full flex-[0_0_100%] pt-(--lb-inset-top) pb-(--lb-inset-bottom)';

	const snugSlideClass = [
		// No horizontal padding on the card itself: the gutter lives in the
		// width formula only, so neighbors can peek right up to the card edge.
		// z-0 is the stacking baseline for the zoomed-card promotion below.
		'z-0 px-0',
		'[--lb-snug-width:min(calc(100cqw_-_2*var(--lb-inset-inline)),calc((100cqh_-_var(--lb-inset-top)_-_var(--lb-inset-bottom))*var(--lb-snug-ratio)))]',
		'md:w-(--lb-snug-width) md:min-w-0 md:flex-[0_0_auto]',
		// The zoomed active card paints above the peeking neighbors.
		'group-data-zoomed/lb:has-data-active:z-[1]'
	].join(' ');

	/*
	 * Neighbor cards dim as the active item is pulled to dismiss
	 * (`--lightbox-pull-progress`) or zoomed (`--lightbox-zoom-progress`),
	 * both library-written, 0 → 1. `filter` tracks the gesture 1:1
	 * (transitioning it would lag the finger); `opacity` transitions so the
	 * pull snap-back resolves on the same spring as the item.
	 *
	 * md+ only: below md the snug track is one full-width slide per
	 * scrollport, so neighbors are offscreen and the dim is invisible, yet the
	 * var-driven opacity/filter would still restyle and repaint every card on
	 * every pull frame (blur especially). `data-pull-dismissing` also
	 * suppresses the transition: fading neighbors during an actual dismissal
	 * competes with the close view transition for raster.
	 */
	const snugItemClass = [
		'md:transition-opacity',
		'md:duration-[var(--lightbox-pull-snap-duration,500ms)]',
		'md:ease-[var(--lightbox-pull-snap-easing,var(--lb-ease-out-expo))]',
		'md:not-data-active:[--lb-neighbor-dim:max(var(--lightbox-pull-progress,0),var(--lightbox-zoom-progress,0))]',
		'md:not-data-active:opacity-[calc(1_-_var(--lightbox-pull-progress,0)*0.85)]',
		'md:not-data-active:[filter:opacity(calc(1_-_var(--lb-neighbor-dim)))_blur(calc(var(--lb-neighbor-dim)*6px))]',
		'md:group-data-pulling/lb:transition-none', // follow the finger
		'md:group-data-pull-dismissing/lb:transition-none'
	].join(' ');

	// The ::after draws an Apple-style 0.5px inset outline so dark photos
	// don't bleed into the dark-mode backdrop (and bright ones into the light
	// one). Media is already position:relative (structural), so absolute
	// insets just work. The shadow is gated to md+: the mobile edge-to-edge
	// layout stays outline-free.
	const mediaClass = [
		'overflow-hidden md:rounded-[0.625rem] [&_img]:select-none',
		'after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit]',
		'md:after:shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.1)]',
		'md:dark:after:shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.12)]'
	].join(' ');

	const stripClass = [
		'[--lb-thumb-size:4.5rem] [--lb-strip-fade:40px]',
		// Soft edge fade over the scrolling thumbs (eased ramp, not linear).
		'[--lb-strip-mask:linear-gradient(to_right,rgb(0_0_0/0)_0,rgb(0_0_0/0.156)_calc(var(--lb-strip-fade)*0.25),rgb(0_0_0/0.5)_calc(var(--lb-strip-fade)*0.5),rgb(0_0_0/0.844)_calc(var(--lb-strip-fade)*0.75),#000_var(--lb-strip-fade),#000_calc(100%_-_var(--lb-strip-fade)),rgb(0_0_0/0.844)_calc(100%_-_var(--lb-strip-fade)*0.75),rgb(0_0_0/0.5)_calc(100%_-_var(--lb-strip-fade)*0.5),rgb(0_0_0/0.156)_calc(100%_-_var(--lb-strip-fade)*0.25),rgb(0_0_0/0)_100%)]',
		// pointer-events-auto counteracts the bottom band's click-through.
		// py fits the floating indicator's overhang (3px gap + 2px stroke).
		'pointer-events-auto w-full min-w-0 self-stretch py-[0.3125rem]',
		'[-webkit-mask-image:var(--lb-strip-mask)] [mask-image:var(--lb-strip-mask)]',
		// The strip is desktop-only; mobile shows the counter instead.
		'max-md:hidden'
	].join(' ');

	const thumbnailClass = [
		// Exact 0.5rem: a radius token would drift from the indicator ring's
		// calc(0.5rem + 3px) below.
		'relative block size-(--lb-thumb-size) shrink-0 cursor-pointer overflow-hidden rounded-[0.5rem]',
		'[&_img]:block [&_img]:size-full [&_img]:object-cover'
	].join(' ');
</script>

<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import GalleryHorizontal from '@lucide/svelte/icons/gallery-horizontal';
	import RectangleHorizontal from '@lucide/svelte/icons/rectangle-horizontal';
	import X from '@lucide/svelte/icons/x';
	import ZoomInIcon from '@lucide/svelte/icons/zoom-in';
	import ZoomOutIcon from '@lucide/svelte/icons/zoom-out';

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

<Lightbox.Portal
	data-slot="lightbox-portal"
	class="[--lb-ease-out-expo:cubic-bezier(0.16,1,0.3,1)]"
>
	<Lightbox.Backdrop data-slot="lightbox-backdrop" class={backdropClass} />
	<Lightbox.Content
		data-slot="lightbox-content"
		aria-label={ariaLabel}
		class={[contentClass, contentInsetClass(snug, solo)]}
	>
		<!-- Remount the track when the layout flips: the bleed/snug geometry
		     (spacers, widths) shouldn't animate between. -->
		{#key slidesLayout}
			<!-- The library ships no copy, so the words announcing the carousel
			     and its slides live here, next to the rest of your UI strings. -->
			<Lightbox.Slides
				data-slot="lightbox-slides"
				aria-label="Full-size images"
				aria-roledescription="carousel"
				preload={2}
				class={[slidesClass, snug ? snugSlidesClass : 'gap-5 md:gap-0']}
				style={snug && items.length > 0
					? `--lb-snug-ratio-start: ${itemAspectRatio(items[0]!)}; --lb-snug-ratio-end: ${itemAspectRatio(items[items.length - 1]!)}`
					: undefined}
			>
				{#each items as item, i (item.id ?? i)}
					<Lightbox.Slide
						data-slot="lightbox-slide"
						class={[slideClass, snug ? snugSlideClass : 'px-(--lb-inset-inline)']}
						style={snug ? `--lb-snug-ratio: ${itemAspectRatio(item)}` : undefined}
					>
						<!-- With the strip the item is a `tabpanel` its thumbnail tab
						     already names, so only the solo shape needs a name here. -->
						<Lightbox.Item
							data-slot="lightbox-item"
							index={i}
							caption={item.caption ?? item.alt}
							class={snug ? snugItemClass : undefined}
							aria-roledescription="slide"
							aria-label={solo ? `${i + 1} of ${items.length}` : undefined}
						>
							<Lightbox.Zoom maxZoom={6}>
								<Lightbox.Media
									data-slot="lightbox-media"
									class={mediaClass}
									width={item.width}
									height={item.height}
								>
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

		<div
			class={[
				'absolute end-3 top-[calc(0.75rem_+_env(safe-area-inset-top,0px))] z-[1] flex gap-2',
				chromeGestureHideClass,
				// On mobile, zoom also hides the top controls: the media fills the screen.
				'max-md:group-data-zoomed/lb:invisible max-md:group-data-zoomed/lb:opacity-0',
				'max-md:group-data-zoomed/lb:[transition:opacity_200ms,visibility_0s_linear_200ms]'
			]}
		>
			<!-- Layout toggle. User copy: "theater" = bleed (one wide slide),
			     "peek" = snug (card with neighbours peeking). The icon is a
			     miniature of the CURRENT layout; the label names the TARGET. -->
			<button
				type="button"
				class="{controlClass} max-md:hidden [&_svg]:size-4.5"
				aria-pressed={snug}
				aria-label={snug ? 'Switch to theater layout' : 'Switch to peek layout'}
				onclick={toggleSlidesLayout}
			>
				{#if snug}
					<GalleryHorizontal strokeWidth={2.25} />
				{:else}
					<RectangleHorizontal strokeWidth={2.25} />
				{/if}
			</button>
			<!-- Zoom −/+ share one capsule with a hairline divider. -->
			<div class={controlGroupClass}>
				<Lightbox.ZoomOut
					data-slot="lightbox-zoom-out"
					class={controlSegmentClass}
					aria-label="Zoom out"
				>
					<ZoomOutIcon strokeWidth={2.25} />
				</Lightbox.ZoomOut>
				<Lightbox.ZoomIn
					data-slot="lightbox-zoom-in"
					class="{controlSegmentClass} {controlSegmentDividerClass}"
					aria-label="Zoom in"
				>
					<ZoomInIcon strokeWidth={2.25} />
				</Lightbox.ZoomIn>
			</div>
			<!-- The ✕ glyph is optically lighter than the zoom glyphs: render larger. -->
			<Lightbox.Close
				data-slot="lightbox-close"
				class="{controlClass} [&_svg]:size-4.5"
				aria-label="Close"
			>
				<X strokeWidth={2.25} />
			</Lightbox.Close>
		</div>

		<div
			class={[
				// Click-through the inset band; caption opts back in for text selection.
				'pointer-events-none absolute inset-x-0 bottom-0 z-[1] flex flex-col items-center gap-3 px-3',
				chromeGestureHideClass,
				// Zoom hides the bottom placard (the zoomed media pans under it).
				'group-data-zoomed/lb:invisible group-data-zoomed/lb:opacity-0',
				'group-data-zoomed/lb:[transition:opacity_200ms,visibility_0s_linear_200ms]',
				// Solo (no strip): center the placard in the bottom inset band
				// instead of pinning it to the viewport edge.
				solo
					? 'min-h-(--lb-inset-bottom) justify-center pb-[env(safe-area-inset-bottom,0px)]'
					: 'pb-[calc(1rem_+_env(safe-area-inset-bottom,0px))]'
			]}
		>
			<!-- Caption under the media, placard-style. The counter is visible on
			     mobile where there's no strip to show position; on md+ the strip
			     covers that, so the counter collapses to sr-only and keeps only
			     its aria-live announcement role. -->
			<div class="flex max-w-full flex-col items-center text-center">
				<Lightbox.Caption
					data-slot="lightbox-caption"
					class="pointer-events-auto block max-w-full truncate text-[0.8125rem] leading-[1.25] font-medium text-neutral-900 select-text dark:text-neutral-50"
				/>
				<!-- "1 of 1" is noise: skip the counter for single-item galleries. -->
				{#if !solo}
					<Lightbox.Counter
						data-slot="lightbox-counter"
						class="text-[0.6875rem] leading-[1.25] text-neutral-500 tabular-nums md:sr-only dark:text-neutral-400"
					>
						{#snippet children({ current, total })}{current} of {total}{/snippet}
					</Lightbox.Counter>
				{/if}
			</div>
			{#if !solo}
				<Lightbox.ThumbnailStrip data-slot="lightbox-thumbnail-strip" class={stripClass}>
					<Lightbox.ThumbnailStripTrack
						data-slot="lightbox-thumbnail-strip-track"
						class="flex w-max items-center gap-2.5"
						aria-label="Photo thumbnails"
					>
						{#each items as item, i (item.id ?? i)}
							<Lightbox.Thumbnail data-slot="lightbox-thumbnail" class={thumbnailClass} index={i}>
								<img src={item.thumb} alt={item.alt} draggable="false" />
							</Lightbox.Thumbnail>
						{/each}
					</Lightbox.ThumbnailStripTrack>
					<!-- Decorative ring over the active tab; the track scrolls under it. -->
					<span
						aria-hidden="true"
						class="pointer-events-none absolute top-1/2 left-1/2 size-[calc(var(--lb-thumb-size)_+_10px)] -translate-x-1/2 -translate-y-1/2 rounded-[calc(0.5rem_+_3px)] border-2 border-black dark:border-white"
					></span>
				</Lightbox.ThumbnailStrip>
			{/if}
		</div>
	</Lightbox.Content>
</Lightbox.Portal>
