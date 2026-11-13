/**
 * Pull-to-dismiss: drag the image vertically (touch, or a two-finger trackpad
 * swipe) to close the lightbox. A port of ramka's `usePullToDismiss`; the
 * behaviour, thresholds and spring are unchanged. As a Svelte attachment it
 * binds to `Lightbox.Content` and reads everything else through live getters
 * on `host`, so nothing re-binds while the viewer is open.
 */
import type { Attachment } from 'svelte/attachments';
import { untrack } from 'svelte';
import { clamp } from './gesture-shared';
import {
	computePullTransform,
	computePullVelocity,
	resolveDragAxis,
	shouldDismissPull,
	springEasingLinear,
	wheelAxis
} from './pull-math';
import { LightboxContentCssVars } from './lightbox-css-vars';

const DIRECTION_LOCK_DISTANCE = 6;
const DISMISS_DISTANCE = 100;
const DISMISS_VELOCITY = 400;
const SNAP_DURATION = 270;
// Critically damped (no overshoot). A higher `settle` front-loads the motion so
// most of the distance is covered early and the spring arrives decisively.
const SNAP_DAMPING = 1;
const SNAP_SETTLE = 7.5;
// Fallback for engines without CSS `linear()` easing (pre-2024 Safari): a firm,
// no-overshoot decelerating ease close to the spring.
const SNAP_EASING_FALLBACK = 'cubic-bezier(0.33, 1, 0.68, 1)';
// Cap the normalized release velocity fed into the spring so a tiny pull
// released with a quick flick can't blow up the follow-through.
const MAX_SNAP_VELOCITY = 2.5;
const MIN_SCALE = 0.85;
const VELOCITY_SAMPLES = 5;

// Trackpad: a two-finger swipe is a stream of pixel-mode wheel events with no
// end event, so the gesture ends after this idle gap.
const WHEEL_IDLE_END = 90;
// A single mouse-wheel notch can exceed the dismiss distance; trackpads emit
// many small events per swipe.
const MIN_WHEEL_EVENTS = 3;
// Events at least this ratio horizontal (above the jitter floor) are foreign
// to a locked vertical pull — a sideways flick or its momentum tail.
const WHEEL_CROSS_AXIS_RATIO = 2;
const WHEEL_CROSS_AXIS_FLOOR = 4;

/**
 * Targets that must not start a touch pull: letterbox and empty stage area can
 * dismiss, but controls keep their native press. Mark custom chrome with
 * `data-ramka-no-pull`.
 */
const PULL_IGNORED_TARGET_SELECTOR = [
	'a[href]',
	'button',
	'input',
	'select',
	'textarea',
	'label',
	'summary',
	'[contenteditable]:not([contenteditable="false"])',
	'[role="button"]',
	'[role="link"]',
	'[role="menuitem"]',
	'[role="option"]',
	'[role="switch"]',
	'[role="tab"]',
	'[role="checkbox"]',
	'[role="radio"]',
	'[role="slider"]',
	'[data-ramka-no-pull]'
].join(',');

/**
 * 0 at rest → 1 at the dismiss threshold, on Content and Backdrop while a drag
 * is in flight. Consumers derive backdrop opacity, chrome fades and the like
 * from it, e.g. `opacity: calc(1 - var(--lightbox-pull-progress, 0) * 0.6)`.
 */
const PULL_PROGRESS_VAR = LightboxContentCssVars.pullProgress;
/**
 * The snap-back's duration and easing, published only while a cancelled pull
 * springs back, so visuals keyed to the progress var ease back on the item's
 * exact curve.
 */
const PULL_SNAP_DURATION_VAR = LightboxContentCssVars.pullSnapDuration;
const PULL_SNAP_EASING_VAR = LightboxContentCssVars.pullSnapEasing;

const supportsLinearEasing =
	typeof CSS !== 'undefined' && typeof CSS.supports === 'function'
		? CSS.supports('transition-timing-function', 'linear(0, 1)')
		: false;

export interface PullToDismissHost {
	/**
	 * The Root's open state (reactive). A reopen can land while Content is still
	 * mounted from an interrupted close; its opening edge clears what that
	 * dismiss left behind.
	 */
	readonly open: boolean;
	readonly backdrop: HTMLElement | null;
	/** What moves with the finger: the shared morph destination, else the active item. */
	readonly dragTarget: HTMLElement | null;
	/** When set, only touches and wheels inside it can pull (side panels stay native). */
	readonly stage: HTMLElement | null;
	/** True while a `Lightbox.Slides` swipe or fling is in flight. */
	readonly navigationLocked: boolean;
	getZoom(): number;
	close(): void;
}

type Axis = 'none' | 'vertical' | 'horizontal';

export function pullToDismiss(host: PullToDismissHost): Attachment<HTMLElement> {
	return (el) => {
		let pointerId: number | null = null;
		let startX = 0;
		let startY = 0;
		let direction: Axis = 'none';
		let velocityHistory: { y: number; t: number }[] = [];
		let isPulling = false;
		let animation: Animation | null = null;
		let dragTarget: HTMLElement | null = null;
		// The element a committed dismiss left pulled offscreen, cleared by a
		// reopen that reuses the mounted tree.
		let dismissedTarget: HTMLElement | null = null;
		// Last displayed (damped) vertical offset: the spring's amplitude.
		let lastAppliedY = 0;

		let wheelDir: Axis = 'none';
		// Y drives the gesture; X is follow-along liveliness, integrated only from
		// events that pass the cross-axis filter.
		let wheelPullX = 0;
		let wheelPullY = 0;
		let wheelCount = 0;
		let wheelIdle: ReturnType<typeof setTimeout> | null = null;
		// A committed wheel dismiss ignores its momentum tail, so the tail can't
		// restart a pull and reset the item mid-close.
		let wheelDismissed = false;
		// Same latch after a snap-back, released by its own idle timer.
		let wheelTail = false;
		// This wheel sequence was claimed by a Slides scroll.
		let wheelLockedByScroll = false;

		const surfaces = () => [el, host.backdrop];

		function endPointer() {
			pointerId = null;
			direction = 'none';
			velocityHistory = [];
			isPulling = false;
			// dragTarget stays: snapBack() and clearTransform() still need it.
		}

		function applyTransform(rawDeltaX: number, rawDeltaY: number) {
			if (!dragTarget) return;
			const { x, y, scale, progress } = computePullTransform(
				rawDeltaX,
				rawDeltaY,
				DISMISS_DISTANCE,
				MIN_SCALE
			);
			dragTarget.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
			lastAppliedY = y;
			for (const surface of surfaces()) {
				surface?.style.setProperty(PULL_PROGRESS_VAR, String(progress));
			}
		}

		function clearTransform() {
			if (dragTarget) {
				dragTarget.style.transform = '';
				dragTarget = null;
			}
			lastAppliedY = 0;
			for (const surface of surfaces()) {
				if (!surface) continue;
				surface.removeAttribute('data-pulling');
				surface.removeAttribute('data-pull-snapping');
				surface.style.removeProperty(PULL_PROGRESS_VAR);
				surface.style.removeProperty(PULL_SNAP_DURATION_VAR);
				surface.style.removeProperty(PULL_SNAP_EASING_VAR);
			}
		}

		function cancelSnapBack() {
			if (!animation) return;
			animation.cancel();
			animation = null;
			clearTransform();
		}

		function snapBack(velocity = 0) {
			const target = dragTarget;
			const releaseY = lastAppliedY;
			const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			const duration = reducedMotion ? 0 : SNAP_DURATION;

			// Feed the release velocity into the spring so the snap-back carries on
			// in the gesture's direction before settling, like native iOS:
			// d(fraction)/d(progress) at 0 = velocity * durationSeconds / releaseY.
			const normalizedVelocity =
				duration > 0 && Math.abs(releaseY) > 1
					? clamp((velocity * (duration / 1000)) / releaseY, -MAX_SNAP_VELOCITY, MAX_SNAP_VELOCITY)
					: 0;
			const snapEasing = supportsLinearEasing
				? springEasingLinear(normalizedVelocity, SNAP_DAMPING, SNAP_SETTLE)
				: SNAP_EASING_FALLBACK;

			// Hand styling back to the consumer on the item's curve: publish the snap
			// timing, drop `data-pulling` (re-enabling their transitions), latch
			// `data-pull-snapping` until the item is parked, and ease progress to 0.
			for (const surface of surfaces()) {
				if (!surface) continue;
				surface.style.setProperty(PULL_SNAP_DURATION_VAR, `${duration}ms`);
				surface.style.setProperty(PULL_SNAP_EASING_VAR, snapEasing);
				surface.removeAttribute('data-pulling');
				surface.setAttribute('data-pull-snapping', '');
				surface.style.setProperty(PULL_PROGRESS_VAR, '0');
			}

			if (!target) {
				dragTarget = null;
				for (const surface of surfaces()) surface?.removeAttribute('data-pull-snapping');
				return;
			}

			// Clear the inline transform first: the animation overrides it while it
			// plays, so when it finishes the underlying value is already clean.
			const currentTransform = target.style.transform;
			target.style.transform = '';
			const keyframes = [
				{ transform: currentTransform },
				{ transform: 'translate(0, 0) scale(1)' }
			];
			let targetAnimation: Animation;
			try {
				targetAnimation = target.animate(keyframes, { duration, easing: snapEasing });
			} catch {
				targetAnimation = target.animate(keyframes, { duration, easing: SNAP_EASING_FALLBACK });
			}
			animation = targetAnimation;

			targetAnimation.finished
				.then(() => {
					animation = null;
					targetAnimation.cancel();
					dragTarget = null;
					// At rest: drop the vars so the consumer's fallbacks take over.
					for (const surface of surfaces()) {
						surface?.style.removeProperty(PULL_PROGRESS_VAR);
						surface?.style.removeProperty(PULL_SNAP_DURATION_VAR);
						surface?.style.removeProperty(PULL_SNAP_EASING_VAR);
						surface?.removeAttribute('data-pull-snapping');
					}
				})
				.catch(() => {
					// Cancelled — whoever cancelled it cleaned up.
				});
		}

		/** Hand off from pulling to the close; chrome stays hidden through it. */
		function dismiss() {
			el.setAttribute('data-pull-dismissing', '');
			el.removeAttribute('data-pulling');
			host.backdrop?.removeAttribute('data-pulling');
			dismissedTarget = dragTarget;
			dragTarget = null;
			host.close();
		}

		/**
		 * Clear what a committed dismiss deliberately leaves for the close
		 * animation: `data-pull-dismissing`, the faded progress, the wheel latches
		 * and the dismissed item's transform. Idempotent.
		 */
		function resetDismissState() {
			wheelDismissed = false;
			wheelTail = false;
			if (dismissedTarget) {
				dismissedTarget.style.transform = '';
				dismissedTarget = null;
			}
			for (const surface of surfaces()) {
				if (!surface) continue;
				surface.removeAttribute('data-pulling');
				surface.removeAttribute('data-pull-snapping');
				surface.removeAttribute('data-pull-dismissing');
				surface.style.removeProperty(PULL_PROGRESS_VAR);
				surface.style.removeProperty(PULL_SNAP_DURATION_VAR);
				surface.style.removeProperty(PULL_SNAP_EASING_VAR);
			}
		}

		// Reset on mount and on every opening edge — never the closing edge,
		// which must keep `data-pull-dismissing` through the close animation. A
		// pre-effect, so a reopen clears stale state before the open transition
		// captures it.
		$effect.pre(() => {
			if (host.open) untrack(resetDismissState);
		});

		const zoomBusy = () => host.getZoom() > 1 || el.hasAttribute('data-zooming');

		function handlePointerDown(event: PointerEvent) {
			if (event.pointerType !== 'touch') return;
			if (pointerId !== null) return;
			if (host.navigationLocked) return;
			const target = event.target as Element | null;
			if (!target) return;
			const stage = host.stage;
			if (stage && !stage.contains(target)) return;
			if (target.closest(PULL_IGNORED_TARGET_SELECTOR)) return;
			const nextTarget = host.dragTarget;
			if (!nextTarget) return;
			if (zoomBusy()) return;

			cancelSnapBack();
			dragTarget = nextTarget;
			pointerId = event.pointerId;
			startY = event.clientY;
			startX = event.clientX;
			direction = 'none';
			velocityHistory = [{ y: event.clientY, t: event.timeStamp }];
		}

		function handlePointerMove(event: PointerEvent) {
			if (event.pointerId !== pointerId) return;
			// Zoom started mid-pull: give it the gesture.
			if (zoomBusy()) {
				if (isPulling) {
					isPulling = false;
					snapBack();
				}
				endPointer();
				return;
			}

			let deltaX = event.clientX - startX;
			let deltaY = event.clientY - startY;

			if (direction === 'none') {
				const axis = resolveDragAxis(deltaX, deltaY, DIRECTION_LOCK_DISTANCE);
				if (axis === 'none') return;
				direction = axis;
				if (axis === 'horizontal') {
					endPointer();
					return;
				}
				// Re-anchor where the pull was recognized so the image starts from 0
				// instead of jumping by the lock distance.
				startX = event.clientX;
				startY = event.clientY;
				deltaX = 0;
				deltaY = 0;
			}
			if (direction !== 'vertical') return;

			if (!isPulling) {
				isPulling = true;
				el.setAttribute('data-pulling', '');
				host.backdrop?.setAttribute('data-pulling', '');
				el.setPointerCapture(event.pointerId);
			}
			velocityHistory.push({ y: event.clientY, t: event.timeStamp });
			if (velocityHistory.length > VELOCITY_SAMPLES) velocityHistory.shift();
			applyTransform(deltaX, deltaY);
		}

		function handlePointerUp(event: PointerEvent) {
			if (event.pointerId !== pointerId) return;
			const wasPulling = isPulling;
			const deltaY = event.clientY - startY;
			const velocity = computePullVelocity(velocityHistory);
			endPointer();
			if (!wasPulling) return;
			if (shouldDismissPull(deltaY, velocity, DISMISS_DISTANCE, DISMISS_VELOCITY)) dismiss();
			else snapBack(velocity);
		}

		function handlePointerCancel(event: PointerEvent) {
			if (event.pointerId !== pointerId) return;
			const wasPulling = isPulling;
			endPointer();
			if (wasPulling) snapBack();
		}

		// Cancel native scrolling only once the drag is a vertical pull, so
		// gallery swipes stay native until then.
		function handleTouchMove(event: TouchEvent) {
			if (pointerId === null || direction !== 'vertical') return;
			if (event.touches.length === 1) event.preventDefault();
		}

		function clearWheelIdle() {
			if (wheelIdle) clearTimeout(wheelIdle);
			wheelIdle = null;
		}

		function resetWheel() {
			wheelDir = 'none';
			wheelPullX = 0;
			wheelPullY = 0;
			wheelCount = 0;
			wheelLockedByScroll = false;
			clearWheelIdle();
		}

		function scheduleWheelIdle() {
			clearWheelIdle();
			wheelIdle = setTimeout(() => finishWheel(false), WHEEL_IDLE_END);
		}

		/** Swallow a resolved pull's momentum tail until a real idle gap. */
		function armWheelTail() {
			wheelTail = true;
			clearWheelIdle();
			wheelIdle = setTimeout(() => {
				wheelTail = false;
				wheelIdle = null;
			}, WHEEL_IDLE_END);
		}

		function finishWheel(dismissNow: boolean) {
			const wasVertical = wheelDir === 'vertical';
			const pulledY = wheelPullY;
			const count = wheelCount;
			resetWheel();
			if (!wasVertical) return;
			if ((dismissNow || Math.abs(pulledY) >= DISMISS_DISTANCE) && count >= MIN_WHEEL_EVENTS) {
				// The wheel listener never cancels events, so the browser keeps the
				// whole stream (momentum included) latched to Content's contained
				// scroll chain and off the page; the latch only stops a restart.
				wheelDismissed = true;
				dismiss();
			} else {
				armWheelTail();
				snapBack();
			}
		}

		function handleWheel(event: WheelEvent) {
			if (wheelDismissed) return;
			// Pixel-mode deltas are precision devices; line/page mode is a mouse wheel.
			if (event.deltaMode !== 0) return;
			if (zoomBusy()) return;
			if (pointerId !== null) return;
			if (event.ctrlKey) return; // pinch-zoom
			const stage = host.stage;
			const wheelTarget = event.target as Node | null;
			if (stage && wheelTarget && !stage.contains(wheelTarget)) return;

			if (wheelTail) {
				armWheelTail();
				return;
			}

			// A gallery scroll owns this sequence until `scrollend`; latch it as
			// horizontal so a mid-gesture vertical turn can't start a pull.
			if (host.navigationLocked && wheelDir !== 'vertical') {
				wheelDir = 'horizontal';
				wheelLockedByScroll = true;
				scheduleWheelIdle();
				return;
			}
			if (wheelLockedByScroll) {
				wheelLockedByScroll = false;
				wheelDir = 'none';
			}

			if (wheelDir === 'none') {
				const axis = wheelAxis(event.deltaX, event.deltaY);
				if (axis === 'none') return;
				const nextTarget = axis === 'vertical' ? host.dragTarget : null;
				if (!nextTarget) {
					// Horizontal belongs to the gallery (or there's nothing to pull).
					wheelDir = 'horizontal';
					scheduleWheelIdle();
					return;
				}
				cancelSnapBack();
				dragTarget = nextTarget;
				wheelDir = 'vertical';
				wheelPullX = 0;
				wheelPullY = 0;
				wheelCount = 0;
				el.setAttribute('data-pulling', '');
				host.backdrop?.setAttribute('data-pulling', '');
			}

			if (wheelDir !== 'vertical') {
				scheduleWheelIdle();
				return;
			}

			// A locked pull listens to its own axis only. Drop foreign events
			// without refreshing the idle timer, so the pull still resolves ~90ms
			// after the last vertical input.
			if (
				Math.abs(event.deltaX) > WHEEL_CROSS_AXIS_RATIO * Math.abs(event.deltaY) &&
				Math.abs(event.deltaX) >= WHEEL_CROSS_AXIS_FLOOR
			) {
				return;
			}

			scheduleWheelIdle();
			// Content follows the fingers (natural scroll: fingers down → negative deltas).
			wheelPullX -= event.deltaX;
			wheelPullY -= event.deltaY;
			wheelCount += 1;
			applyTransform(wheelPullX, wheelPullY);
			if (Math.abs(wheelPullY) >= DISMISS_DISTANCE && wheelCount >= MIN_WHEEL_EVENTS) {
				finishWheel(true);
			}
		}

		el.addEventListener('pointerdown', handlePointerDown);
		el.addEventListener('pointermove', handlePointerMove);
		el.addEventListener('pointerup', handlePointerUp);
		el.addEventListener('pointercancel', handlePointerCancel);
		el.addEventListener('touchmove', handleTouchMove, { passive: false });
		// Passive on purpose: cancelling a wheel event would forfeit the browser's
		// latch of the gesture to Content's contained scroll chain, and the
		// leftover momentum would scroll the page behind the closing viewer.
		el.addEventListener('wheel', handleWheel, { passive: true });

		return () => {
			el.removeEventListener('pointerdown', handlePointerDown);
			el.removeEventListener('pointermove', handlePointerMove);
			el.removeEventListener('pointerup', handlePointerUp);
			el.removeEventListener('pointercancel', handlePointerCancel);
			el.removeEventListener('touchmove', handleTouchMove);
			el.removeEventListener('wheel', handleWheel);
			clearWheelIdle();
			animation?.cancel();
			animation = null;
			clearTransform();
		};
	};
}
