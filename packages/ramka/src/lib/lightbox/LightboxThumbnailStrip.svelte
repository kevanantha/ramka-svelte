<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	/** Values handed to a strip's `children` snippet (and its data attributes). */
	export interface LightboxThumbnailStripState {
		/** True while a discrete-nav WAAPI scrub is in flight. */
		scrubbing: boolean;
		/**
		 * True once the track has been positioned against the Slides scroller.
		 * False in server-rendered HTML — see
		 * `LightboxThumbnailStripDataAttributes.positioned`.
		 */
		positioned: boolean;
	}

	export interface LightboxThumbnailStripProps extends Omit<
		HTMLAttributes<HTMLDivElement>,
		'children'
	> {
		/**
		 * When true (default), discrete navigation (thumbnail pointer, keyboard,
		 * Previous/Next) WAAPI-scrubs the track to the target index. When false,
		 * the strip follows the Slides jump via the scroll link.
		 */
		scrubOnSelect?: boolean;
		/**
		 * When true (default), pointer thumbnail selection runs an element-scoped
		 * View Transition on Slides around the active-index commit (stage crossfade).
		 * Falls back to a plain commit when unsupported or
		 * `prefers-reduced-motion`. Tune with `--lightbox-select-vt-duration` /
		 * `--lightbox-select-vt-easing` on Slides. Keyboard and Previous / Next
		 * navigation always keep an instant stage commit (the strip still scrubs
		 * when `scrubOnSelect` is on).
		 */
		selectViewTransition?: boolean;
		/**
		 * Optional wrapper around the active-index commit so consumers can arm
		 * custom WAAPI (e.g. an indicator scrub) *before* `commit` jumps Slides.
		 * `commit` already includes the baked Slides view transition when
		 * `selectViewTransition` is on. Track scrub still runs outside this
		 * callback. Defaults to invoking `commit` immediately.
		 */
		wrapSelectCommit?: (commit: () => void, slides: HTMLElement | null, index: number) => void;
		/** Content; the snippet receives `scrubbing` / `positioned`. */
		children?: Snippet<[LightboxThumbnailStripState]>;
		/** Bindable reference to the strip element. */
		ref?: HTMLDivElement | null;
	}

	/** Baked discrete-nav scrub timing (not a public prop — keep the API lean). */
	const SCRUB_DURATION_MS = 450;
	const SCRUB_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

	type SlidesVtHost = HTMLElement & {
		startViewTransition?: (cb: () => void) => unknown;
	};
</script>

<script lang="ts">
	/**
	 * Headless scroll-linked thumbnail strip.
	 *
	 * Always centers the active thumbnail under the strip midline (Photos-style).
	 * Owns midline padding, overflow clip, Slides→track sync via native
	 * `ScrollTimeline` + WAAPI (JS scroll→transform fallback when unavailable),
	 * and (by default) an element-scoped Slides view transition on pointer select.
	 * Keyboard / Previous / Next reuse the track scrub when mounted. Consumers style
	 * flex/gap, thumb size, optional midline chrome, and VT look via
	 * `--lightbox-select-vt-*` on Slides.
	 */
	import { flushSync, untrack } from 'svelte';
	import { getLightboxContext, type NavigationSource } from './lightbox-state.svelte';
	import {
		setLightboxThumbnailStripContext,
		type LightboxThumbnailStripSelectOptions
	} from './lightbox-thumbnail-strip-context';
	import { LightboxThumbnailStripCssVars } from './lightbox-css-vars';
	import {
		LightboxContentDataAttributes,
		LightboxSlidesDataAttributes
	} from './lightbox-data-attributes';
	import { slidesGeometryIsUniform, slidesScrollProgressAt } from './lightbox-slides-geometry';
	import {
		getScrollTimelineConstructor,
		measureThumbTravels,
		orderedThumbs,
		readComputedTranslateX,
		thumbTravelAtProgress,
		thumbTravelsEqual,
		trackTransform,
		trackTransformKeyframes
	} from './lightbox-thumbnail-strip-geometry';
	import { inlineTrackTranslateX, readInlineScroll } from './lightbox-direction';

	let {
		scrubOnSelect = true,
		selectViewTransition = true,
		wrapSelectCommit,
		style,
		children,
		ref = $bindable(null),
		...rest
	}: LightboxThumbnailStripProps = $props();

	const lightbox = getLightboxContext();

	/** The tablist track (transform target); the wiring effect reruns when it changes. */
	let track = $state.raw<HTMLElement | null>(null);
	/** Bumped (rAF-coalesced) when thumbs mount or unmount, to remeasure. */
	let thumbVersion = $state(0);
	let scrubbing = $state(false);
	// False on the server; flipped by the first successful refresh in the
	// mount effect, which runs before the browser paints. Client-side opens
	// therefore carry `data-positioned` on their very first painted frame.
	let positioned = $state(false);

	// Engine bookkeeping, read at event time — nothing renders from these.
	const thumbs = new Map<number, HTMLElement>();
	/** Inline distance to center each thumb (see `inlineTrackTranslateX`). */
	let thumbTravels: number[] = [];
	let linkAnim: Animation | null = null;
	let scrubAnim: Animation | null = null;
	/** True from scrub arm through scroll-link handoff (blocks attach / RO rebuild). */
	let scrubHold = false;
	/** Re-run attach (JS scroll mirror) when ScrollTimeline is unavailable. */
	let reattach: (() => void) | null = null;
	/** Mirrors Content's `data-zoomed` (held through the zoom-out animation). */
	let zoomed = false;
	let syncRaf = 0;
	let thumbBumpRaf = 0;
	let usesScrollTimeline = false;

	function registerTrack(node: HTMLElement | null) {
		if (untrack(() => track) === node) return;
		track = node;
	}

	/** Coalesce mount/unmount storms into one remeasure. */
	function bumpThumbs() {
		if (thumbBumpRaf !== 0) return;
		thumbBumpRaf = requestAnimationFrame(() => {
			thumbBumpRaf = 0;
			thumbVersion += 1;
		});
	}

	function registerThumb(index: number, node: HTMLElement) {
		if (thumbs.get(index) !== node) {
			thumbs.set(index, node);
			bumpThumbs();
		}
		return () => {
			// Only clear our own slot: when items shift, the thumb now at this
			// index may have registered before this cleanup ran.
			if (thumbs.get(index) !== node) return;
			thumbs.delete(index);
			bumpThumbs();
		};
	}

	/**
	 * Remeasure thumb centers + midline padding.
	 * @returns whether travel keyframes changed (ST must rebuild). Padding-only
	 * updates (window resize) return false so the live ScrollTimeline stays up.
	 */
	function measureThumbs(): boolean {
		const trackEl = track;
		const root = ref;
		if (!trackEl) return false;
		const dir = lightbox.dir;

		const { travels, widths } = measureThumbTravels(orderedThumbs(thumbs), dir);
		const travelsChanged = !thumbTravelsEqual(thumbTravels, travels);
		thumbTravels = travels;

		const firstWidth = widths[0] ?? 0;
		const lastWidth = widths[widths.length - 1] ?? firstWidth;
		if (root && firstWidth > 0) {
			// Asymmetric pad so the first *and* last thumb (possibly different
			// widths) can both sit on the midline. Logical padding: the first
			// thumb pads the inline-start edge in both reading directions.
			const padStart = Math.max(0, (root.clientWidth - firstWidth) / 2);
			const padEnd = Math.max(0, (root.clientWidth - lastWidth) / 2);
			// Never `removeProperty('padding-inline')` here: CSSOM expands a
			// shorthand removal into its longhands, wiping the two values just set.
			trackEl.style.paddingInlineStart = `${padStart}px`;
			trackEl.style.paddingInlineEnd = `${padEnd}px`;
		}

		const endTravel = travels[travels.length - 1] ?? 0;
		trackEl.style.setProperty(
			LightboxThumbnailStripCssVars.travel,
			`${inlineTrackTranslateX(endTravel, dir)}px`
		);
		return travelsChanged;
	}

	function syncNow() {
		if (scrubAnim) return;
		const trackEl = track;
		const slides = lightbox.slidesViewport;
		if (!trackEl || !slides) return;
		const dir = lightbox.dir;
		const t = slidesScrollProgressAt(readInlineScroll(slides, dir), lightbox.slidesGeometry);
		trackEl.style.transform = trackTransform(thumbTravelAtProgress(thumbTravels, t), dir);
	}

	function scheduleSync() {
		if (syncRaf !== 0) return;
		syncRaf = requestAnimationFrame(() => {
			syncRaf = 0;
			syncNow();
		});
	}

	/**
	 * Native Slides→track link via ScrollTimeline.
	 *
	 * Thumb scrubs *cancel* this link (not pause): a paused ScrollTimeline still
	 * retargets on the Slides jump and can win a frame over the DocumentTimeline
	 * scrub — the whole strip flashes to the destination, then the scrub restarts.
	 * On scrub end we rebuild underneath the still-filling scrub, then drop it.
	 */
	function startLinkAnimation(force = false): boolean {
		const trackEl = track;
		const slides = lightbox.slidesViewport;
		const ScrollTimeline = getScrollTimelineConstructor();
		// While the active slide is zoomed the scaled media extends the Slides
		// scroller's scrollable overflow (`Lightbox.Zoom` never clips), and a
		// ScrollTimeline maps progress over that *whole* range — the grown
		// `scrollWidth` re-maps the unchanged scrollLeft to a smaller progress
		// and the track drifts as if the user were scrolling. Snap positions do
		// not move, so fall back to the measured JS mirror until zoom rests
		// (the `data-zoomed` observer below re-arms on unzoom).
		if (zoomed) {
			usesScrollTimeline = false;
			return false;
		}
		// ScrollTimeline progress is linear in scroll distance; variable-width
		// (snug) tracks need index-linear JS sync via slidesScrollProgressAt.
		if (
			!trackEl ||
			!slides ||
			!ScrollTimeline ||
			!slidesGeometryIsUniform(lightbox.slidesGeometry)
		) {
			usesScrollTimeline = false;
			return false;
		}
		if (thumbTravels.length === 0) {
			usesScrollTimeline = false;
			return false;
		}

		// Resize often only changes midline padding — keep the live ST effect.
		if (!force && usesScrollTimeline && linkAnim != null && linkAnim.playState !== 'idle') {
			return true;
		}

		const keepPaused = scrubAnim != null || linkAnim?.playState === 'paused';

		// Pin the live translate before cancel — covers the gap until the new
		// effect is on the stack (scrub fill:forwards may already own transform).
		const pinnedX = readComputedTranslateX(trackEl);
		trackEl.style.transform = `translate3d(${pinnedX}px, 0, 0)`;

		linkAnim?.cancel();
		linkAnim = null;
		trackEl.style.removeProperty('animation');

		// `inline`, not `x`: progress must run from the inline-start edge so it
		// stays index-aligned under RTL. Identical to `x` in LTR horizontal-tb.
		const timeline = new ScrollTimeline({ source: slides, axis: 'inline' });
		const effect = new KeyframeEffect(
			trackEl,
			trackTransformKeyframes(thumbTravels, lightbox.dir),
			// `duration` is ignored for scroll progress, but Firefox will not apply
			// a ScrollTimeline effect when duration is missing / 0 — after a thumb
			// scrub drops its fill:forwards, the track then sits at keyframe 0.
			{ duration: 1, fill: 'both', easing: 'linear' }
		);
		const link = new Animation(effect, timeline);
		link.play();
		if (keepPaused) link.pause();
		linkAnim = link;
		usesScrollTimeline = true;
		return true;
	}

	// Wire the track to Slides: midline padding, travel, and the scroll link
	// (ScrollTimeline, else a JS scroll mirror). Reruns when the track, the
	// thumbs, the item count or the reading direction change.
	$effect(() => {
		void track;
		void ref;
		void thumbVersion;
		void lightbox.itemCount;
		void lightbox.dir;
		return untrack(() => {
			let ro: ResizeObserver | undefined;
			let scrollSlides: HTMLElement | null = null;
			let onScroll: (() => void) | undefined;

			const unbindScroll = () => {
				if (scrollSlides && onScroll) scrollSlides.removeEventListener('scroll', onScroll);
				scrollSlides = null;
				onScroll = undefined;
			};

			/**
			 * Update padding / travels; rebuild ST only when keyframes must change.
			 * Returns whether the track was actually positioned (bails report false
			 * so `data-positioned` can't land while the track still sits at 0).
			 */
			const refresh = (forceLink = false): boolean => {
				if (scrubHold || scrubAnim) return false;
				const slides = lightbox.slidesViewport;
				if (!track || !slides || !ref) return false;
				// The Slides SSR shift stand-in is on: the scroller sits at offset 0
				// with its content translated, so a sync now would position the track
				// for slide 0. Wait for the retire's `notifySlidesViewport`.
				if (slides.hasAttribute(LightboxSlidesDataAttributes.ssrShift)) return false;

				const travelsChanged = measureThumbs();
				if (startLinkAnimation(forceLink || travelsChanged)) {
					unbindScroll();
					return true;
				}

				// Fallback: continuous JS mirror of Slides scroll (no ScrollTimeline).
				linkAnim?.cancel();
				linkAnim = null;
				usesScrollTimeline = false;
				syncNow();
				if (scrollSlides !== slides) {
					unbindScroll();
					onScroll = () => {
						if (scrubHold || scrubAnim) return;
						scheduleSync();
					};
					slides.addEventListener('scroll', onScroll, { passive: true });
					scrollSlides = slides;
				}
				return true;
			};

			// `data-positioned` means "the track really was positioned", not "the
			// positioning code ran": flip it on the first *successful* refresh,
			// from whichever entry point (mount, resize, late Slides) gets there.
			const refreshAndMark = (forceLink: boolean) => {
				if (refresh(forceLink)) positioned = true;
			};

			if (!scrubHold && !scrubAnim && track && ref) {
				ro = new ResizeObserver(() => {
					if (scrubHold || scrubAnim) return;
					// Padding updates every time; ST rebuilds only if travels changed.
					refreshAndMark(false);
				});
				ro.observe(track);
				ro.observe(ref);
				refreshAndMark(true);
			}

			reattach = () => refreshAndMark(true);
			const unsubscribe = lightbox.subscribeSlidesViewport(() => refreshAndMark(false));

			return () => {
				unsubscribe();
				unbindScroll();
				ro?.disconnect();
				reattach = null;
				scrubHold = false;
				scrubAnim?.cancel();
				scrubAnim = null;
				linkAnim?.cancel();
				linkAnim = null;
				usesScrollTimeline = false;
				if (thumbBumpRaf !== 0) {
					cancelAnimationFrame(thumbBumpRaf);
					thumbBumpRaf = 0;
				}
				if (syncRaf !== 0) {
					cancelAnimationFrame(syncRaf);
					syncRaf = 0;
				}
				const trackEl = track;
				if (trackEl) {
					trackEl.style.removeProperty('transform');
					trackEl.style.removeProperty('animation');
					trackEl.style.removeProperty('padding-inline-start');
					trackEl.style.removeProperty('padding-inline-end');
					trackEl.style.removeProperty(LightboxThumbnailStripCssVars.travel);
				}
			};
		});
	});

	// Zoom awareness for the scroll link. `zoom-chrome.ts` publishes
	// `data-zoomed` on Content frame-accurately, so an attribute observer is the
	// cheapest correct signal. On every flip, re-attach: `startLinkAnimation`
	// refuses the ScrollTimeline while zoomed, so refresh drops to the JS
	// mirror, and re-arms the timeline once zoom rests. A flip during a scrub
	// is a no-op (refresh guards on the scrub hold); the scrub's own release
	// re-runs `startLinkAnimation`, which reads the same flag.
	$effect(() => {
		const dialog = lightbox.dialogElement;
		if (!dialog || typeof MutationObserver !== 'function') return;
		const sync = () => {
			const next = dialog.hasAttribute(LightboxContentDataAttributes.zoomed);
			if (next === zoomed) return;
			zoomed = next;
			reattach?.();
		};
		// Covers a strip mounted mid-zoom.
		untrack(sync);
		const observer = new MutationObserver(sync);
		observer.observe(dialog, {
			attributes: true,
			attributeFilter: [LightboxContentDataAttributes.zoomed]
		});
		return () => {
			observer.disconnect();
			zoomed = false;
		};
	});

	function selectIndex(index: number, options?: LightboxThumbnailStripSelectOptions) {
		const { source = 'thumbnail', stageViewTransition = true } = options ?? {};
		if (index === lightbox.activeIndex || lightbox.navigationLocked) return;

		const trackEl = track;
		const link = linkAnim;
		const slides = lightbox.slidesViewport;
		const dir = lightbox.dir;
		const reduceMotion =
			typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

		// Both physical translateX values, used symmetrically — direction only
		// enters via the travel the destination is derived from.
		const fromX = trackEl ? readComputedTranslateX(trackEl) : 0;
		const toX = inlineTrackTranslateX(thumbTravels[index] ?? 0, dir);
		const canScrub =
			scrubOnSelect &&
			!reduceMotion &&
			trackEl != null &&
			typeof trackEl.animate === 'function' &&
			Math.abs(fromX - toX) >= 0.5;

		let scrub: Animation | undefined;

		if (canScrub && trackEl) {
			scrubAnim?.cancel();
			scrubHold = true;
			// Pin, then *cancel* the scroll link. Pause is not enough on Safari:
			// the paused ScrollTimeline still retargets when Slides jump and can
			// paint the destination translate for a frame above/beside the scrub.
			trackEl.style.transform = `translate3d(${fromX}px, 0, 0)`;
			void trackEl.offsetWidth;
			link?.cancel();
			linkAnim = null;
			usesScrollTimeline = false;

			const anim = trackEl.animate(
				[
					{ transform: `translate3d(${fromX}px, 0, 0)` },
					{ transform: `translate3d(${toX}px, 0, 0)` }
				],
				{ duration: SCRUB_DURATION_MS, easing: SCRUB_EASING, fill: 'forwards' }
			);
			// Hold on the first frame until the index commit starts (so a select
			// view transition can capture a stable "old" slide).
			anim.pause();
			anim.currentTime = 0;
			scrubAnim = anim;
			scrub = anim;

			const releaseToScrollLink = () => {
				if (scrubAnim !== anim) return;
				try {
					anim.commitStyles();
				} catch {
					/* commitStyles can throw if the effect was already cleared */
				}

				// Keep the DocumentTimeline scrub on the stack (fill:forwards) while
				// arming a new ScrollTimeline underneath. Safari often paints
				// keyframe 0 on a fresh scroll link — the scrub hides that frame.
				scrubAnim = null;
				measureThumbs();
				const armed = startLinkAnimation();
				const liveLink = linkAnim;

				const dropScrub = () => {
					// A newer scrub took over — leave its hold/animation alone.
					if (scrubAnim) return;
					anim.cancel();
					trackEl.style.removeProperty('transform');
					scrubHold = false;
					scrubbing = false;
				};

				if (armed && liveLink) {
					void liveLink.ready.then(() => {
						requestAnimationFrame(() => {
							requestAnimationFrame(dropScrub);
						});
					});
					return;
				}

				// No ScrollTimeline — pin destination and use the JS scroll mirror.
				anim.cancel();
				trackEl.style.transform = `translate3d(${toX}px, 0, 0)`;
				syncNow();
				scrubHold = false;
				scrubbing = false;
				reattach?.();
			};

			void anim.finished.then(
				() => {
					if (scrubAnim !== anim) return;
					releaseToScrollLink();
				},
				() => {
					if (scrubAnim !== anim) return;
					trackEl.style.transform = `translate3d(${toX}px, 0, 0)`;
					anim.cancel();
					scrubAnim = null;
					measureThumbs();
					if (!startLinkAnimation()) {
						syncNow();
						reattach?.();
					} else {
						trackEl.style.removeProperty('transform');
					}
					scrubHold = false;
					scrubbing = false;
				}
			);
		}

		const applyIndex = () => lightbox.setActiveIndex(index, source);

		// Stage VT is pointer-select only — keyboard / buttons pass
		// `stageViewTransition: false` (instant Slides jump, strip still scrubs).
		const useSelectVt = selectViewTransition && stageViewTransition;

		const commit = () => {
			const host = slides as SlidesVtHost | null;
			const startVt = host?.startViewTransition;
			if (useSelectVt && !reduceMotion && typeof startVt === 'function') {
				startVt.call(host, () => flushSync(applyIndex));
			} else {
				flushSync(applyIndex);
			}
		};

		if (wrapSelectCommit) wrapSelectCommit(commit, slides, index);
		else commit();

		// Play after commit so wrapSelectCommit cannot flush a `scrubbing`
		// update between pause(0) and play.
		scrub?.play();
		if (scrub) scrubbing = true;
	}

	// Publish so `navigate` (Content keyboard / Previous / Next) reuses the
	// scrub path. Those sources never run the stage view transition.
	$effect(() => {
		const stripSelect = (index: number, source: NavigationSource) =>
			selectIndex(index, { source, stageViewTransition: false });
		lightbox.thumbnailStripSelect = stripSelect;
		return () => {
			if (lightbox.thumbnailStripSelect === stripSelect) lightbox.thumbnailStripSelect = null;
		};
	});

	setLightboxThumbnailStripContext({ registerTrack, registerThumb, selectIndex });
</script>

<div
	bind:this={ref}
	data-scrubbing={scrubbing ? '' : undefined}
	data-positioned={positioned ? '' : undefined}
	{...rest}
	style="position: relative; overflow: clip;{style ?? ''}"
	data-ramka-thumbnail-strip=""
>
	{@render children?.({ scrubbing, positioned })}
</div>
