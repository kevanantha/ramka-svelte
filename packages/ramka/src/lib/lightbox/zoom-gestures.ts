import {
	computeMomentumVelocity,
	distance,
	doubleTapTargetZoom,
	invertElasticClamp,
	isTrackpadPinchWheel,
	pinchFingerAlignment,
	pinchMotionComponents,
	resolvePinchZoom,
	scaleZoom
} from './gesture-math';

/**
 * Quiet gap after the last ctrl+wheel / pinch-as-wheel sample treated as lift.
 * Blink/Gecko have no GestureEvent, so this is the snap-back trigger. Long
 * enough to absorb a missed frame; short enough that release still feels
 * immediate. Chrome sends no events while fingers hold still, so a pause
 * mid-overshoot can snap early — the closest equivalent to gestureend.
 */
const WHEEL_PINCH_END_MS = 120;

// ---------------------------------------------------------------------------
// Config type
// ---------------------------------------------------------------------------

interface ZoomGestureConfig {
	minZoom: number;
	maxZoom: number;
	zoomStep: number;
	scrollToZoom: boolean;
	wheelSensitivity: number;
	keyboardPanDistance: number;
	doubleClickDelay: number;
}

// ---------------------------------------------------------------------------
// Actions — called by the gesture layer, implemented by the zoom session
// ---------------------------------------------------------------------------

interface ZoomGestureActions {
	getZoom: () => number;
	getOffsets: () => { x: number; y: number };
	zoomIn: () => void;
	zoomOut: () => void;
	changeZoom: (
		target: number,
		rapid: boolean,
		dx?: number,
		dy?: number,
		overscroll?: boolean
	) => void;
	/**
	 * @param overscroll Elastic rubber-band past pan bounds.
	 * @param overflowAxesOnly When set with overscroll, only overflowing axes
	 *   pan (touch). Mouse omits this so letterboxed axes can still rubber-band.
	 */
	changeOffsets: (dx: number, dy: number, overscroll?: boolean, overflowAxesOnly?: boolean) => void;
	/**
	 * Live two-finger pose from a pinch origin: scale to `targetZoom` (elastic)
	 * and translate so the origin content point stays under the current
	 * centroid. Pan rubber-bands past cover bounds. `overflowAxesOnly` locks
	 * letterboxed axes (touch), matching one-finger pan.
	 */
	applyPinchPan: (
		targetZoom: number,
		origin: { zoom: number; offsetX: number; offsetY: number; cx: number; cy: number },
		centroid: { x: number; y: number },
		overflowAxesOnly?: boolean
	) => void;
	setDragging: (dragging: boolean) => void;
	/**
	 * Return an out-of-bounds zoom to range as a baked compositor settle.
	 * No-ops while the live rAF snap still composes with a dragging finger
	 * (the final release upgrades it), and when everything is at rest.
	 */
	snapToBounds: () => void;
	/** Settle pan offsets into range (baked WAAPI). Returns `true` when started. */
	snapOffsetsToBounds: () => boolean;
	/**
	 * Release settle from flick velocity (offset-space px/s): coast, edge
	 * bounce, zoom bound snap-back and offset glide baked jointly into
	 * compositor keyframes. Absorbs an in-flight rAF zoom snap (velocity
	 * carries over). `touch` selects the softer mobile overscroll spring.
	 */
	momentumPan: (vx: number, vy: number, touch?: boolean) => boolean;
	/**
	 * Start the iOS-style zoom rubber-band return: a rAF spring on the zoom
	 * value, used on pinch 2→1 breakup. The return is a uniform zoom-out
	 * about the stage center and runs concurrently with the surviving
	 * finger's pan — the finger owns the offsets, the spring owns zoom.
	 * Offsets are only nudged to their clamped rest pose when nothing else
	 * is authoring them.
	 * Returns `true` when zoom was out of bounds and a snap-back started.
	 */
	startZoomSnap: () => boolean;
	/** Stop the rAF zoom snap-back (a new pinch takes zoom ownership). */
	stopZoomSnap: () => void;
	/** True while the rAF zoom snap-back is carrying zoom to a bound. */
	isZoomSnapActive: () => boolean;
	/**
	 * Catch a baked settle animation (coast / bounce / snap-back) at its live
	 * pose — a finger landing on a coasting image stops it, like iOS. No-ops
	 * while a discrete zoom plays (those defer gestures instead).
	 */
	catchSettle: () => void;
	/** Cancel in-flight discrete zoom WAAPI so a live pinch/pan can take over. */
	cancelZoomAnimation: () => void;
	/** True while a *discrete* zoom WAAPI (double-tap / keyboard) is playing. */
	isZoomAnimating: () => boolean;
	/**
	 * Run `cb` now if idle; otherwise after the current discrete WAAPI settles.
	 * Used so rapid double-taps chain without cutting the in-flight animation.
	 */
	whenZoomAnimationSettled: (cb: () => void) => void;
	/** True while a baked settle WAAPI is playing. */
	isSettling: () => boolean;
	/**
	 * Sync the commit store to the live pose after an at-rest release
	 * (no settle started). Must not run on the settle-enter frame.
	 */
	commitPose: () => void;
}

// ---------------------------------------------------------------------------
// Gesture binding
// ---------------------------------------------------------------------------

/** What the gesture layer reads from its owner (`Lightbox.Zoom`), all live. */
interface ZoomGestureHost {
	/** The Zoom surface: pointer listeners (pan / pinch / double-tap). */
	container: HTMLElement;
	/** The transform wrapper; only taps on it count toward double-tap. */
	wrapper: HTMLElement;
	config: () => ZoomGestureConfig;
	actions: ZoomGestureActions;
	/** Lightbox.Content: hosts wheel / Safari GestureEvent zoom and `data-zooming`. */
	contentElement: () => HTMLElement | null;
	/** Lightbox.Stage (not ported yet); preferred over Content when set. */
	stageElement: () => HTMLElement | null;
	/**
	 * True while a `Lightbox.Slides` user scroll/fling is in flight. Gesture
	 * starts (pinch / pan / double-tap / scroll-to-zoom) are ignored meanwhile,
	 * so an in-progress swipe can't be hijacked mid-scroll.
	 */
	isScrolling: () => boolean;
}

interface ZoomGestures {
	/**
	 * Re-evaluate whether the wheel listener must be non-passive. On Safari it
	 * only is while zoomed (or with `scrollToZoom`), to keep compositor-thread
	 * momentum scrolling in Slides at 1×. Call when the committed zoom changes.
	 */
	syncWheel: (currentZoom: number) => void;
	/** Remove every listener and timer. */
	destroy: () => void;
}

/**
 * Attaches the zoom gestures to `host.container`. Ported from the original's
 * `useZoomGestures` hook: its refs are closure variables here and its effects
 * are the listener setup below, torn down together by `destroy()`.
 */
function createZoomGestures(host: ZoomGestureHost): ZoomGestures {
	const { container, wrapper, actions } = host;
	const getConfig = host.config;
	const getContentElement = host.contentElement;
	const getStageElement = host.stageElement;
	const isScrolling = host.isScrolling;

	const activePointers: PointerEvent[] = [];
	let lastPointerDown = 0;
	let hadPinch = false;
	/**
	 * After pinch 2→1, absorb the next move as a pan rebase so lift jitter
	 * doesn't jump — then pan continues with the remaining finger.
	 */
	let rebasePanAfterPinch = false;

	// Tap detection for double-tap: track whether the previous single-finger
	// interaction was a stationary tap (not a drag/pinch/pull).
	const TAP_MOVE_THRESHOLD = 10;
	const DOUBLE_TAP_DISTANCE = 50;
	let lastWasTap = false;
	let lastTapPos: { x: number; y: number } | null = null;
	let tapCandidate = false;
	let tapStartPos: { x: number; y: number } | null = null;
	// A double-tap is only committed once the SECOND touch also ends as a
	// stationary tap. These hold the armed state between that touch's
	// pointerdown (where timing/distance qualify) and its pointerup (where we
	// confirm it didn't turn into a swipe/flick) — see handlePointerDown/Up.
	let pendingDoubleTap = false;
	let doubleTapFocal: [number, number] | null = null;
	let pinchState:
		| {
				initialDistance: number;
				initialZoom: number;
				originCx: number;
				originCy: number;
				originOffsetX: number;
				originOffsetY: number;
				aId: number;
				ax: number;
				ay: number;
				bId: number;
				bx: number;
				by: number;
				/** Pinch recognizer has begun — scale may change. Pan runs either way. */
				zoomEngaged: boolean;
		  }
		| undefined = undefined;
	let zoomingTimer: ReturnType<typeof setTimeout> | null = null;

	// Velocity tracking for momentum pan on pointer release.
	// Stores recent pointer positions within a ~100ms window.
	const velocityTracker: Array<{ x: number; y: number; t: number }> = [];
	const VELOCITY_WINDOW = 100;
	/** Screen-space px/s below which we treat the release as no flick. */
	const MOMENTUM_THRESHOLD = 50;

	const translateCoordinates = (event: { clientX: number; clientY: number }): [number, number] => {
		const el = container;
		if (!el) return [0, 0];
		const rect = el.getBoundingClientRect();
		return [event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2];
	};

	/** Snapshot the two-finger origin so later moves can glue content to the centroid. */
	const capturePinchOrigin = (pts: PointerEvent[]) => {
		const d = distance(pts[0].clientX, pts[0].clientY, pts[1].clientX, pts[1].clientY);
		const [c0x, c0y] = translateCoordinates(pts[0]);
		const [c1x, c1y] = translateCoordinates(pts[1]);
		const offsets = actions.getOffsets();
		return {
			initialDistance: Math.max(d, 1),
			initialZoom: actions.getZoom(),
			originCx: (c0x + c1x) / 2,
			originCy: (c0y + c1y) / 2,
			originOffsetX: offsets.x,
			originOffsetY: offsets.y,
			aId: pts[0].pointerId,
			ax: pts[0].clientX,
			ay: pts[0].clientY,
			bId: pts[1].pointerId,
			bx: pts[1].clientX,
			by: pts[1].clientY,
			zoomEngaged: false
		};
	};

	// -------------------------------------------------------------------
	// Pointer events — pinch, drag, double-click/tap
	// -------------------------------------------------------------------

	const clearPointer = (id: number) => {
		const arr = activePointers;
		const idx = arr.findIndex((p) => p.pointerId === id);
		if (idx !== -1) arr.splice(idx, 1);
	};

	const replacePointer = (event: PointerEvent) => {
		clearPointer(event.pointerId);
		activePointers.push(event);
	};

	const setZooming = (active: boolean) => {
		const el = getContentElement();
		if (!el) return;
		if (active) {
			if (zoomingTimer) {
				clearTimeout(zoomingTimer);
				zoomingTimer = null;
			}
			el.setAttribute('data-zooming', '');
		} else {
			// Delay removal to cover discrete zoom WAAPI (default 300ms) so
			// pull-to-dismiss stays blocked until the transform has settled.
			zoomingTimer = setTimeout(() => {
				el.removeAttribute('data-zooming');
				zoomingTimer = null;
			}, 350);
		}
	};

	/** Drop in-flight pinch/pan tracking — scroll (or pull) owns the gesture. */
	const abortZoomInteraction = () => {
		// Elastic overshoot can outlive the pinch flags (held through a 2→1 pan
		// handoff) — if the gesture is stolen while zoom is out of bounds, snap
		// now; the final pointerup that would normally do it may never arrive.
		// (A running rAF zoom snap-back is upgraded to the baked settle by
		// snapToBounds once dragging is cleared below.)
		const { minZoom, maxZoom } = getConfig();
		const currentZoom = actions.getZoom();
		const zoomOutOfBounds = currentZoom < minZoom || currentZoom > maxZoom;
		const needsSnap = pinchState != null || hadPinch || zoomOutOfBounds;
		const hadZoomGesture = needsSnap || activePointers.length > 0;
		activePointers.length = 0;
		pinchState = undefined;
		hadPinch = false;
		rebasePanAfterPinch = false;
		tapCandidate = false;
		tapStartPos = null;
		pendingDoubleTap = false;
		doubleTapFocal = null;
		// Pull/scroll stole the gesture — never let it count as tap 1 of a double-tap.
		lastWasTap = false;
		lastTapPos = null;
		lastPointerDown = 0;
		velocityTracker.length = 0;
		// Clear dragging BEFORE snapping — snapToBounds lets a live rAF snap keep
		// running under a dragging finger, but this gesture is dead: the snap must
		// upgrade to a baked settle now.
		if (hadZoomGesture) {
			actions.setDragging(false);
			setZooming(false);
		}
		if (needsSnap) {
			actions.snapToBounds();
		}
	};

	const handlePointerDown = (event: PointerEvent) => {
		// A Lightbox.Slides swipe/fling is in flight — ignore new zoom/pan
		// gestures so the scroll stays authoritative until it settles.
		if (isScrolling()) {
			abortZoomInteraction();
			return;
		}
		const pointers = activePointers;
		const { doubleClickDelay } = getConfig();
		const { getZoom } = actions;
		const zoom = getZoom();

		if (
			(event.pointerType === 'mouse' && event.button !== 0) ||
			!wrapper?.contains(event.target as Node)
		) {
			return;
		}

		// Don't activate if pull-to-dismiss is in progress or snapping back.
		// Also clear all tracking state — pull-to-dismiss captures the pointer
		// via setPointerCapture, so we never receive pointerup for it and
		// would otherwise accumulate stale entries in activePointers.
		if (getContentElement()?.hasAttribute('data-pulling')) {
			abortZoomInteraction();
			return;
		}

		// A primary touch is the first finger to land on an otherwise empty
		// screen — by definition nothing else is down. So any pointers still in
		// `activePointers` are stale: pull-to-dismiss captures the pointer via
		// setPointerCapture (on an ancestor), so its `pointerup` never reaches
		// this layer and the entry lingers. Drop them now, otherwise this lone
		// finger pairs with the ghost into a phantom two-finger pinch — e.g. tap
		// the image (a hair of movement arms pull), then flick, and it "zooms".
		// A genuine pinch is unaffected: its second finger is never primary.
		if (event.pointerType === 'touch' && event.isPrimary && pointers.length > 0) {
			pointers.length = 0;
			pinchState = undefined;
			hadPinch = false;
			rebasePanAfterPinch = false;
		}

		// Stale pointer cleanup: if all recorded pointers are old (>500ms),
		// they were likely captured by pull-to-dismiss and we never got
		// pointerup for them. During a normal pinch both fingers arrive
		// within milliseconds, so this won't trigger.
		if (pointers.length > 0) {
			const newest = Math.max(...pointers.map((p) => p.timeStamp));
			if (event.timeStamp - newest > 500) {
				pointers.length = 0;
				pinchState = undefined;
				hadPinch = false;
				rebasePanAfterPinch = false;
			}
		}

		// At 1×, a finger that already moved is a slide-scroll (or pull), not the
		// start of a pinch. Ignore additional fingers until everything is up —
		// otherwise a quick second touch mid-swipe arms zoom during scroll.
		if (pointers.length > 0 && zoom <= 1 && !tapCandidate) {
			return;
		}

		if (zoom > 1) {
			event.stopPropagation();
			// A finger landing on a coasting/settling image catches it at the
			// live pose (iOS behavior). Discrete zooms are not caught — gates
			// below defer input while those play.
			actions.catchSettle();
			actions.setDragging(true);
			setZooming(true);
		}

		// Double-click / double-tap: toggle between zoomed and 1x.
		// Both taps must be genuine taps — the previous interaction must have
		// been a stationary single-finger tap (lastWasTap), not a drag/pinch,
		// and the two taps must be close together spatially and in time.
		//
		// Crucially the zoom is NOT fired here on pointerdown: we can't yet tell
		// whether this second touch is a tap or the start of a swipe/flick. A
		// quick swipe beginning near the first tap satisfies the distance+timing
		// gate and would zoom by mistake. Instead we ARM it and commit on
		// pointerup, but only if the touch stayed stationary (tapCandidate).
		// Taps are tracked even during WAAPI so a follow-up double-tap can queue.
		const now = event.timeStamp;
		const prevTap = lastTapPos;
		const tapDist = prevTap ? Math.hypot(event.clientX - prevTap.x, event.clientY - prevTap.y) : 0;
		pendingDoubleTap =
			pointers.length === 0 &&
			lastWasTap &&
			now - lastPointerDown < doubleClickDelay &&
			tapDist < DOUBLE_TAP_DISTANCE;
		doubleTapFocal = pendingDoubleTap ? translateCoordinates(event) : null;

		lastPointerDown = now;

		if (pointers.length === 0) {
			tapCandidate = true;
			tapStartPos = { x: event.clientX, y: event.clientY };
		} else {
			// Multiple fingers — not a tap
			tapCandidate = false;
			tapStartPos = null;
		}

		replacePointer(event);

		if (pointers.length === 2) {
			// Scroll may have locked between the two downs (racy first scroll event).
			if (isScrolling()) {
				abortZoomInteraction();
				return;
			}
			// A pinch invalidates both tap tracking and double-tap timing
			lastPointerDown = 0;
			tapCandidate = false;
			tapStartPos = null;
			pendingDoubleTap = false;
			doubleTapFocal = null;
			// A discrete zoom WAAPI (double-tap / keyboard / reset) owns the
			// transform — never arm a pinch against it mid-flight: tearing the
			// animation reads as a jump. Queue the arm instead — if both fingers
			// are still down when the animation settles, the pinch starts then,
			// anchored at the settled zoom and the fingers' fresh positions.
			// (Baked release settles are not discrete: cancelZoomAnimation below
			// catches them at the live pose and the pinch arms immediately.)
			if (actions.isZoomAnimating()) {
				actions.whenZoomAnimationSettled(() => {
					const pts = activePointers;
					if (pts.length !== 2 || pinchState || isScrolling()) return;
					actions.stopZoomSnap();
					actions.setDragging(true);
					setZooming(true);
					pinchState = capturePinchOrigin(pts);
					hadPinch = true;
					rebasePanAfterPinch = false;
					velocityTracker.length = 0;
				});
				return;
			}
			// Live pinch takes over any in-flight rAF zoom snap-back —
			// initialZoom must anchor to the current (possibly mid-snap) value,
			// not keep animating under the pinch.
			actions.cancelZoomAnimation();
			actions.stopZoomSnap();
			actions.setDragging(true);
			setZooming(true);
			pinchState = capturePinchOrigin(pointers);
			hadPinch = true;
			rebasePanAfterPinch = false;
			velocityTracker.length = 0;
		}
	};

	const handlePointerMove = (event: PointerEvent) => {
		// Scroll / pull won — never continue a pinch/pan that started before.
		if (isScrolling()) {
			abortZoomInteraction();
			return;
		}
		if (getContentElement()?.hasAttribute('data-pulling')) {
			abortZoomInteraction();
			return;
		}

		const pointers = activePointers;
		const { getZoom, changeOffsets, applyPinchPan } = actions;
		const zoom = getZoom();
		const existing = pointers.find((p) => p.pointerId === event.pointerId);

		// Invalidate tap candidate if finger moved beyond threshold
		if (tapCandidate && tapStartPos) {
			const dx = event.clientX - tapStartPos.x;
			const dy = event.clientY - tapStartPos.y;
			if (Math.hypot(dx, dy) > TAP_MOVE_THRESHOLD) {
				tapCandidate = false;
				tapStartPos = null;
				// At 1× a moved finger is slide-scroll, not zoom. Drop tracking so a
				// second finger can't pair into a pinch mid-swipe (before scroll
				// events flip navigationLockedRef). Never do this during/after a
				// pinch — elastic under-min zoom is still a pinch until snap.
				if (zoom <= 1 && pointers.length <= 1 && !hadPinch && !pinchState) {
					pointers.length = 0;
					return;
				}
			}
		}

		// Two-finger pinch + pan. Pan follows the centroid immediately; zoom
		// waits for a real pinch (iOS: separate pan vs pinch recognizers) so a
		// two-finger slide cannot scale from span jitter.
		if (pointers.length === 2 && pinchState) {
			event.stopPropagation();
			replacePointer(event);

			const origin = pinchState;
			const currentDist = distance(
				pointers[0].clientX,
				pointers[0].clientY,
				pointers[1].clientX,
				pointers[1].clientY
			);
			const [c0x, c0y] = translateCoordinates(pointers[0]);
			const [c1x, c1y] = translateCoordinates(pointers[1]);
			const a = pointers.find((p) => p.pointerId === origin.aId) ?? pointers[0];
			const b = pointers.find((p) => p.pointerId === origin.bId) ?? pointers[1];
			const alignment = pinchFingerAlignment(
				origin.ax,
				origin.ay,
				a.clientX,
				a.clientY,
				origin.bx,
				origin.by,
				b.clientX,
				b.clientY
			);
			const { pan: panTravel } = pinchMotionComponents(
				origin.ax,
				origin.ay,
				a.clientX,
				a.clientY,
				origin.bx,
				origin.by,
				b.clientX,
				b.clientY
			);
			const resolved = resolvePinchZoom({
				initialZoom: origin.initialZoom,
				initialDistance: origin.initialDistance,
				currentDistance: currentDist,
				engaged: origin.zoomEngaged,
				alignment,
				panTravel
			});
			if (resolved.engaged && !origin.zoomEngaged) {
				origin.zoomEngaged = true;
				origin.initialDistance = resolved.baselineDistance;
			}
			applyPinchPan(
				resolved.zoom,
				{
					zoom: origin.initialZoom,
					offsetX: origin.originOffsetX,
					offsetY: origin.originOffsetY,
					cx: origin.originCx,
					cy: origin.originCy
				},
				{ x: (c0x + c1x) / 2, y: (c0y + c1y) / 2 },
				event.pointerType === 'touch'
			);

			// Centroid velocity — finger spread without translation stays ~0, so a
			// two-finger flick can coast without a pinch-out seeding a fake pan.
			const now = event.timeStamp;
			const tracker = velocityTracker;
			tracker.push({
				x: (pointers[0].clientX + pointers[1].clientX) / 2,
				y: (pointers[0].clientY + pointers[1].clientY) / 2,
				t: now
			});
			while (tracker.length > 0 && now - tracker[0].t > VELOCITY_WINDOW) {
				tracker.shift();
			}
			return;
		}

		// Single-pointer drag for panning — elastic past bounds (touch + mouse).
		// Touch keeps letterbox axes locked (overflow-only); mouse may rubber-band
		// even when the item still fits.
		if (zoom > 1 && existing) {
			event.stopPropagation();
			if (pointers.length === 1) {
				// A discrete zoom WAAPI (double-tap / bound snap / reset) owns the
				// transform — don't pan against it (changeOffsets would tear it,
				// which reads as a jump). Absorb samples so the pan origin stays
				// fresh and panning resumes seamlessly the moment it settles.
				if (actions.isZoomAnimating()) {
					replacePointer(event);
					return;
				}
				if (rebasePanAfterPinch) {
					// Pinch just broke to one finger — glue the pan origin to this
					// sample so lift jitter isn't applied as a delta, then pan.
					rebasePanAfterPinch = false;
					// Further motion is a pan gesture — allow momentum on release
					// from this finger (centroid samples from the pinch are dropped).
					hadPinch = false;
					velocityTracker.length = 0;
					replacePointer(event);
					return;
				}

				const isTouch = event.pointerType === 'touch';
				changeOffsets(
					(existing.clientX - event.clientX) / zoom,
					(existing.clientY - event.clientY) / zoom,
					true,
					isTouch
				);
				// Track positions for momentum calculation on release
				const now = event.timeStamp;
				const tracker = velocityTracker;
				tracker.push({ x: event.clientX, y: event.clientY, t: now });
				// Trim entries older than the velocity window
				while (tracker.length > 0 && now - tracker[0].t > VELOCITY_WINDOW) {
					tracker.shift();
				}
			}
			replacePointer(event);
		}
	};

	const handlePointerUp = (event: PointerEvent) => {
		const pointers = activePointers;
		// Already finalized (e.g. document capture ran before the element bubble).
		if (!pointers.some((p) => p.pointerId === event.pointerId)) return;

		// Pinch pair breaking: iOS starts the zoom rubber-band the moment the
		// pinch breaks. When one finger remains (2→1), that return must be a
		// rAF spring on the zoom *value* — WAAPI would own the whole transform
		// and fight the surviving finger's pan. On 2→0, skip rAF and let the
		// full-release path below bake a WAAPI settle (compositor-owned).
		const leavingPinch =
			pointers.length >= 2 && pointers.some((p) => p.pointerId === event.pointerId);
		if (leavingPinch) {
			pinchState = undefined;
			// Keep centroid samples: a quick 2→0 lift can coast from them. The
			// remaining finger's first real pan (rebase) drops the tracker so
			// pinch-spread never seeds a one-finger flick.
		}
		clearPointer(event.pointerId);
		if (leavingPinch && activePointers.length === 1) {
			actions.startZoomSnap();
			// Remaining finger can pan immediately after one rebase sample.
			rebasePanAfterPinch = true;
		}

		if (activePointers.length === 0) {
			rebasePanAfterPinch = false;
			// Pull-to-dismiss captures the pointer on Content — this up may arrive
			// via document capture while `data-pulling` is still set. Never treat
			// that as a tap (next quick tap would complete a false double-tap).
			const pullActive =
				getContentElement()?.hasAttribute('data-pulling') ||
				getContentElement()?.hasAttribute('data-pull-dismissing');
			const wasTap = tapCandidate && !pullActive;
			const wasPinch = hadPinch;

			// Commit a deferred double-tap only if this second touch actually
			// ended as a stationary tap (not a swipe/flick, which clears
			// tapCandidate on move) and wasn't part of a pinch. If a discrete
			// WAAPI is still playing, queue until it settles so rapid taps chain
			// without cutting the in-flight animation short.
			if (pendingDoubleTap && wasTap && !wasPinch) {
				pendingDoubleTap = false;
				const focal = doubleTapFocal;
				doubleTapFocal = null;
				lastWasTap = false;
				lastTapPos = null;
				lastPointerDown = 0;
				tapCandidate = false;
				tapStartPos = null;
				actions.setDragging(false);

				const { minZoom, maxZoom, zoomStep } = getConfig();
				const zoom = actions.getZoom();
				const targetZoom = doubleTapTargetZoom(zoom, minZoom, maxZoom, zoomStep);
				const runDoubleTap = () => {
					// Flag the zoom in flight, then schedule its delayed removal (covers
					// the zoom animation). Both halves matter: without the `false` the
					// `data-zooming` flag stays stuck on the content element and blocks
					// the next pull-to-dismiss (which bails while zooming).
					setZooming(true);
					if (focal) {
						actions.changeZoom(targetZoom, false, focal[0], focal[1]);
					} else {
						actions.changeZoom(targetZoom, false);
					}
					setZooming(false);
				};
				actions.whenZoomAnimationSettled(runDoubleTap);
				return;
			}
			pendingDoubleTap = false;
			doubleTapFocal = null;

			// Finalize tap detection: was this a clean single-finger tap?
			lastWasTap = wasTap;
			if (wasTap) {
				lastTapPos = { x: event.clientX, y: event.clientY };
			} else {
				lastTapPos = null;
			}
			tapCandidate = false;
			tapStartPos = null;
			// Final release: bake+settle FIRST, then clear dragging UI. Never
			// notifyCommit / bust layout before WAAPI — that was the flick jump.
			// Tracker is centroid samples (two-finger) or the remaining finger
			// after a 2→1 pan. Spread-without-translate stays under threshold;
			// a stale window (held still after 2→1) is ignored so a pause doesn't flick.
			hadPinch = false;
			const { minZoom, maxZoom } = getConfig();
			const releaseZoom = actions.getZoom();
			const zoomOutOfBounds = releaseZoom < minZoom || releaseZoom > maxZoom;
			const tracker = velocityTracker;
			let coasting = false;
			if (releaseZoom > 1 || zoomOutOfBounds) {
				const touch = event.pointerType === 'touch';
				const last = tracker[tracker.length - 1];
				const fresh = last != null && event.timeStamp - last.t <= VELOCITY_WINDOW;
				const vel = fresh
					? computeMomentumVelocity(tracker, releaseZoom, MOMENTUM_THRESHOLD)
					: null;
				coasting = actions.momentumPan(vel?.vx ?? 0, vel?.vy ?? 0, touch);
			}
			// Safety net for the no-motion cases momentumPan rejected (e.g. an
			// out-of-bounds pose without velocity) — no-op when at rest.
			if (!coasting && (wasPinch || zoomOutOfBounds)) {
				actions.snapToBounds();
				coasting = actions.isSettling();
			}
			// UI-only: data-dragging / cursor. Pose phase already settling or idle.
			actions.setDragging(false);
			if (!coasting && !actions.isSettling()) {
				// At-rest release — sync the commit store now that WAAPI will not start.
				actions.commitPose();
			}
			tracker.length = 0;
			setZooming(false);
		}
	};

	// -------------------------------------------------------------------
	// Wheel / trackpad
	// -------------------------------------------------------------------

	// Safari provides GestureEvent for trackpad pinch — we handle zoom via
	// gesturechange there (elastic + snap on gestureend). The wheel handler
	// skips ctrlKey only while a gesture is active to avoid double-processing.
	// Blink/Gecko have no GestureEvent: pinch arrives as ctrl+wheel *without* a
	// Control keydown (the browser synthesizes ctrlKey). That path accumulates
	// unconstrained scale, rubber-bands, and snaps when the stream goes idle.
	// A real Ctrl+scroll has a physical Control key — hard-clamp, no snap-back.
	const hasSafariGestures = typeof window !== 'undefined' && 'GestureEvent' in window;
	let gestureActive = false;
	/** True while a physical Control key is down (keydown/keyup, not event.ctrlKey). */
	let physicalCtrl = false;
	/**
	 * Blink/Gecko emit trackpad pinch as a ctrl+wheel *stream* with no
	 * gestureend. Accumulate unconstrained scale (Safari's `initialZoom *
	 * event.scale`) so elasticClamp isn't re-applied to an already-compressed
	 * displayed zoom — otherwise overshoot collapses to ~nothing. Idle timeout
	 * is the lift: Chrome sends no events while fingers hold still, so a short
	 * gap is the closest equivalent to gestureend.
	 */
	let wheelPinch: { unconstrainedZoom: number } | null = null;
	let wheelPinchSnapTimer: ReturnType<typeof setTimeout> | null = null;

	const clearWheelPinchTimer = () => {
		if (wheelPinchSnapTimer == null) return;
		clearTimeout(wheelPinchSnapTimer);
		wheelPinchSnapTimer = null;
	};

	const dropWheelPinchSession = () => {
		clearWheelPinchTimer();
		wheelPinch = null;
	};

	const handleWheel = (event: WheelEvent) => {
		// Defer to an in-flight Lightbox.Slides scroll (passive: the event still
		// scrolls the slides; we just don't start a scroll-to-zoom).
		if (isScrolling()) return;
		const { scrollToZoom, wheelSensitivity } = getConfig();
		const { getZoom, changeZoom, changeOffsets } = actions;
		const zoom = getZoom();

		// A discrete zoom WAAPI (double-click / keyboard zoom) owns the
		// transform — wheel zoom or pan against it would cancel it at a stale
		// base and read as a freeze/jump. Swallow all wheel input until it
		// settles. (Baked release settles are NOT gated here: wheel input
		// catches those at the live pose via changeZoom/changeOffsets.) Only
		// preventDefault when the listener is non-passive (see
		// needsNonPassiveWheel) to avoid Safari passive-listener warnings.
		if (actions.isZoomAnimating()) {
			// Don't let a pending pinch-as-wheel snap tear the discrete WAAPI.
			dropWheelPinchSession();
			if (!hasSafariGestures || zoom > 1 || scrollToZoom) {
				event.preventDefault();
			}
			event.stopPropagation();
			return;
		}

		// Skip ctrlKey+wheel during an active Safari trackpad pinch gesture
		// (GestureEvent handles it). Physical Ctrl+wheel still works.
		const shouldZoom = (event.ctrlKey && !gestureActive) || scrollToZoom;

		if (shouldZoom) {
			if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
				event.preventDefault();
				event.stopPropagation();
				const focal = translateCoordinates(event);
				// Synthesized ctrlKey (no Control keydown) = trackpad pinch.
				// Physical Ctrl+scroll hard-clamps like keyboard zoom — no rubber-band.
				if (isTrackpadPinchWheel(event.ctrlKey, physicalCtrl)) {
					let session = wheelPinch;
					if (!session) {
						// Snap-back poses are already elastic-compressed. Seed unconstrained
						// from the inverse so the next sample stays on the same pixels.
						actions.catchSettle();
						const { minZoom, maxZoom } = getConfig();
						session = {
							unconstrainedZoom: invertElasticClamp(actions.getZoom(), minZoom, maxZoom)
						};
						wheelPinch = session;
					}
					session.unconstrainedZoom = scaleZoom(
						session.unconstrainedZoom,
						-event.deltaY,
						wheelSensitivity
					);
					changeZoom(session.unconstrainedZoom, true, ...focal, true);
					clearWheelPinchTimer();
					wheelPinchSnapTimer = setTimeout(() => {
						wheelPinchSnapTimer = null;
						wheelPinch = null;
						if (!actions.isZoomAnimating()) {
							actions.snapToBounds();
						}
					}, WHEEL_PINCH_END_MS);
				} else {
					dropWheelPinchSession();
					changeZoom(scaleZoom(zoom, -event.deltaY, wheelSensitivity), true, ...focal);
				}
				return;
			}
		}

		if (zoom > 1) {
			event.preventDefault();
			event.stopPropagation();
			if (!scrollToZoom) {
				// Screen-space 1:1 pan, like mouse drag: offsets live under the
				// zoom scale, so device deltas divide by zoom. Raw deltas made
				// trackpad pan run zoom× faster than the fingers.
				changeOffsets(event.deltaX / zoom, event.deltaY / zoom);
			}
		}
	};

	// Track a physical Control key. Chrome/Firefox set `wheel.ctrlKey` on
	// trackpad pinch without a keydown — that's the pinch vs Ctrl+scroll split.
	const onCtrlDown = (event: KeyboardEvent) => {
		if (event.key === 'Control') physicalCtrl = true;
	};
	const onCtrlUp = (event: KeyboardEvent) => {
		if (event.key === 'Control') physicalCtrl = false;
	};
	const onCtrlReset = () => {
		physicalCtrl = false;
	};
	window.addEventListener('keydown', onCtrlDown, true);
	window.addEventListener('keyup', onCtrlUp, true);
	window.addEventListener('blur', onCtrlReset);

	// Pointer listeners stay on the Zoom surface (pan / pinch / double-tap need
	// a media hit target). Keyboard zoom/pan is owned by Lightbox.Content, which
	// drives the active slide's zoom through `LightboxState.activeZoom`.
	container.addEventListener('pointerdown', handlePointerDown);
	container.addEventListener('pointermove', handlePointerMove);
	container.addEventListener('pointerup', handlePointerUp);
	container.addEventListener('pointercancel', handlePointerUp);

	// Pull-to-dismiss `setPointerCapture`s on Content, so Zoom never sees
	// pointerup for that finger. Finalize on document capture instead — the
	// element listener no-ops if the pointer was already cleared.
	const onPointerUpCapture = (event: PointerEvent) => {
		if (!activePointers.some((p) => p.pointerId === event.pointerId)) return;
		handlePointerUp(event);
	};
	document.addEventListener('pointerup', onPointerUpCapture, true);
	document.addEventListener('pointercancel', onPointerUpCapture, true);

	// Wheel + Safari GestureEvent attach to Stage, else Content, so zoom keeps
	// working with the cursor in chrome padding outside the Zoom box (but not
	// over side panels outside Stage). Capture, so chrome siblings (thumbnails,
	// buttons) can't swallow the event first.
	const wheelHost = getStageElement() ?? getContentElement() ?? container;
	let wheelPassive: boolean | null = null;

	const syncWheel = (currentZoom: number) => {
		// Safari quirk: a non-passive wheel listener on an *ancestor* of a scroll
		// container (Content → Slides) kills compositor-thread momentum
		// scrolling, so on Safari go non-passive only when zoomed (slides aren't
		// scrollable then) or with scrollToZoom. Chrome/Firefox are fine either way.
		const passive = hasSafariGestures ? !(currentZoom > 1 || getConfig().scrollToZoom) : false;
		if (passive === wheelPassive) return;
		if (wheelPassive !== null) {
			wheelHost.removeEventListener('wheel', handleWheel, { capture: true });
		}
		wheelHost.addEventListener('wheel', handleWheel, { passive, capture: true });
		wheelPassive = passive;
	};
	syncWheel(actions.getZoom());

	// Safari *trackpad* pinch via GestureEvent.
	//
	// Not on devices with touch points (iPhone / iPad): `GestureEvent` exists
	// there too and can fire for a second finger during an overflow scroll —
	// long before `scroll` locks navigation — the classic mobile Safari hijack.
	// Touch pinch goes through the pointer listeners above instead; Content's
	// document-level guard still prevents native page zoom.
	const useGestureEventZoom =
		hasSafariGestures && typeof navigator !== 'undefined' && navigator.maxTouchPoints === 0;

	let initialGestureZoom = 1;
	// Pinch started while a discrete zoom WAAPI (double-click zoom) was in
	// flight — hold it off so it can't tear the animation, then activate on
	// the first gesturechange after settle.
	let deferredForAnimation = false;

	const onGestureStart = (e: Event) => {
		// Always swallow the native page-zoom gesture over the lightbox. Then, if a
		// Slides swipe/fling is in flight, leave `gestureActive` false so the whole
		// gesture is a no-op — the pinch can't hijack the scroll.
		e.preventDefault();
		if (isScrolling()) return;
		gestureActive = true;
		deferredForAnimation = actions.isZoomAnimating();
		if (deferredForAnimation) {
			initialGestureZoom = actions.getZoom();
		} else {
			actions.catchSettle();
			const { minZoom, maxZoom } = getConfig();
			initialGestureZoom = invertElasticClamp(actions.getZoom(), minZoom, maxZoom);
		}
	};

	const onGestureChange = (e: Event) => {
		e.preventDefault();
		// Gesture never started (suppressed mid-scroll) — don't zoom.
		if (!gestureActive || isScrolling()) {
			gestureActive = false;
			return;
		}
		const scale = (e as { scale?: number }).scale;
		if (typeof scale !== 'number') return;
		if (deferredForAnimation) {
			// Animation still owns the transform — ignore this sample.
			if (actions.isZoomAnimating()) return;
			// Settled mid-gesture: rebase so `initialGestureZoom * scale` equals the
			// settled zoom right now, and scaling continues seamlessly from it.
			deferredForAnimation = false;
			const { minZoom, maxZoom } = getConfig();
			initialGestureZoom =
				invertElasticClamp(actions.getZoom(), minZoom, maxZoom) / Math.max(scale, 1e-6);
		}
		const [cx, cy] = translateCoordinates(e as unknown as { clientX: number; clientY: number });
		actions.changeZoom(initialGestureZoom * scale, true, cx, cy, true);
	};

	const onGestureEnd = (e: Event) => {
		e.preventDefault();
		if (!gestureActive) return;
		gestureActive = false;
		// Never activated (animation outlived the pinch) — nothing to snap;
		// snapToBounds here would sample the WAAPI mid-flight and tear it.
		if (deferredForAnimation) {
			deferredForAnimation = false;
			return;
		}
		actions.snapToBounds();
	};

	if (useGestureEventZoom) {
		wheelHost.addEventListener('gesturestart', onGestureStart);
		wheelHost.addEventListener('gesturechange', onGestureChange);
		wheelHost.addEventListener('gestureend', onGestureEnd);
	}

	const contentAtStart = getContentElement();

	const destroy = () => {
		window.removeEventListener('keydown', onCtrlDown, true);
		window.removeEventListener('keyup', onCtrlUp, true);
		window.removeEventListener('blur', onCtrlReset);
		physicalCtrl = false;
		container.removeEventListener('pointerdown', handlePointerDown);
		container.removeEventListener('pointermove', handlePointerMove);
		container.removeEventListener('pointerup', handlePointerUp);
		container.removeEventListener('pointercancel', handlePointerUp);
		document.removeEventListener('pointerup', onPointerUpCapture, true);
		document.removeEventListener('pointercancel', onPointerUpCapture, true);
		wheelHost.removeEventListener('wheel', handleWheel, { capture: true });
		if (useGestureEventZoom) {
			wheelHost.removeEventListener('gesturestart', onGestureStart);
			wheelHost.removeEventListener('gesturechange', onGestureChange);
			wheelHost.removeEventListener('gestureend', onGestureEnd);
		}
		activePointers.length = 0;
		lastPointerDown = 0;
		hadPinch = false;
		pinchState = undefined;
		rebasePanAfterPinch = false;
		if (zoomingTimer) {
			clearTimeout(zoomingTimer);
			zoomingTimer = null;
		}
		clearWheelPinchTimer();
		wheelPinch = null;
		contentAtStart?.removeAttribute('data-zooming');
	};

	return { syncWheel, destroy };
}

export { createZoomGestures, WHEEL_PINCH_END_MS };
export type { ZoomGestureConfig, ZoomGestureActions, ZoomGestureHost, ZoomGestures };
