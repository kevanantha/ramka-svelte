// Port of ramka's `lightbox.test.tsx` (lines 6688–8539): the `global zoom
// controls`, `pull-to-dismiss`, `Lightbox.Stage pan viewport`,
// `Lightbox.Stage zoom scoping`, `scrollTriggerIntoView onChange` and
// `scrollTriggerIntoView onOpenComplete` sections of `describe('Lightbox')`.
//
// React's `<Lightbox.Zoom ref={ref}>` imperative handle maps to the Zoom
// context (`getLightboxZoomContext()`), published into `ref.current` by the
// `ZoomCapture` fixture rendered inside each Zoom.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import './lightbox-suite-env';
import { computePullTransform } from '../../lib/lightbox/pull-math';
import { act, fireEvent, flushMicrotasks, render, screen } from './test-utils';
import ControlledScrollHarness from './fixtures/pull-stage/ControlledScrollHarness.svelte';
import ControlsOutsideItem from './fixtures/pull-stage/ControlsOutsideItem.svelte';
import GlobalZoomLightbox from './fixtures/pull-stage/GlobalZoomLightbox.svelte';
import PullDismissLightbox from './fixtures/pull-stage/PullDismissLightbox.svelte';
import PullMediaHitTest from './fixtures/pull-stage/PullMediaHitTest.svelte';
import PullStageMorph from './fixtures/pull-stage/PullStageMorph.svelte';
import ReopenAfterDismiss from './fixtures/pull-stage/ReopenAfterDismiss.svelte';
import ScrollTriggerHarness from './fixtures/pull-stage/ScrollTriggerHarness.svelte';
import StagePanLightbox from './fixtures/pull-stage/StagePanLightbox.svelte';
import StageWheelLightbox from './fixtures/pull-stage/StageWheelLightbox.svelte';
import StageZoomLightbox from './fixtures/pull-stage/StageZoomLightbox.svelte';
import WiredPullLightbox from './fixtures/pull-stage/WiredPullLightbox.svelte';
import { createZoomRef } from './fixtures/pull-stage/ZoomCapture.svelte';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

describe('Lightbox', () => {
	describe('global zoom controls', () => {
		const origAnimate = Element.prototype.animate;
		beforeEach(() => {
			Element.prototype.animate = vi.fn(() => {
				let onfinish: (() => void) | null = null;
				return {
					finished: Promise.resolve(),
					cancel: vi.fn(),
					play: vi.fn(),
					pause: vi.fn(),
					oncancel: null,
					commitStyles: vi.fn(),
					get onfinish() {
						return onfinish;
					},
					set onfinish(fn: (() => void) | null) {
						onfinish = fn;
						if (fn) fn();
					}
				} as unknown as Animation;
			}) as unknown as typeof Element.prototype.animate;
		});
		afterEach(() => {
			Element.prototype.animate = origAnimate;
		});

		it('global buttons reflect the active slide at 1x', () => {
			render(GlobalZoomLightbox);
			expect(screen.getByTestId('zoom-in')).not.toBeDisabled();
			expect(screen.getByTestId('zoom-out')).toBeDisabled();
		});

		it('global ZoomIn zooms the active slide and enables ZoomOut', () => {
			render(GlobalZoomLightbox);
			const content = screen.getByTestId('content');
			expect(content).not.toHaveAttribute('data-zoomed');

			fireEvent.click(screen.getByTestId('zoom-in'));

			expect(content).toHaveAttribute('data-zoomed');
			expect(screen.getByTestId('zoom-out')).not.toBeDisabled();
		});

		it('controls drive the active slide, not preloaded siblings', () => {
			const refs = [createZoomRef(), createZoomRef()];
			render(GlobalZoomLightbox, { refs });

			// Active slide is index 0.
			fireEvent.click(screen.getByTestId('zoom-in'));
			expect(refs[0]!.current!.zoom).toBeGreaterThan(1);
			expect(refs[1]!.current!.zoom).toBe(1);
		});

		it('controls follow the active slide after navigation', () => {
			const refs = [createZoomRef(), createZoomRef()];
			render(GlobalZoomLightbox, { refs });

			fireEvent.click(screen.getByTestId('next'));
			fireEvent.click(screen.getByTestId('zoom-in'));

			expect(refs[1]!.current!.zoom).toBeGreaterThan(1);
			expect(refs[0]!.current!.zoom).toBe(1);
		});

		it('ZoomIn disables at maxZoom and re-enables on the fresh next slide', () => {
			render(GlobalZoomLightbox, { maxZoom: 2 });
			const zoomIn = screen.getByTestId('zoom-in');

			// zoomStep default 2 → one step from 1x reaches maxZoom 2x.
			fireEvent.click(zoomIn);
			expect(zoomIn).toBeDisabled();

			// The next slide starts fresh at 1x, so ZoomIn is enabled again.
			fireEvent.click(screen.getByTestId('next'));
			expect(zoomIn).not.toBeDisabled();
			expect(screen.getByTestId('content')).not.toHaveAttribute('data-zoomed');
		});

		it('ZoomOut returns the active slide to 1x and disables again', () => {
			render(GlobalZoomLightbox);
			const content = screen.getByTestId('content');
			const zoomOut = screen.getByTestId('zoom-out');

			fireEvent.click(screen.getByTestId('zoom-in'));
			expect(content).toHaveAttribute('data-zoomed');

			// maxZoom 4, step 2 → from 2x one ZoomOut lands back at 1x.
			fireEvent.click(zoomOut);
			expect(content).not.toHaveAttribute('data-zoomed');
			expect(zoomOut).toBeDisabled();
		});

		it('arrow keys pan (do not navigate) while the active slide is zoomed', () => {
			render(GlobalZoomLightbox);
			const content = screen.getByTestId('content');

			// Baseline: arrow navigation works at 1x.
			fireEvent.keyDown(content, { key: 'ArrowRight' });
			expect(screen.getByTestId('item-1')).toHaveAttribute('aria-hidden', 'false');

			// Back to slide 0 and zoom it in.
			fireEvent.keyDown(content, { key: 'ArrowLeft' });
			fireEvent.click(screen.getByTestId('zoom-in'));
			expect(content).toHaveAttribute('data-zoomed');

			// Now ArrowRight must be swallowed by the zoom pan handler.
			fireEvent.keyDown(content, { key: 'ArrowRight' });
			expect(screen.getByTestId('item-0')).toHaveAttribute('aria-hidden', 'false');
			expect(screen.getByTestId('item-1')).toHaveAttribute('aria-hidden', 'true');
		});
	});

	// ---------------------------------------------------------------------------
	// 15. Pull-to-dismiss
	// ---------------------------------------------------------------------------

	describe('pull-to-dismiss', () => {
		// Polyfill PointerEvent for jsdom
		const origPointerEvent = globalThis.PointerEvent;
		beforeEach(() => {
			if (!globalThis.PointerEvent) {
				(globalThis as Record<string, unknown>).PointerEvent = class PointerEvent extends (
					MouseEvent
				) {
					pointerId: number;
					pointerType: string;
					isPrimary: boolean;
					constructor(
						type: string,
						init: PointerEventInit & {
							pointerId?: number;
							pointerType?: string;
							isPrimary?: boolean;
						} = {}
					) {
						super(type, init);
						this.pointerId = init.pointerId ?? 0;
						this.pointerType = init.pointerType ?? 'mouse';
						this.isPrimary = init.isPrimary ?? false;
					}
				};
			}
			if (!Element.prototype.setPointerCapture) {
				Element.prototype.setPointerCapture = vi.fn();
			}
			if (!Element.prototype.releasePointerCapture) {
				Element.prototype.releasePointerCapture = vi.fn();
			}
			if (!Element.prototype.animate) {
				Element.prototype.animate = vi.fn(() => ({
					finished: Promise.resolve(),
					cancel: vi.fn(),
					play: vi.fn(),
					pause: vi.fn(),
					onfinish: null
				})) as unknown as typeof Element.prototype.animate;
			}
		});
		afterEach(() => {
			if (origPointerEvent) {
				(globalThis as Record<string, unknown>).PointerEvent = origPointerEvent;
			}
		});

		function dispatchPointer(
			el: Element,
			type: string,
			init: Partial<PointerEventInit> & {
				pointerId?: number;
				clientX?: number;
				clientY?: number;
				timeStamp?: number;
				isPrimary?: boolean;
			} = {}
		) {
			const event = new PointerEvent(type, {
				bubbles: true,
				cancelable: true,
				pointerId: 1,
				pointerType: 'touch',
				...init
			});
			if (init.timeStamp !== undefined) {
				Object.defineProperty(event, 'timeStamp', { value: init.timeStamp });
			}
			el.dispatchEvent(event);
		}

		it('sets data-pulling attribute during vertical drag', () => {
			render(PullDismissLightbox);
			const content = screen.getByTestId('content');
			const img = screen.getByAltText('test');

			act(() => {
				dispatchPointer(img, 'pointerdown', { clientX: 200, clientY: 200 });
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 225 });
			});

			expect(content).toHaveAttribute('data-pulling');
		});

		it('touch pull starts from Stage-wide targets but not interactive controls', () => {
			render(PullMediaHitTest);
			const content = screen.getByTestId('content');
			const img = screen.getByAltText('test');
			const chrome = screen.getByTestId('chrome');
			const control = screen.getByTestId('control');

			// Decorative overlay / letterbox-like area can start a pull (Stage-wide).
			act(() => {
				dispatchPointer(chrome, 'pointerdown', { clientX: 200, clientY: 200 });
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 225 });
			});
			expect(content).toHaveAttribute('data-pulling');

			// Release so the next down can start a fresh gesture.
			act(() => {
				dispatchPointer(content, 'pointerup', { clientX: 200, clientY: 225 });
			});
			expect(content).not.toHaveAttribute('data-pulling');

			// Real controls keep their press — do not start a pull.
			act(() => {
				dispatchPointer(control, 'pointerdown', { clientX: 200, clientY: 200 });
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 225 });
			});
			expect(content).not.toHaveAttribute('data-pulling');

			act(() => {
				dispatchPointer(img, 'pointerdown', { clientX: 200, clientY: 200 });
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 225 });
			});
			expect(content).toHaveAttribute('data-pulling');
		});

		it('exposes pull progress as a CSS variable during vertical drag', () => {
			render(PullDismissLightbox);
			const content = screen.getByTestId('content');
			const img = screen.getByAltText('test');

			act(() => {
				dispatchPointer(img, 'pointerdown', { clientX: 200, clientY: 200 });
				// First move recognizes the vertical pull and re-anchors the origin
				// here (so the image starts from 0, no snap).
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 210 });
				// 50px past the anchor, of a 100px dismiss threshold → 0.5 progress.
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 260 });
			});

			const progress = Number(content.style.getPropertyValue('--lightbox-pull-progress'));
			expect(progress).toBeGreaterThan(0);
			expect(progress).toBeLessThanOrEqual(1);
		});

		it('resets the pull-progress variable after snapping back', async () => {
			render(PullDismissLightbox);
			const content = screen.getByTestId('content');
			const img = screen.getByAltText('test');

			act(() => {
				dispatchPointer(img, 'pointerdown', { clientX: 200, clientY: 200 });
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 250 });
				dispatchPointer(content, 'pointerup', { clientX: 200, clientY: 250 });
			});
			await flushMicrotasks();

			expect(content).not.toHaveAttribute('data-pulling');
			expect(content.style.getPropertyValue('--lightbox-pull-progress')).toBe('');
		});

		it('does not set data-pulling for horizontal drag', () => {
			render(PullDismissLightbox);
			const content = screen.getByTestId('content');
			const img = screen.getByAltText('test');

			act(() => {
				dispatchPointer(img, 'pointerdown', { clientX: 200, clientY: 200 });
				dispatchPointer(content, 'pointermove', { clientX: 225, clientY: 200 });
			});

			expect(content).not.toHaveAttribute('data-pulling');
		});

		it('closes the lightbox when dragged past dismiss threshold', async () => {
			render(PullDismissLightbox);
			const content = screen.getByTestId('content');
			const img = screen.getByAltText('test');

			act(() => {
				dispatchPointer(img, 'pointerdown', { clientX: 200, clientY: 200 });
				// Recognize the pull + re-anchor origin here, then drag 170px past it
				// (> the 100px dismiss threshold).
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 210 });
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 380 });
				dispatchPointer(content, 'pointerup', { clientX: 200, clientY: 380 });
			});
			await flushMicrotasks();

			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		it('reopening during an in-flight close resets the pull-dismiss state', async () => {
			// Hold the close open-ended: a consumer exit transition that never
			// settles keeps Content mounted after a dismiss — the same window as the
			// Android Blink VT close hold, where the portal survives until
			// `finished`. A reopen landing in this window reuses the mounted tree
			// (the hook never re-mounts), so the dismiss state deliberately left for
			// the close animation must be cleared on the opening edge instead:
			// otherwise the backdrop stays faded at the stale pull progress, chrome
			// stays hidden by `data-pull-dismissing`, and the zoom gesture refuses
			// taps (it treats that attribute as "pull in progress").
			vi.mocked(Element.prototype.getAnimations).mockReturnValue([
				{ finished: new Promise(() => {}) } as unknown as Animation
			]);

			render(ReopenAfterDismiss);
			const content = screen.getByTestId('content');
			const img = screen.getByAltText('test');
			const item = document.querySelector('[data-ramka-item]') as HTMLElement;

			act(() => {
				dispatchPointer(img, 'pointerdown', { clientX: 200, clientY: 200 });
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 210 });
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 380 });
				dispatchPointer(content, 'pointerup', { clientX: 200, clientY: 380 });
			});
			await flushMicrotasks();

			// Close committed, but the held exit animation keeps Content mounted —
			// with the dismiss state still applied for the close animation.
			expect(content).toHaveAttribute('data-pull-dismissing');
			expect(content.style.getPropertyValue('--lightbox-pull-progress')).not.toBe('');
			expect(item.style.transform).not.toBe('');

			// Reopen while the close is still in flight.
			act(() => {
				screen.getByTestId('trigger').click();
			});

			expect(content).not.toHaveAttribute('data-pull-dismissing');
			expect(content).not.toHaveAttribute('data-pulling');
			expect(content.style.getPropertyValue('--lightbox-pull-progress')).toBe('');
			expect(item.style.transform).toBe('');
		});

		it('snaps back when released below dismiss threshold', () => {
			render(PullDismissLightbox);
			const content = screen.getByTestId('content');
			const img = screen.getByAltText('test');

			act(() => {
				dispatchPointer(img, 'pointerdown', { clientX: 200, clientY: 200 });
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 260 });
				dispatchPointer(content, 'pointerup', { clientX: 200, clientY: 260 });
			});

			expect(screen.getByRole('dialog')).toBeInTheDocument();
			expect(content).toHaveAttribute('data-pull-snapping');
			expect(content).not.toHaveAttribute('data-pulling');
		});

		it('closes on fast flick even below distance threshold', async () => {
			render(PullDismissLightbox);
			const content = screen.getByTestId('content');
			const img = screen.getByAltText('test');

			act(() => {
				dispatchPointer(img, 'pointerdown', { clientX: 200, clientY: 200, timeStamp: 0 });
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 230, timeStamp: 10 });
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 280, timeStamp: 40 });
				dispatchPointer(content, 'pointerup', { clientX: 200, clientY: 280, timeStamp: 40 });
			});
			await flushMicrotasks();

			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		it('does not activate when zoomed in', () => {
			const ref = createZoomRef();
			render(PullDismissLightbox, { withZoom: true, zoomRef: ref });
			const content = screen.getByTestId('content');
			const img = screen.getByAltText('test');

			act(() => ref.current!.zoomTo(2));
			expect(content).toHaveAttribute('data-zoomed');

			act(() => {
				dispatchPointer(img, 'pointerdown', { clientX: 200, clientY: 200 });
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 370 });
			});

			expect(content).not.toHaveAttribute('data-pulling');
		});

		it('does not zoom from a lone finger after a stale captured pointer', () => {
			// Regression: pull-to-dismiss captures the pointer via setPointerCapture
			// (on the content ancestor), so the zoom hook records the first touch's
			// pointerdown but never its pointerup — leaving a stale pointer. A
			// subsequent single-finger flick must NOT pair with that ghost into a
			// phantom pinch. `isPrimary` marks the lone new finger so stale pointers
			// are dropped first.
			const ref = createZoomRef();
			render(PullDismissLightbox, { withZoom: true, zoomRef: ref });
			const img = screen.getByAltText('test');

			// First touch: recorded by the zoom hook, then "captured" by pull (no
			// pointerup ever reaches the zoom container).
			act(() => {
				dispatchPointer(img, 'pointerdown', {
					clientX: 200,
					clientY: 200,
					pointerId: 1,
					isPrimary: true
				});
			});

			// A fresh lone finger flicks across the screen.
			act(() => {
				dispatchPointer(img, 'pointerdown', {
					clientX: 210,
					clientY: 210,
					pointerId: 2,
					isPrimary: true
				});
				dispatchPointer(img, 'pointermove', { clientX: 280, clientY: 320, pointerId: 2 });
			});

			expect(ref.current!.zoom).toBe(1);
		});

		it('does not double-tap-zoom when the second touch is a swipe near the first tap', () => {
			// Regression: a clean tap arms double-tap detection; a quick swipe/flick
			// starting near that tap satisfies the timing + distance gate. Zoom must
			// NOT fire, because the second touch moved (it's a swipe, not a tap).
			const ref = createZoomRef();
			render(PullDismissLightbox, { withZoom: true, zoomRef: ref });
			const img = screen.getByAltText('test');

			// First interaction: a clean stationary tap.
			act(() => {
				dispatchPointer(img, 'pointerdown', {
					clientX: 200,
					clientY: 200,
					pointerId: 1,
					isPrimary: true
				});
				dispatchPointer(img, 'pointerup', { clientX: 200, clientY: 200, pointerId: 1 });
			});

			// Second interaction: lands near the first tap (within DOUBLE_TAP_DISTANCE)
			// but immediately swipes away.
			act(() => {
				dispatchPointer(img, 'pointerdown', {
					clientX: 210,
					clientY: 205,
					pointerId: 2,
					isPrimary: true
				});
				dispatchPointer(img, 'pointermove', { clientX: 260, clientY: 305, pointerId: 2 });
				dispatchPointer(img, 'pointerup', { clientX: 260, clientY: 305, pointerId: 2 });
			});

			expect(ref.current!.zoom).toBe(1);
		});

		it('still double-tap-zooms when the second touch is a genuine tap', () => {
			const ref = createZoomRef();
			render(PullDismissLightbox, { withZoom: true, zoomRef: ref });
			const img = screen.getByAltText('test');

			act(() => {
				dispatchPointer(img, 'pointerdown', {
					clientX: 200,
					clientY: 200,
					pointerId: 1,
					isPrimary: true,
					timeStamp: 0
				});
				dispatchPointer(img, 'pointerup', {
					clientX: 200,
					clientY: 200,
					pointerId: 1,
					timeStamp: 10
				});
				dispatchPointer(img, 'pointerdown', {
					clientX: 202,
					clientY: 201,
					pointerId: 2,
					isPrimary: true,
					timeStamp: 120
				});
				dispatchPointer(img, 'pointerup', {
					clientX: 202,
					clientY: 201,
					pointerId: 2,
					timeStamp: 130
				});
			});

			expect(ref.current!.zoom).toBeGreaterThan(1);
		});

		it('queues a follow-up double-tap until the in-flight zoom WAAPI settles', () => {
			type AnimStub = {
				finished: Promise<void>;
				cancel: ReturnType<typeof vi.fn>;
				play: ReturnType<typeof vi.fn>;
				pause: ReturnType<typeof vi.fn>;
				onfinish: ((this: Animation, ev: AnimationPlaybackEvent) => void) | null;
				oncancel: ((this: Animation, ev: AnimationPlaybackEvent) => void) | null;
				commitStyles: ReturnType<typeof vi.fn>;
			};
			let latest: AnimStub | undefined;
			const animateImpl = vi.fn(() => {
				const stub: AnimStub = {
					finished: new Promise<void>(() => {}),
					cancel: vi.fn(),
					play: vi.fn(),
					pause: vi.fn(),
					onfinish: null,
					oncancel: null,
					commitStyles: vi.fn()
				};
				latest = stub;
				return stub as unknown as Animation;
			});
			const hadAnimate = 'animate' in Element.prototype;
			const previousAnimate = Element.prototype.animate;
			Element.prototype.animate = animateImpl as unknown as typeof Element.prototype.animate;

			const ref = createZoomRef();
			render(PullDismissLightbox, { withZoom: true, zoomRef: ref });
			const img = screen.getByAltText('test');

			act(() => {
				dispatchPointer(img, 'pointerdown', {
					clientX: 200,
					clientY: 200,
					pointerId: 1,
					isPrimary: true,
					timeStamp: 0
				});
				dispatchPointer(img, 'pointerup', {
					clientX: 200,
					clientY: 200,
					pointerId: 1,
					timeStamp: 10
				});
				dispatchPointer(img, 'pointerdown', {
					clientX: 202,
					clientY: 201,
					pointerId: 2,
					isPrimary: true,
					timeStamp: 120
				});
				dispatchPointer(img, 'pointerup', {
					clientX: 202,
					clientY: 201,
					pointerId: 2,
					timeStamp: 130
				});
			});

			const zoomAfterDoubleTap = ref.current!.zoom;
			expect(zoomAfterDoubleTap).toBeGreaterThan(1);
			expect(animateImpl).toHaveBeenCalled();
			const animAfterDoubleTap = latest;

			// Rapid third/fourth taps while WAAPI plays: queue zoom-out, don't cut it.
			act(() => {
				dispatchPointer(img, 'pointerdown', {
					clientX: 200,
					clientY: 200,
					pointerId: 3,
					isPrimary: true,
					timeStamp: 180
				});
				dispatchPointer(img, 'pointerup', {
					clientX: 200,
					clientY: 200,
					pointerId: 3,
					timeStamp: 190
				});
				dispatchPointer(img, 'pointerdown', {
					clientX: 201,
					clientY: 200,
					pointerId: 4,
					isPrimary: true,
					timeStamp: 250
				});
				dispatchPointer(img, 'pointerup', {
					clientX: 201,
					clientY: 200,
					pointerId: 4,
					timeStamp: 260
				});
			});

			expect(ref.current!.zoom).toBe(zoomAfterDoubleTap);
			expect(latest).toBe(animAfterDoubleTap);
			expect(animAfterDoubleTap?.cancel).not.toHaveBeenCalled();

			// On settle, queued double-tap runs (zoom back out).
			act(() => {
				animAfterDoubleTap?.onfinish?.call(
					animAfterDoubleTap as unknown as Animation,
					{} as AnimationPlaybackEvent
				);
			});
			expect(ref.current!.zoom).toBe(1);
			expect(animateImpl.mock.calls.length).toBeGreaterThan(1);

			if (hadAnimate) {
				Element.prototype.animate = previousAnimate;
			} else {
				delete (Element.prototype as { animate?: typeof Element.prototype.animate }).animate;
			}
		});

		it('data-zoomed stays off during under-min snap-back (chrome must not hide)', () => {
			// Regression: snap-back WAAPI from elastic under-zoom set `data-zoomed`
			// via the “keep while isAnimating” path, which hid chrome even though
			// the user never zoomed in.
			type AnimStub = {
				finished: Promise<void>;
				cancel: ReturnType<typeof vi.fn>;
				play: ReturnType<typeof vi.fn>;
				pause: ReturnType<typeof vi.fn>;
				onfinish: ((this: Animation, ev: AnimationPlaybackEvent) => void) | null;
				oncancel: ((this: Animation, ev: AnimationPlaybackEvent) => void) | null;
			};
			let latest: AnimStub | undefined;
			const animateImpl = vi.fn(() => {
				const stub: AnimStub = {
					finished: Promise.resolve(),
					cancel: vi.fn(),
					play: vi.fn(),
					pause: vi.fn(),
					onfinish: null,
					oncancel: null
				};
				latest = stub;
				return stub as unknown as Animation;
			});
			const hadAnimate = 'animate' in Element.prototype;
			const previousAnimate = Element.prototype.animate;
			Element.prototype.animate = animateImpl as unknown as typeof Element.prototype.animate;

			const ref = createZoomRef();
			render(PullDismissLightbox, { withZoom: true, zoomRef: ref });
			const content = screen.getByTestId('content');
			const img = screen.getByAltText('test');

			act(() => {
				dispatchPointer(img, 'pointerdown', {
					clientX: 150,
					clientY: 200,
					pointerId: 1,
					pointerType: 'touch',
					isPrimary: true
				});
				dispatchPointer(img, 'pointerdown', {
					clientX: 250,
					clientY: 200,
					pointerId: 2,
					pointerType: 'touch',
					isPrimary: false
				});
				dispatchPointer(img, 'pointermove', {
					clientX: 190,
					clientY: 200,
					pointerId: 1,
					pointerType: 'touch'
				});
				dispatchPointer(img, 'pointermove', {
					clientX: 210,
					clientY: 200,
					pointerId: 2,
					pointerType: 'touch'
				});
			});
			expect(ref.current!.zoom).toBeLessThan(1);
			expect(content).not.toHaveAttribute('data-zoomed');

			// 2→0 full release bakes a WAAPI settle (rAF zoom-snap is only for 2→1
			// while a finger still pans). `data-zoomed` must stay off the whole way:
			// the user never actually zoomed in.
			act(() => {
				dispatchPointer(img, 'pointerup', {
					clientX: 190,
					clientY: 200,
					pointerId: 1,
					pointerType: 'touch'
				});
				dispatchPointer(img, 'pointerup', {
					clientX: 210,
					clientY: 200,
					pointerId: 2,
					pointerType: 'touch'
				});
			});
			expect(content).not.toHaveAttribute('data-zoomed');
			expect(latest).toBeDefined();
			act(() => {
				latest?.onfinish?.call(latest as unknown as Animation, {} as AnimationPlaybackEvent);
			});

			expect(ref.current!.zoom).toBe(1);
			expect(content).not.toHaveAttribute('data-zoomed');

			if (hadAnimate) {
				Element.prototype.animate = previousAnimate;
			} else {
				delete (Element.prototype as { animate?: typeof Element.prototype.animate }).animate;
			}
		});

		it('clears data-zooming after a double-tap reset so the next pull-to-dismiss works', () => {
			// Regression: the deferred double-tap committed on pointerup but only
			// flagged `data-zooming` (setZooming(true)) without scheduling its
			// removal. It stayed stuck on the content element, and pull-to-dismiss
			// bails while zooming — so the first pull after a double-tap was dropped.
			vi.useFakeTimers();
			try {
				const ref = createZoomRef();
				render(PullDismissLightbox, { withZoom: true, zoomRef: ref });
				const content = screen.getByTestId('content');
				const img = screen.getByAltText('test');

				// Rapid so we aren't mid WAAPI when the double-tap starts (gestures are
				// ignored while a discrete zoom animation is in flight).
				act(() => ref.current!.zoomTo(2, { rapid: true }));

				// Double-tap to reset zoom back to 1 (deferred commit on 2nd pointerup).
				act(() => {
					dispatchPointer(img, 'pointerdown', {
						clientX: 200,
						clientY: 200,
						pointerId: 1,
						isPrimary: true,
						timeStamp: 0
					});
					dispatchPointer(img, 'pointerup', {
						clientX: 200,
						clientY: 200,
						pointerId: 1,
						timeStamp: 10
					});
					dispatchPointer(img, 'pointerdown', {
						clientX: 202,
						clientY: 201,
						pointerId: 2,
						isPrimary: true,
						timeStamp: 120
					});
					dispatchPointer(img, 'pointerup', {
						clientX: 202,
						clientY: 201,
						pointerId: 2,
						timeStamp: 130
					});
				});
				expect(ref.current!.zoom).toBe(1);

				// The zooming flag must not be stuck — it clears after its cover window.
				act(() => {
					vi.advanceTimersByTime(350);
				});
				expect(content).not.toHaveAttribute('data-zooming');

				// A pull now starts on the first attempt.
				act(() => {
					dispatchPointer(img, 'pointerdown', {
						clientX: 200,
						clientY: 200,
						pointerId: 3,
						isPrimary: true
					});
					dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 250, pointerId: 3 });
				});
				expect(content).toHaveAttribute('data-pulling');
			} finally {
				vi.useRealTimers();
			}
		});

		it('is disabled when pullToClose is false', () => {
			render(PullDismissLightbox, { pullToClose: false });
			const content = screen.getByTestId('content');
			const img = screen.getByAltText('test');

			act(() => {
				dispatchPointer(img, 'pointerdown', { clientX: 200, clientY: 200 });
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 370 });
				dispatchPointer(content, 'pointerup', { clientX: 200, clientY: 370 });
			});

			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});

		it('applies transform to the active item during drag', () => {
			render(PullDismissLightbox);
			const content = screen.getByTestId('content');
			const img = screen.getByAltText('test');
			const item = img.closest('[data-ramka-item]') as HTMLElement;

			act(() => {
				dispatchPointer(img, 'pointerdown', { clientX: 200, clientY: 200 });
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 250 });
			});

			expect(item.style.transform).toMatch(/translate\(.+,.+\)/);
			expect(item.style.transform).toMatch(/scale\(/);
			expect(content.style.transform).toBe('');
		});

		it('applies transform to the Stage morphRef node instead of the item', () => {
			// Svelte: Stage's `morphRef` render-prop ref is the `morph` attachment.
			render(PullStageMorph);
			const content = screen.getByTestId('content');
			const img = screen.getByAltText('test');
			const item = img.closest('[data-ramka-item]') as HTMLElement;
			const frame = screen.getByTestId('frame');

			act(() => {
				dispatchPointer(img, 'pointerdown', { clientX: 200, clientY: 200 });
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 250 });
			});

			expect(frame.style.transform).toMatch(/translate\(.+,.+\)/);
			expect(frame.style.transform).toMatch(/scale\(/);
			expect(item.style.transform).toBe('');
		});

		it('does not activate for mouse pointer', () => {
			render(PullDismissLightbox);
			const content = screen.getByTestId('content');

			act(() => {
				dispatchPointer(content, 'pointerdown', {
					clientX: 200,
					clientY: 200,
					pointerType: 'mouse'
				});
				dispatchPointer(content, 'pointermove', {
					clientX: 200,
					clientY: 370,
					pointerType: 'mouse'
				});
			});

			expect(content).not.toHaveAttribute('data-pulling');
		});

		it('does not activate when touch starts on controls outside an item', () => {
			render(ControlsOutsideItem);
			const content = screen.getByTestId('content');
			const closeBtn = screen.getByTestId('close-btn');

			act(() => {
				dispatchPointer(closeBtn, 'pointerdown', { clientX: 200, clientY: 200 });
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 370 });
			});

			expect(content).not.toHaveAttribute('data-pulling');
		});

		it('does not activate when data-zooming is set on content', () => {
			render(PullDismissLightbox);
			const content = screen.getByTestId('content');
			const img = screen.getByAltText('test');

			// Simulate zoom gesture in progress
			content.setAttribute('data-zooming', '');

			act(() => {
				dispatchPointer(img, 'pointerdown', { clientX: 200, clientY: 200 });
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 250 });
			});

			expect(content).not.toHaveAttribute('data-pulling');
			const item = img.closest('[data-ramka-item]') as HTMLElement;
			expect(item.style.transform).toBe('');

			content.removeAttribute('data-zooming');
		});

		it('aborts pull gesture if data-zooming appears mid-drag', () => {
			render(PullDismissLightbox);
			const content = screen.getByTestId('content');
			const img = screen.getByAltText('test');

			act(() => {
				dispatchPointer(img, 'pointerdown', { clientX: 200, clientY: 200 });
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 250 });
			});

			expect(content).toHaveAttribute('data-pulling');

			// Simulate zoom gesture starting (e.g. second finger added)
			content.setAttribute('data-zooming', '');

			act(() => {
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 270 });
			});

			// Pull should have aborted — snap-back triggers animate()
			expect(Element.prototype.animate).toHaveBeenCalled();

			content.removeAttribute('data-zooming');
		});

		it('touch gate: pulls from letterbox / Stage padding, not sidebar or no-pull chrome', () => {
			render(WiredPullLightbox);
			const content = screen.getByTestId('content');

			// Letterbox / empty Stage area starts a pull.
			act(() => {
				dispatchPointer(screen.getByTestId('letterbox'), 'pointerdown', {
					clientX: 200,
					clientY: 200
				});
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 250 });
			});
			expect(content).toHaveAttribute('data-pulling');

			act(() => {
				dispatchPointer(content, 'pointerup', { clientX: 200, clientY: 250 });
			});
			expect(content).not.toHaveAttribute('data-pulling');

			// Side panels outside Stage do not start a pull.
			act(() => {
				dispatchPointer(screen.getByTestId('sidebar'), 'pointerdown', {
					clientX: 200,
					clientY: 200
				});
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 250 });
			});
			expect(content).not.toHaveAttribute('data-pulling');

			// Opt-out chrome keeps its press.
			act(() => {
				dispatchPointer(screen.getByTestId('no-pull'), 'pointerdown', {
					clientX: 200,
					clientY: 200
				});
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 250 });
			});
			expect(content).not.toHaveAttribute('data-pulling');

			// Media still starts a pull.
			act(() => {
				dispatchPointer(screen.getByTestId('content-img'), 'pointerdown', {
					clientX: 200,
					clientY: 200
				});
				dispatchPointer(content, 'pointermove', { clientX: 200, clientY: 250 });
			});
			expect(content).toHaveAttribute('data-pulling');
		});

		function dispatchTrackpadWheel(target: Element, deltaY = -40, deltaX = 0) {
			const event = new WheelEvent('wheel', {
				bubbles: true,
				cancelable: true,
				deltaX,
				deltaY
			});
			// jsdom may omit deltaMode from the constructor; pixel-mode is required.
			Object.defineProperty(event, 'deltaMode', { value: 0 });
			target.dispatchEvent(event);
			return event;
		}

		it('wheel pull ignores events whose target is outside Stage', () => {
			render(StageWheelLightbox);
			const content = screen.getByTestId('content');
			const sidebar = screen.getByTestId('sidebar');
			const img = screen.getByAltText('test');

			act(() => {
				// Stay under the dismiss threshold so we can assert data-pulling.
				for (let i = 0; i < 3; i++) dispatchTrackpadWheel(sidebar, -20);
			});
			expect(content).not.toHaveAttribute('data-pulling');

			act(() => {
				for (let i = 0; i < 3; i++) dispatchTrackpadWheel(img, -20);
			});
			expect(content).toHaveAttribute('data-pulling');
		});

		it('wheel pull still works without Stage (Content is the stage)', () => {
			render(PullDismissLightbox, { label: 'No-stage wheel test' });
			const content = screen.getByTestId('content');
			const img = screen.getByAltText('test');

			act(() => {
				for (let i = 0; i < 3; i++) dispatchTrackpadWheel(img, -20);
			});
			expect(content).toHaveAttribute('data-pulling');
		});

		it('computePullTransform leashes X to its own asymptotic ceiling', () => {
			// Near the origin X keeps the Y-coupled damping slope (small drags feel
			// identical to the old proportional damping)…
			const small = computePullTransform(10, -40, 100, 0.85);
			expect(Math.abs(small.x)).toBeGreaterThan(7);
			expect(Math.abs(small.x)).toBeLessThan(9);

			// …but no amount of raw sideways input passes the ceiling
			// (dismissDistance × PULL_DAMP_X_TRAVEL_RATIO = 50px here): a trackpad
			// flick's momentum tail can pour thousands of px into the accumulator.
			const flick = computePullTransform(5000, -40, 100, 0.85);
			expect(flick.x).toBeGreaterThan(45);
			expect(flick.x).toBeLessThanOrEqual(50);

			const flickLeft = computePullTransform(-5000, -40, 100, 0.85);
			expect(flickLeft.x).toBeLessThan(-45);
			expect(flickLeft.x).toBeGreaterThanOrEqual(-50);
		});

		it('horizontal flick mid-pull releases the pull instead of holding it aside', () => {
			vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
			try {
				render(PullDismissLightbox);
				const content = screen.getByTestId('content');
				const img = screen.getByAltText('test');
				const item = img.closest('[data-ramka-item]') as HTMLElement;

				// Commit a vertical pull under the dismiss threshold. The last event
				// is diagonal (not foreign: |dx| < 2·|dy|) — its X component is
				// user-steered drift and gives the pull its sideways give, so the
				// transform picks up a leashed positive X (natural scroll: dx −30 →
				// content follows the fingers rightward).
				act(() => {
					for (let i = 0; i < 3; i++) dispatchTrackpadWheel(img, -20);
					dispatchTrackpadWheel(img, -20, -30);
				});
				expect(content).toHaveAttribute('data-pulling');
				const pulledTransform = item.style.transform;
				const pulledX = Number(/^translate\((-?[\d.]+)px, /.exec(pulledTransform)?.[1]);
				expect(pulledX).toBeGreaterThan(0);
				expect(pulledX).toBeLessThanOrEqual(50);

				// A sideways flick starts streaming strongly horizontal events.
				// They are foreign to the locked-vertical gesture: they must not
				// move the item and must not keep the pull alive.
				act(() => {
					for (let i = 0; i < 2; i++) {
						dispatchTrackpadWheel(img, 0, -300);
						vi.advanceTimersByTime(30);
					}
				});
				expect(item.style.transform).toBe(pulledTransform);
				expect(content).toHaveAttribute('data-pulling');

				// 90ms after the last *vertical* input the pull resolves (snap-back)
				// even though the flick's momentum is still streaming.
				act(() => {
					vi.advanceTimersByTime(40);
				});
				expect(content).not.toHaveAttribute('data-pulling');
				expect(item.style.transform).toBe('');
				expect(Element.prototype.animate).toHaveBeenCalled();

				// The rest of the momentum tail is ignored by the gesture — unable to
				// start a fresh pull — but never cancelled: the passive listener
				// leaves native handling to the browser's gesture latch and Content's
				// scroll containment.
				let tailEvent!: WheelEvent;
				act(() => {
					tailEvent = dispatchTrackpadWheel(img, 0, -180);
				});
				expect(tailEvent.defaultPrevented).toBe(false);
				expect(content).not.toHaveAttribute('data-pulling');

				// After a real idle gap the latch clears and a fresh pull works.
				act(() => {
					vi.advanceTimersByTime(120);
					for (let i = 0; i < 3; i++) dispatchTrackpadWheel(img, -20);
				});
				expect(content).toHaveAttribute('data-pulling');
			} finally {
				vi.useRealTimers();
			}
		});

		it('never cancels wheel events — the browser gesture latch owns page protection', () => {
			// Regression guard for the post-dismiss page-scroll bleed: cancelling
			// wheel events forfeits the browser's gesture latch onto Content's
			// contained scroll chain, so a dismiss flick's momentum tail would be
			// re-targeted at the bare page and scroll it behind the closing
			// lightbox. The wheel path must stay hands-off: gesture state may
			// consume deltas, but native handling is never prevented.
			render(PullDismissLightbox);
			const img = screen.getByAltText('test');

			// Locked-vertical pull events: consumed by the gesture, not cancelled.
			let first!: WheelEvent;
			let second!: WheelEvent;
			act(() => {
				first = dispatchTrackpadWheel(img, -20);
				second = dispatchTrackpadWheel(img, -20);
			});
			expect(first.defaultPrevented).toBe(false);
			expect(second.defaultPrevented).toBe(false);

			// A strong flick that commits the dismiss mid-stream: the tail is
			// ignored by the latch but stays native too.
			let dismissing!: WheelEvent;
			let tail!: WheelEvent;
			act(() => {
				dismissing = dispatchTrackpadWheel(img, -80);
				tail = dispatchTrackpadWheel(img, -60);
			});
			expect(dismissing.defaultPrevented).toBe(false);
			expect(tail.defaultPrevented).toBe(false);
		});

		it('horizontal wheel sequences keep native scroll (no preventDefault)', () => {
			render(PullDismissLightbox);
			const img = screen.getByAltText('test');

			let event!: WheelEvent;
			act(() => {
				event = dispatchTrackpadWheel(img, 0, -40);
			});
			expect(event.defaultPrevented).toBe(false);
		});
	});

	describe('Lightbox.Stage pan viewport', () => {
		it('reads Stage getBoundingClientRect for pan geometry when Stage is mounted', () => {
			const ref = createZoomRef();
			let stageEl: HTMLElement | null = null;
			let stageRectCalls = 0;
			// Patch HTMLElement (not Element) — earlier tests may own-property override
			// HTMLElement.prototype.getBoundingClientRect and shadow Element.prototype.
			const origRect = HTMLElement.prototype.getBoundingClientRect;
			HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
				if (stageEl && this === stageEl) {
					stageRectCalls += 1;
					return {
						left: 0,
						top: 0,
						right: 600,
						bottom: 800,
						width: 600,
						height: 800,
						x: 0,
						y: 0,
						toJSON() {}
					} as DOMRect;
				}
				return {
					left: 0,
					top: 0,
					right: 1000,
					bottom: 800,
					width: 1000,
					height: 800,
					x: 0,
					y: 0,
					toJSON() {}
				} as DOMRect;
			};

			try {
				render(StagePanLightbox, { zoomRef: ref });

				stageEl = screen.getByTestId('stage');
				expect(stageEl).toHaveAttribute('data-ramka-stage');
				// Focal zoom path always measures pan geometry (viewport = Stage).
				act(() => ref.current!.zoomTo(2, { rapid: true, dx: 0, dy: 0 }));
				expect(stageRectCalls).toBeGreaterThan(0);
			} finally {
				HTMLElement.prototype.getBoundingClientRect = origRect;
			}
		});
	});

	// ---------------------------------------------------------------------------
	// Stage-scoped zoom (keyboard + ctrl/trackpad pinch)
	// ---------------------------------------------------------------------------

	describe('Lightbox.Stage zoom scoping', () => {
		function dispatchCtrlWheel(target: Element, deltaY = -40) {
			const event = new WheelEvent('wheel', {
				bubbles: true,
				cancelable: true,
				ctrlKey: true,
				deltaX: 0,
				deltaY
			});
			Object.defineProperty(event, 'deltaMode', { value: 0 });
			target.dispatchEvent(event);
		}

		it('bare + and - on sidebar do not zoom when Stage is mounted', () => {
			const zoomRef = createZoomRef();
			render(StageZoomLightbox, { zoomRef });
			expect(zoomRef.current!.zoom).toBe(1);

			fireEvent.keyDown(screen.getByTestId('sidebar'), { key: '=' });
			expect(zoomRef.current!.zoom).toBe(1);

			fireEvent.keyDown(screen.getByTestId('sidebar'), { key: '+' });
			expect(zoomRef.current!.zoom).toBe(1);

			fireEvent.keyDown(screen.getByTestId('sidebar'), { key: '-' });
			expect(zoomRef.current!.zoom).toBe(1);
		});

		it('⌘/Ctrl zoom shortcuts stay with the browser: not prevented, no image zoom (WCAG 1.4.4)', () => {
			const zoomRef = createZoomRef();
			render(StageZoomLightbox, { zoomRef });
			const stage = screen.getByTestId('stage');

			// fireEvent.keyDown returns false when defaultPrevented — page zoom
			// (⌘/Ctrl + `+` / `-` / `0`) must never be swallowed by the dialog.
			expect(fireEvent.keyDown(stage, { key: '=', metaKey: true })).toBe(true);
			expect(zoomRef.current!.zoom).toBe(1);

			expect(fireEvent.keyDown(stage, { key: '+', ctrlKey: true })).toBe(true);
			expect(zoomRef.current!.zoom).toBe(1);

			fireEvent.keyDown(stage, { key: '=' });
			expect(zoomRef.current!.zoom).toBeGreaterThan(1);

			expect(fireEvent.keyDown(stage, { key: '-', metaKey: true })).toBe(true);
			expect(zoomRef.current!.zoom).toBeGreaterThan(1);

			expect(fireEvent.keyDown(stage, { key: '0', ctrlKey: true })).toBe(true);
			expect(zoomRef.current!.zoom).toBeGreaterThan(1);
		});

		it('bare + on Content zooms when Stage is mounted (default dialog focus)', () => {
			const zoomRef = createZoomRef();
			render(StageZoomLightbox, { zoomRef });

			fireEvent.keyDown(screen.getByTestId('content'), { key: '+' });
			expect(zoomRef.current!.zoom).toBeGreaterThan(1);
		});

		it('bare + inside Stage zooms the active image', () => {
			const zoomRef = createZoomRef();
			render(StageZoomLightbox, { zoomRef });

			fireEvent.keyDown(screen.getByTestId('stage'), { key: '+' });
			expect(zoomRef.current!.zoom).toBeGreaterThan(1);
		});

		it('bare = zooms in like + (unshifted key on common layouts)', () => {
			const zoomRef = createZoomRef();
			render(StageZoomLightbox, { zoomRef });
			expect(zoomRef.current!.zoom).toBe(1);

			fireEvent.keyDown(screen.getByTestId('stage'), { key: '=' });
			expect(zoomRef.current!.zoom).toBeGreaterThan(1);

			fireEvent.keyDown(screen.getByTestId('stage'), { key: '-' });
			expect(zoomRef.current!.zoom).toBe(1);
		});

		it('bare 0 resets image zoom (page-zoom reset stays on ⌘/Ctrl+0)', () => {
			const zoomRef = createZoomRef();
			render(StageZoomLightbox, { zoomRef });
			const stage = screen.getByTestId('stage');

			fireEvent.keyDown(stage, { key: '=' });
			fireEvent.keyDown(stage, { key: '=' });
			expect(zoomRef.current!.zoom).toBeGreaterThan(1);

			fireEvent.keyDown(stage, { key: '0' });
			expect(zoomRef.current!.zoom).toBe(1);
		});

		it('ctrl+wheel over sidebar does not zoom when Stage is mounted', () => {
			const zoomRef = createZoomRef();
			render(StageZoomLightbox, { zoomRef });
			expect(zoomRef.current!.zoom).toBe(1);

			act(() => {
				dispatchCtrlWheel(screen.getByTestId('sidebar'));
			});
			expect(zoomRef.current!.zoom).toBe(1);
		});

		it('ctrl+wheel over Stage zooms the active image', () => {
			const zoomRef = createZoomRef();
			render(StageZoomLightbox, { zoomRef });

			act(() => {
				dispatchCtrlWheel(screen.getByTestId('zoom-img'));
			});
			expect(zoomRef.current!.zoom).toBeGreaterThan(1);
		});

		it('ctrl+wheel still zooms without Stage (Content is the stage)', () => {
			const zoomRef = createZoomRef();
			render(StageZoomLightbox, { zoomRef, stage: false });

			act(() => {
				dispatchCtrlWheel(screen.getByTestId('zoom-img'));
			});
			expect(zoomRef.current!.zoom).toBeGreaterThan(1);
		});
	});

	describe('scrollTriggerIntoView onChange', () => {
		it('does not scroll the origin trigger into view on open, only on an index change while open', () => {
			// 'onChange' must scroll when the active index changes while already open
			// (so the destination trigger is on-screen for the close morph), but NEVER
			// on the open→true edge: nothing changed yet and the clicked trigger is the
			// open morph's origin — scrolling it would move the morph start / jump the
			// page mid-open.
			const scrollIntoView = vi.fn();
			// Patch on HTMLElement.prototype (the most-derived prototype jsdom resolves
			// for our button triggers) so a leaked Element/HTMLElement rect mock from an
			// earlier test can't shadow ours and make the trigger read as fully visible.
			const origScroll = HTMLElement.prototype.scrollIntoView;
			const origRect = HTMLElement.prototype.getBoundingClientRect;
			HTMLElement.prototype.scrollIntoView = scrollIntoView;
			// Force every trigger to read as "not fully visible" so scrollTriggerEl
			// would scroll if it were called.
			HTMLElement.prototype.getBoundingClientRect = function () {
				return {
					top: -50,
					bottom: 50,
					left: 0,
					right: 50,
					width: 50,
					height: 100,
					x: 0,
					y: -50,
					toJSON() {}
				} as DOMRect;
			};
			try {
				render(ScrollTriggerHarness, {
					triggers: 3,
					items: 3,
					scrollTriggerIntoView: { type: 'onChange', behavior: 'instant' },
					label: 'scroll test'
				});

				// Opening must NOT scroll the origin trigger.
				act(() => {
					fireEvent.click(screen.getByTestId('trigger-0'));
				});
				expect(scrollIntoView).not.toHaveBeenCalled();

				// Navigating to another item while open SHOULD scroll its trigger in
				// (idle-debounced so swipe/scrub doesn't thrash the page under the modal).
				vi.useFakeTimers();
				try {
					act(() => {
						fireEvent.click(screen.getByTestId('next'));
					});
					expect(scrollIntoView).not.toHaveBeenCalled();
					act(() => {
						vi.advanceTimersByTime(120);
					});
					expect(scrollIntoView).toHaveBeenCalledWith({
						block: 'nearest',
						inline: 'nearest',
						behavior: 'instant'
					});
				} finally {
					vi.useRealTimers();
				}
			} finally {
				HTMLElement.prototype.scrollIntoView = origScroll;
				HTMLElement.prototype.getBoundingClientRect = origRect;
			}
		});

		it('survives a consumer re-render with a fresh inline config during the debounce', () => {
			// Controlled URL-sync consumers re-render milliseconds after every index
			// change (history write → router pathname update), passing a NEW inline
			// `scrollTriggerIntoView` literal each time. With the config in the
			// effect deps that re-render cancelled the pending 120ms scroll and the
			// same-index early return never rescheduled it — the scroll silently
			// never fired. The config is read through a ref now, so identity churn
			// must not cancel the debounce.
			const scrollIntoView = vi.fn();
			const origScroll = HTMLElement.prototype.scrollIntoView;
			HTMLElement.prototype.scrollIntoView = scrollIntoView;
			try {
				render(ControlledScrollHarness);

				act(() => {
					fireEvent.click(screen.getByTestId('trigger-0'));
				});

				vi.useFakeTimers();
				try {
					// Index change schedules the debounced scroll…
					act(() => {
						fireEvent.click(screen.getByTestId('next'));
					});
					// …and a consumer re-render (same index, fresh config literal) lands
					// mid-debounce, like usePathname updating after replaceState.
					act(() => {
						vi.advanceTimersByTime(10);
					});
					act(() => {
						fireEvent.click(screen.getByTestId('echo'));
					});
					act(() => {
						vi.advanceTimersByTime(120);
					});
					expect(scrollIntoView).toHaveBeenCalledWith({
						block: 'nearest',
						inline: 'nearest',
						behavior: 'instant'
					});
				} finally {
					vi.useRealTimers();
				}
			} finally {
				HTMLElement.prototype.scrollIntoView = origScroll;
			}
		});

		it('forwards block/inline alignment from scrollTriggerIntoView options', () => {
			const scrollIntoView = vi.fn();
			const origScroll = HTMLElement.prototype.scrollIntoView;
			HTMLElement.prototype.scrollIntoView = scrollIntoView;
			try {
				render(ScrollTriggerHarness, {
					triggers: 2,
					items: 2,
					scrollTriggerIntoView: {
						type: 'onChange',
						behavior: 'instant',
						inline: 'center',
						block: 'center'
					},
					label: 'scroll align test'
				});

				act(() => {
					fireEvent.click(screen.getByTestId('trigger-0'));
				});

				vi.useFakeTimers();
				try {
					act(() => {
						fireEvent.click(screen.getByTestId('next'));
					});
					act(() => {
						vi.advanceTimersByTime(120);
					});
					expect(scrollIntoView).toHaveBeenCalledWith({
						block: 'center',
						inline: 'center',
						behavior: 'instant'
					});
				} finally {
					vi.useRealTimers();
				}
			} finally {
				HTMLElement.prototype.scrollIntoView = origScroll;
			}
		});

		it('scrolls the closest trigger when morphTo is closest and the active index has none', () => {
			// Landing-style +N galleries register triggers only for visible tiles.
			// Navigating to a hidden item must still scroll the trigger the close
			// morph will land on — not look up the missing active-index trigger.
			const scrollIntoView = vi.fn();
			const origScroll = HTMLElement.prototype.scrollIntoView;
			HTMLElement.prototype.scrollIntoView = function (
				this: HTMLElement,
				options?: ScrollIntoViewOptions
			) {
				scrollIntoView(this, options);
			};
			try {
				render(ScrollTriggerHarness, {
					triggers: 2,
					items: 3,
					morphTo: 'closest',
					scrollTriggerIntoView: { type: 'onChange', behavior: 'instant' },
					label: 'closest scroll test'
				});

				act(() => {
					fireEvent.click(screen.getByTestId('trigger-0'));
				});

				vi.useFakeTimers();
				try {
					act(() => {
						fireEvent.click(screen.getByTestId('next'));
					});
					act(() => {
						vi.advanceTimersByTime(120);
					});
					expect(scrollIntoView).toHaveBeenCalledTimes(1);
					expect(scrollIntoView.mock.calls[0][0]).toBe(screen.getByTestId('trigger-1'));

					scrollIntoView.mockClear();

					act(() => {
						fireEvent.click(screen.getByTestId('next'));
					});
					act(() => {
						vi.advanceTimersByTime(120);
					});
					// Index 2 has no trigger — closest registered trigger is 1.
					expect(scrollIntoView).toHaveBeenCalledTimes(1);
					expect(scrollIntoView.mock.calls[0][0]).toBe(screen.getByTestId('trigger-1'));
					expect(scrollIntoView.mock.calls[0][1]).toEqual({
						block: 'nearest',
						inline: 'nearest',
						behavior: 'instant'
					});
				} finally {
					vi.useRealTimers();
				}
			} finally {
				HTMLElement.prototype.scrollIntoView = origScroll;
			}
		});
	});

	describe('scrollTriggerIntoView onOpenComplete', () => {
		// Harness: in ramka's single file this case runs after `view transitions`,
		// whose beforeEach has already loaded the morph runtime; it fails there too
		// when run alone. Load it here so the case does not depend on file order.
		beforeEach(async () => {
			const { loadMorphRuntime } = await import('../../lib/lightbox/lightbox-morph-loader');
			await loadMorphRuntime();
		});

		it('scrolls the active trigger into view once the open transition finishes (array config)', async () => {
			// 'onOpenComplete' repositions the trigger while the viewer covers the page
			// and scroll is locked, so the later close morph lands on-screen with no
			// jump. It must NOT fire while the open is still in flight, and the array
			// config form ({ [{ type: 'onOpenComplete' }] }) must normalize correctly.
			let resolveFinished: () => void = () => {};
			const finished = new Promise<void>((r) => {
				resolveFinished = r;
			});
			const startViewTransition = vi.fn((cb: () => void | Promise<void>) => {
				const res = cb();
				if (res && typeof (res as Promise<void>).then === 'function') {
					(res as Promise<void>).catch(vi.fn());
				}
				return { finished };
			});
			Object.defineProperty(document, 'startViewTransition', {
				value: startViewTransition,
				writable: true,
				configurable: true
			});

			const scrollIntoView = vi.fn();
			const origScroll = HTMLElement.prototype.scrollIntoView;
			const origRect = HTMLElement.prototype.getBoundingClientRect;
			HTMLElement.prototype.scrollIntoView = scrollIntoView;
			// Every trigger reads as "not fully visible" so scrollTriggerEl would scroll.
			HTMLElement.prototype.getBoundingClientRect = function () {
				return {
					top: -50,
					bottom: 50,
					left: 0,
					right: 50,
					width: 50,
					height: 100,
					x: 0,
					y: -50,
					toJSON() {}
				} as DOMRect;
			};
			try {
				render(ScrollTriggerHarness, {
					triggers: 3,
					items: 3,
					viewTransition: true,
					scrollTriggerIntoView: [{ type: 'onOpenComplete', behavior: 'instant' }],
					next: false,
					label: 'open complete scroll test'
				});

				fireEvent.click(screen.getByTestId('trigger-1'));
				// Open transition in flight — must not have repositioned yet.
				expect(scrollIntoView).not.toHaveBeenCalled();

				await act(async () => resolveFinished());
				// Open finished — the active trigger is scrolled into view.
				expect(scrollIntoView).toHaveBeenCalled();
			} finally {
				HTMLElement.prototype.scrollIntoView = origScroll;
				HTMLElement.prototype.getBoundingClientRect = origRect;
				delete (document as unknown as Record<string, unknown>).startViewTransition;
				document.documentElement.removeAttribute('data-ramka-view-transition');
			}
		});
	});
});
