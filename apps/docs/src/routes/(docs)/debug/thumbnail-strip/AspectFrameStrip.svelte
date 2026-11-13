<!--
  Debug recipe: hardcoded per-thumb aspects + nine-slice midline frame that
  morphs width on swipe / select (ScrollTimeline + WAAPI). Aspects come from
  recipe data — nothing is measured from the image or viewport.
-->
<script lang="ts" module>
	import type { StripPhoto } from './photos';

	export type AspectFramePhoto = Pick<StripPhoto, 'id' | 'thumb' | 'alt' | 'aspect'>;

	/** Match `Lightbox.ThumbnailStrip` scrub defaults (track + indicator width scrub). */
	const THUMBNAIL_STRIP_SCRUB_MS = 450;
	const THUMBNAIL_STRIP_SCRUB_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

	type ScrollTimelineConstructor = new (options?: {
		source?: Element | Document | null;
		axis?: 'block' | 'inline' | 'x' | 'y';
	}) => AnimationTimeline;

	function getScrollTimelineConstructor(): ScrollTimelineConstructor | null {
		if (typeof window === 'undefined') return null;
		const ctor = (window as Window & { ScrollTimeline?: ScrollTimelineConstructor }).ScrollTimeline;
		return typeof ctor === 'function' ? ctor : null;
	}

	/** Docs-local copy of ramka `slidesScrollProgress` (JS fallback). */
	function demoSlidesScrollProgress(
		viewport: HTMLElement,
		geometry: { offsets?: number[]; base: number; step: number; count: number }
	): number {
		const { offsets, base, step, count } = geometry;
		if (count <= 1) return 0;
		if (offsets && offsets.length === count) {
			const scroll = viewport.scrollLeft;
			const first = offsets[0]!;
			const last = offsets[count - 1]!;
			if (scroll <= first) return 0;
			if (scroll >= last) return 1;
			for (let i = 0; i < count - 1; i++) {
				const a = offsets[i]!;
				const b = offsets[i + 1]!;
				if (scroll <= b) {
					const t = (scroll - a) / (b - a || 1);
					return (i + t) / (count - 1);
				}
			}
			return 1;
		}
		const logicalMax = Math.max(0, count - 1) * step;
		if (logicalMax <= 0) return 0;
		return Math.min(1, Math.max(0, (viewport.scrollLeft - base) / logicalMax));
	}

	function lerp(a: number, b: number, t: number): number {
		return a + (b - a) * t;
	}

	/**
	 * Nine-slice selection frame (transform-only morph).
	 *
	 * Fixed outer host (max thumb aspect + outset). Left/right caps keep
	 * `border-radius`; top/bottom edges `scaleX`; shell + right cap `translateX`.
	 * Outset = offset + stroke so a 2px gap sits between thumb and the 2px border.
	 */
	/** Gap between thumb edge and inner edge of the stroke. */
	const FRAME_OFFSET_PX = 2;
	/** Border thickness on caps / edges. */
	const FRAME_STROKE_PX = 2;
	/** Per-side growth beyond the thumb (offset + stroke), with border-box. */
	const FRAME_OUTSET_PX = FRAME_OFFSET_PX + FRAME_STROKE_PX;
	/** Cap width — ≥ thumb radius + offset so concentric corners stay round. */
	const FRAME_CAP_PX = 8;

	type FrameGeom = {
		/** Thumb height in px (shell is thumb + 2×outset). */
		thumbHeightPx: number;
		/** Max frame outer width (widest thumb + 2×outset). */
		maxWidthPx: number;
		outset: number;
		cap: number;
	};

	type FramePose = {
		/** Thumb width this pose corresponds to (not the expanded frame width). */
		thumbWidthPx: number;
		shell: string;
		right: string;
		bar: string;
	};

	type FramePieces = {
		host: HTMLElement;
		shell: HTMLElement;
		right: HTMLElement;
		top: HTMLElement;
		bottom: HTMLElement;
	};

	function frameMaxAspect(aspects: number[]): number {
		let max = 16 / 9;
		for (const a of aspects) {
			if (a > max) max = a;
		}
		return max;
	}

	/** Expand thumb size by outset on each side, then build transform pose. */
	function framePose(thumbWidthPx: number, geom: FrameGeom): FramePose {
		const w = Math.max(geom.cap * 2, thumbWidthPx + geom.outset * 2);
		const mid = Math.max(0, w - geom.cap * 2);
		const x = (geom.maxWidthPx - w) / 2;
		return {
			thumbWidthPx,
			shell: `translate3d(${x}px, 0px, 0)`,
			right: `translate3d(${w - geom.cap}px, 0, 0)`,
			bar: `scaleX(${mid})`
		};
	}

	function writeFramePose(pieces: FramePieces, pose: FramePose) {
		pieces.shell.style.transform = pose.shell;
		pieces.right.style.transform = pose.right;
		pieces.top.style.transform = pose.bar;
		pieces.bottom.style.transform = pose.bar;
	}

	function clearFrameInlineTransforms(pieces: FramePieces) {
		pieces.shell.style.removeProperty('transform');
		pieces.right.style.removeProperty('transform');
		pieces.top.style.removeProperty('transform');
		pieces.bottom.style.removeProperty('transform');
	}

	function cancelAnimations(anims: Animation[] | null | undefined) {
		if (!anims) return;
		for (const anim of anims) anim.cancel();
	}

	/** Equal-offset transform keyframes for one piece (ScrollTimeline 0→1). */
	function poseTransformKeyframes(poses: FramePose[], pick: (p: FramePose) => string): Keyframe[] {
		const max = Math.max(0, poses.length - 1);
		return poses.map((pose, i) => ({
			offset: max === 0 ? 0 : i / max,
			transform: pick(pose)
		}));
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import * as Lightbox from 'ramka-svelte/lightbox';
	import { getLightboxContext } from 'ramka-svelte';
	import './aspect-frame-strip.css';

	let {
		photos,
		class: className = 'ts-debug-strip ts-debug-aspect-frame'
	}: { photos: AspectFramePhoto[]; class?: string } = $props();

	const lightbox = getLightboxContext();

	let host = $state.raw<HTMLSpanElement | null>(null);
	let shell = $state.raw<HTMLSpanElement | null>(null);
	let right = $state.raw<HTMLSpanElement | null>(null);
	let top = $state.raw<HTMLSpanElement | null>(null);
	let bottom = $state.raw<HTMLSpanElement | null>(null);

	const itemAspects = $derived(photos.map((p) => p.aspect));
	const maxAspect = $derived(frameMaxAspect(itemAspects));

	// Engine bookkeeping, read at event time.
	let linkAnims: Animation[] | null = null;
	let scrubAnims: Animation[] | null = null;
	let usesScrollTimeline = false;
	let hold = false;
	let width = 56 * (untrack(() => itemAspects[0]) ?? 16 / 9);
	let reattach: (() => void) | null = null;

	function getPieces(): FramePieces | null {
		if (!host || !shell || !right || !top || !bottom) return null;
		return { host, shell, right, top, bottom };
	}

	function measureGeom(): FrameGeom {
		const thumbHeightPx = Math.max(
			1,
			(host?.clientHeight ?? 56 + FRAME_OUTSET_PX * 2) - FRAME_OUTSET_PX * 2
		);
		const maxWidthPx = thumbHeightPx * frameMaxAspect(itemAspects) + FRAME_OUTSET_PX * 2;
		return { thumbHeightPx, maxWidthPx, outset: FRAME_OUTSET_PX, cap: FRAME_CAP_PX };
	}

	function syncFromScroll() {
		if (hold || scrubAnims) return;
		const pieces = getPieces();
		const slides = lightbox.slidesViewport;
		const aspects = itemAspects;
		if (!pieces || !slides || aspects.length === 0) return;
		const geom = measureGeom();
		const geometry = lightbox.slidesGeometry;
		const progress = demoSlidesScrollProgress(slides, geometry);
		const max = Math.max(0, geometry.count - 1);
		let aspect = aspects[0] ?? 16 / 9;
		if (max > 0) {
			const f = progress * max;
			const i0 = Math.min(max, Math.floor(f));
			const i1 = Math.min(max, i0 + 1);
			aspect = lerp(aspects[i0] ?? 16 / 9, aspects[i1] ?? aspects[i0] ?? 16 / 9, f - i0);
		}
		const pose = framePose(geom.thumbHeightPx * aspect, geom);
		width = pose.thumbWidthPx;
		writeFramePose(pieces, pose);
	}

	function startAspectLink(force = false): boolean {
		if (hold && !force) return usesScrollTimeline;

		const pieces = getPieces();
		const slides = lightbox.slidesViewport;
		const ScrollTimeline = getScrollTimelineConstructor();
		const aspects = itemAspects;
		const geometry = lightbox.slidesGeometry;
		const uniform =
			!geometry.offsets ||
			geometry.offsets.length !== geometry.count ||
			geometry.count < 2 ||
			geometry.offsets.every(
				(offset, i) => Math.abs(offset - (geometry.base + i * geometry.step)) < 1
			);
		if (
			!pieces ||
			!slides ||
			aspects.length === 0 ||
			!ScrollTimeline ||
			!uniform ||
			typeof KeyframeEffect === 'undefined' ||
			typeof Animation === 'undefined'
		) {
			usesScrollTimeline = false;
			return false;
		}

		// Thumb height / aspects unchanged — keep the live scroll link.
		if (!force && usesScrollTimeline && linkAnims != null && linkAnims.length > 0) {
			return true;
		}

		const keepPaused = scrubAnims != null || linkAnims?.some((a) => a.playState === 'paused');
		cancelAnimations(linkAnims);
		linkAnims = null;

		const geom = measureGeom();
		const poses = aspects.map((aspect) => framePose(geom.thumbHeightPx * aspect, geom));
		const timeline = new ScrollTimeline({ source: slides, axis: 'x' });
		const effectOpts: KeyframeEffectOptions = { duration: 1, fill: 'both', easing: 'linear' };
		const links = (
			[
				[pieces.shell, (p: FramePose) => p.shell],
				[pieces.right, (p: FramePose) => p.right],
				[pieces.top, (p: FramePose) => p.bar],
				[pieces.bottom, (p: FramePose) => p.bar]
			] as const
		).map(
			([el, pick]) =>
				new Animation(
					new KeyframeEffect(el, poseTransformKeyframes(poses, pick), effectOpts),
					timeline
				)
		);
		for (const link of links) {
			link.play();
			if (keepPaused) link.pause();
		}
		linkAnims = links;
		usesScrollTimeline = true;

		void links[0]!.ready.then(() => {
			requestAnimationFrame(() => {
				if (linkAnims !== links || scrubAnims || hold) return;
				clearFrameInlineTransforms(pieces);
			});
		});
		return true;
	}

	$effect(() => {
		void itemAspects;
		return untrack(() => {
			let raf = 0;
			let ro: ResizeObserver | undefined;
			let scrollSlides: HTMLElement | null = null;
			let lastLinkHeight = 0;

			const scheduleSync = () => {
				if (raf !== 0) return;
				raf = requestAnimationFrame(() => {
					raf = 0;
					syncFromScroll();
				});
			};

			const unbindScroll = () => {
				scrollSlides?.removeEventListener('scroll', scheduleSync);
				scrollSlides = null;
			};

			/**
			 * Wire observers once; rebuild ST only when thumb height (rem/zoom) changes.
			 * Slides viewport resize must NOT cancel+rebuild — keyframes are aspect-based
			 * and ScrollTimeline remaps progress automatically (same glitch as the track).
			 */
			const refresh = (forceLink = false) => {
				if (hold || scrubAnims) return;
				const slides = lightbox.slidesViewport;
				const pieces = getPieces();
				if (!slides || !pieces) return;

				const geom = measureGeom();
				const heightChanged = Math.round(geom.thumbHeightPx) !== lastLinkHeight;

				if (!ro) {
					let roRaf = 0;
					ro = new ResizeObserver(() => {
						if (hold || scrubAnims) return;
						if (roRaf !== 0) return;
						roRaf = requestAnimationFrame(() => {
							roRaf = 0;
							const nextH = Math.round(measureGeom().thumbHeightPx);
							if (nextH === lastLinkHeight) return;
							lastLinkHeight = nextH;
							startAspectLink(true);
						});
					});
					ro.observe(pieces.host);
				}

				if (usesScrollTimeline && !forceLink && !heightChanged) return;

				lastLinkHeight = Math.round(geom.thumbHeightPx);
				if (startAspectLink(forceLink || heightChanged)) {
					unbindScroll();
					return;
				}

				// JS fallback mirror.
				cancelAnimations(linkAnims);
				linkAnims = null;
				usesScrollTimeline = false;
				syncFromScroll();
				if (scrollSlides !== slides) {
					unbindScroll();
					slides.addEventListener('scroll', scheduleSync, { passive: true });
					scrollSlides = slides;
				}
			};

			reattach = () => refresh(true);
			refresh(true);
			const unsubscribe = lightbox.subscribeSlidesViewport(() => refresh(false));
			return () => {
				unsubscribe();
				unbindScroll();
				reattach = null;
				ro?.disconnect();
				cancelAnimations(scrubAnims);
				scrubAnims = null;
				cancelAnimations(linkAnims);
				linkAnims = null;
				usesScrollTimeline = false;
				hold = false;
				if (raf !== 0) cancelAnimationFrame(raf);
			};
		});
	});

	/**
	 * WAAPI transform scrub on the nine-slice pieces around the index commit.
	 * Slides view transition is baked into ThumbnailStrip (`selectViewTransition`).
	 */
	function wrapThumbSelectCommit(commit: () => void, _slides: HTMLElement | null, index: number) {
		const reduceMotion =
			typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
		const pieces = getPieces();
		const aspects = itemAspects;
		const links = linkAnims;
		const geom = measureGeom();

		const fromPose = framePose(width, geom);
		const toWidth =
			geom.thumbHeightPx * (aspects[index] ?? aspects[lightbox.activeIndex] ?? 16 / 9);
		const toPose = framePose(toWidth, geom);

		hold = true;

		const canScrub =
			!reduceMotion &&
			pieces != null &&
			typeof pieces.shell.animate === 'function' &&
			Number.isFinite(index) &&
			width > 0 &&
			Math.abs(width - toPose.thumbWidthPx) > 0.5;

		let scrubPrimary: Animation | undefined;

		if (canScrub && pieces) {
			writeFramePose(pieces, fromPose);
			void pieces.host.offsetWidth;
			cancelAnimations(links);
			linkAnims = null;
			usesScrollTimeline = false;

			cancelAnimations(scrubAnims);
			const scrubOpts: KeyframeAnimationOptions = {
				duration: THUMBNAIL_STRIP_SCRUB_MS,
				easing: THUMBNAIL_STRIP_SCRUB_EASE,
				fill: 'forwards'
			};
			const scrubs = [
				pieces.shell.animate(
					[{ transform: fromPose.shell }, { transform: toPose.shell }],
					scrubOpts
				),
				pieces.right.animate(
					[{ transform: fromPose.right }, { transform: toPose.right }],
					scrubOpts
				),
				pieces.top.animate([{ transform: fromPose.bar }, { transform: toPose.bar }], scrubOpts),
				pieces.bottom.animate([{ transform: fromPose.bar }, { transform: toPose.bar }], scrubOpts)
			];
			for (const scrub of scrubs) {
				scrub.pause();
				scrub.currentTime = 0;
			}
			scrubAnims = scrubs;
			scrubPrimary = scrubs[0];
			width = toPose.thumbWidthPx;

			const releaseToScrollLink = () => {
				if (scrubAnims !== scrubs) return;
				for (const scrub of scrubs) {
					try {
						scrub.commitStyles();
					} catch {
						/* commitStyles can throw if the effect was already cleared */
					}
				}

				scrubAnims = null;
				const armed = startAspectLink(true);
				const liveLinks = linkAnims;

				const dropScrub = () => {
					if (scrubAnims) return;
					cancelAnimations(scrubs);
					clearFrameInlineTransforms(pieces);
					hold = false;
				};

				if (armed && liveLinks?.[0]) {
					void liveLinks[0].ready.then(() => {
						requestAnimationFrame(() => {
							requestAnimationFrame(dropScrub);
						});
					});
					return;
				}

				cancelAnimations(scrubs);
				writeFramePose(pieces, framePose(toPose.thumbWidthPx, measureGeom()));
				hold = false;
				syncFromScroll();
				reattach?.();
			};

			void scrubs[0]!.finished.then(
				() => {
					if (scrubAnims !== scrubs) return;
					releaseToScrollLink();
				},
				() => {
					if (scrubAnims !== scrubs) return;
					cancelAnimations(scrubs);
					scrubAnims = null;
					writeFramePose(pieces, framePose(toPose.thumbWidthPx, measureGeom()));
					hold = false;
					if (!startAspectLink(true)) {
						syncFromScroll();
						reattach?.();
					} else {
						clearFrameInlineTransforms(pieces);
					}
				}
			);
		}

		commit();

		if (scrubPrimary && scrubAnims) {
			for (const scrub of scrubAnims) scrub.play();
		} else {
			hold = false;
			const liveLinks = linkAnims;
			if (liveLinks && usesScrollTimeline) {
				for (const link of liveLinks) link.play();
			} else if (!startAspectLink() && pieces) {
				const pose = framePose(toPose.thumbWidthPx, measureGeom());
				width = pose.thumbWidthPx;
				writeFramePose(pieces, pose);
			}
		}
	}
</script>

<Lightbox.ThumbnailStrip
	class={className}
	wrapSelectCommit={wrapThumbSelectCommit}
	style="--ts-frame-max-aspect: {maxAspect}; --ts-frame-cap: {FRAME_CAP_PX}px;"
>
	<div class="ts-debug-aspect-host">
		<Lightbox.ThumbnailStripTrack aria-label="Photo thumbnails">
			{#each photos as item, i (item.id)}
				<Lightbox.Thumbnail index={i} style="--ts-aspect: {itemAspects[i] ?? 16 / 9}">
					<img src={item.thumb} alt={item.alt} draggable="false" />
				</Lightbox.Thumbnail>
			{/each}
		</Lightbox.ThumbnailStripTrack>
		<span bind:this={host} class="ts-debug-aspect-frame-indicator" aria-hidden="true">
			<span bind:this={shell} class="ts-debug-aspect-frame-shell">
				<span class="ts-debug-aspect-frame-cap ts-debug-aspect-frame-cap-left"></span>
				<span bind:this={right} class="ts-debug-aspect-frame-cap ts-debug-aspect-frame-cap-right"
				></span>
				<span bind:this={top} class="ts-debug-aspect-frame-edge ts-debug-aspect-frame-edge-top"
				></span>
				<span
					bind:this={bottom}
					class="ts-debug-aspect-frame-edge ts-debug-aspect-frame-edge-bottom"
				></span>
			</span>
		</span>
	</div>
</Lightbox.ThumbnailStrip>
