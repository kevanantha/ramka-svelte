<script lang="ts" module>
	import { createContext } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export interface LightboxSlidesProps extends HTMLAttributes<HTMLDivElement> {
		/**
		 * How many neighbors on each side of the active slide mount their
		 * `Lightbox.Item` contents. Slide boxes always stay mounted so the scroll
		 * extent is correct. @default 1
		 */
		preload?: number;
		/**
		 * First-paint slide positioning for pages that SERVER-RENDER an open
		 * lightbox (deep links rendering `Portal container={null}`). A scroll
		 * offset cannot be serialized into HTML, so such pages otherwise paint
		 * slide 0 (or a blank past the `preload` window) until hydration. While
		 * on, the server HTML translates every slide by
		 * `activeIndex × (100% + gap)` so the active slide occupies the
		 * scrollport at offset 0; hydration drops the transform and the real
		 * scroll offset lands before the next paint — no flash, every browser.
		 *
		 * ONLY for scrollport-wide slides: the percentage resolves against each
		 * slide's own width, so content-sized (snug) slides would shift by
		 * unequal distances. If the track has a `gap`, mirror it into
		 * `--lightbox-ssr-slide-gap` (see `LightboxSlidesCssVars`). Without the
		 * opt-in, engines with `scroll-initial-target` still position any layout
		 * natively; others keep the hydration jump. Client-side opens are never
		 * affected. @default false
		 */
		ssrSlideShift?: boolean;
		ref?: HTMLDivElement | null;
	}

	const [getSlidesContext, setSlidesContext, hasSlidesContext] = createContext<{
		readonly preload: number;
	}>();

	/** The enclosing Slides' preload window (∞ outside Slides: render every item). */
	export function getSlidesPreload(): { readonly preload: number } {
		return hasSlidesContext() ? getSlidesContext() : { preload: Infinity };
	}

	/** Quiet gap that settles a scroll where `scrollend` is unreliable. */
	const SCROLL_IDLE_MS = 140;
	/** Delay before forcing a repaint of the landed slide after a jump. */
	const REPAINT_IDLE_MS = 120;
	const SLIDES_SCROLL_SNAP_TYPE = 'x mandatory';
	/** Single-finger travel before a touch counts as a swipe. */
	const TOUCH_LOCK_PX = 10;

	function clamp(value: number, min: number, max: number): number {
		return value < min ? min : value > max ? max : value;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { getLightboxContext } from './lightbox-state.svelte';
	import {
		measureSlidesGeometry,
		slideIndexFromInlinePosition,
		slideInlinePositionForIndex,
		SLIDE_SELECTOR
	} from './lightbox-slides-geometry';
	import { readInlineScroll, writeInlineScroll } from './lightbox-direction';
	import { isFirefox } from './is-firefox';
	import { BROWSER } from 'esm-env';
	import { LightboxSlidesCssVars } from './lightbox-css-vars';

	let {
		preload = 1,
		ssrSlideShift = false,
		ref = $bindable(null),
		style,
		children,
		...rest
	}: LightboxSlidesProps = $props();

	const lightbox = getLightboxContext();
	setSlidesContext({
		get preload() {
			return preload;
		}
	});

	// Imperative scroll bookkeeping — never reactive.
	let programmatic = false;
	let jumpTarget = 0;
	let jumpGen = 0;
	let snapSuppressDepth = 0;
	let resizing = false;
	let resizeGen = 0;
	let repaintTimer = 0;
	let idleTimer = 0;
	let pinchInterrupted = false;
	let touchLiftedWhileLocked = false;

	$effect(() => {
		const el = ref;
		if (!el) return;
		lightbox.slidesViewport = el;
		return () => {
			if (lightbox.slidesViewport === el) lightbox.slidesViewport = null;
			snapSuppressDepth = 0;
			el.style.scrollSnapType = SLIDES_SCROLL_SNAP_TYPE;
		};
	});

	/**
	 * The `ssrSlideShift` stand-in (see ssr-initial-slide.ts): server HTML only.
	 * Hydration writes the client's attributes over it, so it is gone before
	 * the effects below measure and jump. `overflow: clip` on both axes makes
	 * the box no scroll container while shifted (nothing to swipe or for Gecko
	 * to restore into), and snap is off so no engine captures a snap target
	 * through the translated positions.
	 */
	const ssrShift = $derived(!BROWSER && ssrSlideShift);
	const ssrShiftStyle = $derived(
		ssrShift
			? `overflow-x: clip; overflow-y: clip; scroll-snap-type: none; ` +
					`${LightboxSlidesCssVars.ssrIndex}: ${lightbox.activeIndex}; ` +
					`${LightboxSlidesCssVars.ssrShiftSign}: ${lightbox.dir === 'rtl' ? 1 : -1};`
			: ''
	);

	function indexFromScroll(viewport: HTMLElement): number {
		return slideIndexFromInlinePosition(
			readInlineScroll(viewport, lightbox.dir),
			lightbox.slidesGeometry
		);
	}

	/**
	 * WebKit sometimes leaves a slide that scrolled in programmatically
	 * unpainted; toggling visibility forces a repaint.
	 */
	function repaintSlide(index: number) {
		const slide = ref?.querySelectorAll<HTMLElement>(SLIDE_SELECTOR)[index];
		if (!slide) return;
		const previous = slide.style.visibility;
		slide.style.visibility = 'hidden';
		void slide.offsetWidth;
		slide.style.visibility = previous;
	}

	/**
	 * Jump (no smooth scroll) to a slide. Snap is suppressed for the jump so
	 * the browser doesn't re-snap mid-write, and re-armed two frames later.
	 */
	function scrollToIndex(index: number) {
		const viewport = ref;
		if (!viewport) return;
		const dir = lightbox.dir;
		const max = viewport.scrollWidth - viewport.clientWidth;
		const target = clamp(
			slideInlinePositionForIndex(index, lightbox.slidesGeometry),
			0,
			max > 0 ? max : 0
		);
		if (Math.abs(readInlineScroll(viewport, dir) - target) < 1) return;

		programmatic = true;
		jumpTarget = target;
		const gen = (jumpGen += 1);

		if (snapSuppressDepth === 0) viewport.style.scrollSnapType = 'none';
		snapSuppressDepth += 1;

		writeInlineScroll(viewport, dir, target);
		requestAnimationFrame(() => {
			const vp = ref;
			snapSuppressDepth = Math.max(0, snapSuppressDepth - 1);
			if (vp && snapSuppressDepth === 0) vp.style.scrollSnapType = SLIDES_SCROLL_SNAP_TYPE;
			if (!vp || gen !== jumpGen) return;
			// Re-enabling snap can nudge the position; re-assert the target.
			if (Math.abs(readInlineScroll(vp, dir) - target) >= 1) {
				programmatic = true;
				jumpTarget = target;
				writeInlineScroll(vp, dir, target);
			}
			requestAnimationFrame(() => {
				if (gen !== jumpGen) return;
				programmatic = false;
				window.clearTimeout(repaintTimer);
				repaintTimer = window.setTimeout(() => {
					if (gen === jumpGen) repaintSlide(index);
				}, REPAINT_IDLE_MS);
			});
		});
	}

	// Measure geometry, and re-measure + re-park on resize (rotation, URL bar).
	$effect(() => {
		const viewport = ref;
		void lightbox.itemCount;
		void lightbox.dir;
		if (!viewport) return;
		return untrack(() => {
			const dir = lightbox.dir;
			lightbox.slidesGeometry = measureSlidesGeometry(viewport, dir);
			const observer = new ResizeObserver(() => {
				const prev = lightbox.slidesGeometry;
				const next = measureSlidesGeometry(viewport, dir);
				lightbox.slidesGeometry = next;
				if (
					next.base === prev.base &&
					next.step === prev.step &&
					next.count === prev.count &&
					next.offsets.length === prev.offsets.length &&
					next.offsets.every((offset, i) => offset === prev.offsets[i])
				) {
					return;
				}
				// A resize cancels any in-flight swipe and re-parks the index.
				const gen = (resizeGen += 1);
				resizing = true;
				pinchInterrupted = false;
				touchLiftedWhileLocked = false;
				lightbox.navigationLocked = false;
				window.clearTimeout(idleTimer);
				idleTimer = 0;
				scrollToIndex(lightbox.activeIndex);
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						if (gen !== resizeGen) return;
						scrollToIndex(lightbox.activeIndex);
						resizing = false;
					});
				});
			});
			observer.observe(viewport);
			return () => observer.disconnect();
		});
	});

	// Follow discrete navigation (keyboard, buttons, thumbnails, controlled
	// value). A swipe already sits on the derived index, so it's a no-op then.
	$effect(() => {
		const activeIndex = lightbox.activeIndex;
		const viewport = ref;
		if (!viewport) return;
		untrack(() => {
			if (indexFromScroll(viewport) !== activeIndex) scrollToIndex(activeIndex);
		});
	});

	// User scroll → index. Commits during the swipe (so chrome follows the
	// finger) and settles on `scrollend`, with an idle fallback where
	// `scrollend` is missing or unreliable (Firefox, interrupted pinches).
	$effect(() => {
		const viewport = ref;
		if (!viewport) return;
		const dir = lightbox.dir;

		let sawScrollSinceLock = false;
		let frame = 0;
		const settle = () => {
			if (frame !== 0) {
				cancelAnimationFrame(frame);
				frame = 0;
			}
			window.clearTimeout(idleTimer);
			idleTimer = 0;
			sawScrollSinceLock = false;
			pinchInterrupted = false;
			touchLiftedWhileLocked = false;
			lightbox.navigationLocked = false;
			programmatic = false;
			if (resizing) return;
			const derived = indexFromScroll(viewport);
			if (derived !== lightbox.activeIndex) lightbox.setActiveIndex(derived, 'scroll');
		};
		const scrollendReliable = 'onscrollend' in window && !isFirefox();
		const armIdleFallback = () => {
			window.clearTimeout(idleTimer);
			idleTimer = 0;
			if (scrollendReliable && !pinchInterrupted && !touchLiftedWhileLocked) return;
			idleTimer = window.setTimeout(settle, SCROLL_IDLE_MS);
		};
		const lockUserScroll = () => {
			if (programmatic) return;
			if (!lightbox.navigationLocked) sawScrollSinceLock = false;
			lightbox.navigationLocked = true;
			armIdleFallback();
		};
		const isParkedOnJumpTarget = () => Math.abs(readInlineScroll(viewport, dir) - jumpTarget) < 1;
		const clearLock = () => {
			sawScrollSinceLock = false;
			pinchInterrupted = false;
			touchLiftedWhileLocked = false;
			lightbox.navigationLocked = false;
			window.clearTimeout(idleTimer);
			idleTimer = 0;
		};

		const process = () => {
			frame = 0;
			if (programmatic || resizing || isParkedOnJumpTarget()) {
				clearLock();
				return;
			}
			if (!lightbox.navigationLocked) return;
			const derived = indexFromScroll(viewport);
			if (derived !== lightbox.activeIndex) lightbox.setActiveIndex(derived, 'scroll');
		};
		const onScroll = () => {
			if (!programmatic && !resizing && !isParkedOnJumpTarget()) {
				lockUserScroll();
				sawScrollSinceLock = true;
			}
			if (frame === 0) frame = requestAnimationFrame(process);
		};

		// Touch: lock on a horizontal single-finger slide, before the first
		// scroll event lands, so discrete nav can't fight the finger.
		let touchStartX = 0;
		let touchStartY = 0;
		let sawSingleFinger = false;
		let singleFingerSlid = false;
		let hadMultiTouch = false;
		// A zoomed slide owns one-finger moves (pan), so they don't lock.
		const isAtRestZoom = () => (lightbox.activeZoom?.getZoom() ?? 1) <= 1 + 1e-6;
		const onTouchStart = (event: TouchEvent) => {
			if (event.touches.length > 1) {
				hadMultiTouch = true;
				if (sawSingleFinger && singleFingerSlid && isAtRestZoom()) lockUserScroll();
				return;
			}
			if (event.touches.length === 1) {
				sawSingleFinger = true;
				singleFingerSlid = false;
				touchStartX = event.touches[0]!.clientX;
				touchStartY = event.touches[0]!.clientY;
				touchLiftedWhileLocked = false;
			}
		};
		const onTouchMove = (event: TouchEvent) => {
			if (hadMultiTouch) return;
			if (event.touches.length !== 1 || !sawSingleFinger || singleFingerSlid) return;
			const touch = event.touches[0]!;
			const dx = touch.clientX - touchStartX;
			const dy = touch.clientY - touchStartY;
			if (Math.hypot(dx, dy) < TOUCH_LOCK_PX) return;
			singleFingerSlid = true;
			if (isAtRestZoom() && Math.abs(dx) >= Math.abs(dy)) lockUserScroll();
		};
		const onTouchEnd = (event: TouchEvent) => {
			if (event.touches.length > 0) return;
			sawSingleFinger = false;
			singleFingerSlid = false;
			hadMultiTouch = false;
			if (lightbox.navigationLocked && !sawScrollSinceLock) {
				settle();
			} else if (lightbox.navigationLocked) {
				touchLiftedWhileLocked = true;
				armIdleFallback();
			}
		};
		// A trackpad pinch mid-swipe can cancel the scroll without `scrollend`.
		const onTrackpadPinch = (event: Event) => {
			if (!lightbox.navigationLocked) return;
			if (event.type === 'wheel') {
				const wheel = event as WheelEvent;
				if (!wheel.ctrlKey && !wheel.metaKey) return;
			}
			pinchInterrupted = true;
			armIdleFallback();
		};

		const passiveCapture = { passive: true, capture: true };
		viewport.addEventListener('scroll', onScroll, { passive: true });
		viewport.addEventListener('scrollend', settle);
		viewport.addEventListener('wheel', onTrackpadPinch, passiveCapture);
		viewport.addEventListener('gesturestart', onTrackpadPinch, { capture: true });
		viewport.addEventListener('gesturechange', onTrackpadPinch, { capture: true });
		viewport.addEventListener('touchstart', onTouchStart, passiveCapture);
		viewport.addEventListener('touchmove', onTouchMove, passiveCapture);
		viewport.addEventListener('touchend', onTouchEnd, passiveCapture);
		viewport.addEventListener('touchcancel', onTouchEnd, passiveCapture);
		return () => {
			if (frame !== 0) cancelAnimationFrame(frame);
			window.clearTimeout(idleTimer);
			window.clearTimeout(repaintTimer);
			idleTimer = 0;
			viewport.removeEventListener('scroll', onScroll);
			viewport.removeEventListener('scrollend', settle);
			viewport.removeEventListener('wheel', onTrackpadPinch, true);
			viewport.removeEventListener('gesturestart', onTrackpadPinch, true);
			viewport.removeEventListener('gesturechange', onTrackpadPinch, true);
			viewport.removeEventListener('touchstart', onTouchStart, true);
			viewport.removeEventListener('touchmove', onTouchMove, true);
			viewport.removeEventListener('touchend', onTouchEnd, true);
			viewport.removeEventListener('touchcancel', onTouchEnd, true);
		};
	});
</script>

<div
	bind:this={ref}
	role="group"
	data-orientation="horizontal"
	{...rest}
	style="display: flex; overflow-x: auto; overflow-y: hidden; overscroll-behavior-x: contain; scroll-snap-type: {SLIDES_SCROLL_SNAP_TYPE}; scroll-behavior: auto; scrollbar-width: none; overflow-anchor: none;{style ??
		''};position: relative; container-type: size;{ssrShiftStyle}"
	data-ramka-slides=""
	data-ssr-shift={ssrShift ? '' : undefined}
	data-active-index={lightbox.activeIndex}
	data-direction={lightbox.direction}
>
	{@render children?.()}
</div>
