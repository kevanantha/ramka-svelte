// Port of ramka's `lightbox.test.tsx` (lines 3923–6687): the `native gesture
// prevention` and `zoom` sections of `describe('Lightbox')`.
//
// React's `<Lightbox.Zoom ref={ref}>` imperative handle maps to the Zoom
// context (`getLightboxZoomContext()`), published into `ref.current` in the
// handle's shape by the `ZoomRefCapture` fixture rendered inside the Zoom;
// `useZoomContext()` in `ZoomPanProbe` maps to the same context.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import './lightbox-suite-env';
import {
	elasticClamp,
	rubberBandClamp,
	rubberBandPanDimension,
	scaleZoom,
	RUBBER_BAND_DIMENSION_FACTOR_MOUSE
} from '../../lib/lightbox/gesture-math';
import { WHEEL_PINCH_END_MS } from '../../lib/lightbox/zoom-gestures';
import { act, cleanup, fireEvent, render, screen } from './test-utils';
import BareZoomParts from './fixtures/zoom/BareZoomParts.svelte';
import GestureLightbox from './fixtures/zoom/GestureLightbox.svelte';
import ZoomLightbox from './fixtures/zoom/ZoomLightbox.svelte';
import type { OverscrollPan } from './fixtures/zoom/ZoomPanProbe.svelte';
import ZoomRefLightbox from './fixtures/zoom/ZoomRefLightbox.svelte';
import { createZoomRef, type ZoomRef } from './fixtures/zoom/ZoomRefCapture.svelte';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

describe('Lightbox', () => {
	describe('native gesture prevention', () => {
		it('prevents multi-touch pinch on content', () => {
			render(GestureLightbox, { label: 'Pinch test' });

			const content = screen.getByTestId('content');
			const event = new TouchEvent('touchmove', {
				bubbles: true,
				cancelable: true,
				touches: [
					new Touch({ identifier: 0, target: content, clientX: 0, clientY: 0 }),
					new Touch({ identifier: 1, target: content, clientX: 100, clientY: 100 })
				]
			});
			const prevented = !content.dispatchEvent(event);
			expect(prevented).toBe(true);
		});

		it('allows single-touch on content', () => {
			render(GestureLightbox, { label: 'Single touch test' });

			const content = screen.getByTestId('content');
			const event = new TouchEvent('touchmove', {
				bubbles: true,
				cancelable: true,
				touches: [new Touch({ identifier: 0, target: content, clientX: 0, clientY: 0 })]
			});
			const prevented = !content.dispatchEvent(event);
			expect(prevented).toBe(false);
		});

		it('prevents leftover-finger gallery scroll after a pinch', () => {
			render(GestureLightbox, { label: 'Leftover finger' });

			const content = screen.getByTestId('content');
			content.dispatchEvent(
				new TouchEvent('touchstart', {
					bubbles: true,
					cancelable: true,
					touches: [
						new Touch({ identifier: 0, target: content, clientX: 0, clientY: 0 }),
						new Touch({ identifier: 1, target: content, clientX: 100, clientY: 100 })
					]
				})
			);
			const leftover = new TouchEvent('touchmove', {
				bubbles: true,
				cancelable: true,
				touches: [new Touch({ identifier: 0, target: content, clientX: 40, clientY: 0 })]
			});
			expect(!content.dispatchEvent(leftover)).toBe(true);
		});

		describe('touch scroll containment (iOS address bar)', () => {
			function renderChromeLightbox() {
				return render(GestureLightbox, { label: 'Containment test', chrome: true });
			}

			function fireTouch(el: Element, type: string, x: number, y: number, fingers = 1) {
				const touches = Array.from(
					{ length: fingers },
					(_, i) => new Touch({ identifier: i, target: el, clientX: x, clientY: y })
				);
				const event = new TouchEvent(type, { bubbles: true, cancelable: true, touches });
				return !el.dispatchEvent(event); // true when preventDefault-ed
			}

			/** Give the panel real scroll metrics (jsdom reports 0 everywhere). */
			function makePanelScrollable(panel: HTMLElement, scrollTop: number) {
				Object.defineProperty(panel, 'scrollHeight', { value: 200, configurable: true });
				Object.defineProperty(panel, 'clientHeight', { value: 100, configurable: true });
				Object.defineProperty(panel, 'scrollTop', { value: scrollTop, configurable: true });
			}

			it('cancels a vertical drag starting on non-scrollable chrome (close button)', () => {
				renderChromeLightbox();
				const close = screen.getByTestId('close');
				fireTouch(close, 'touchstart', 10, 100);
				expect(fireTouch(close, 'touchmove', 10, 130)).toBe(true);
			});

			it('leaves a drag alone until it passes the direction lock', () => {
				renderChromeLightbox();
				const close = screen.getByTestId('close');
				fireTouch(close, 'touchstart', 10, 100);
				// 3px wiggle — under the 6px lock, must not swallow a tap's moves.
				expect(fireTouch(close, 'touchmove', 10, 103)).toBe(false);
			});

			it('allows a horizontal drag on chrome (slides/strip own that axis)', () => {
				renderChromeLightbox();
				const close = screen.getByTestId('close');
				fireTouch(close, 'touchstart', 10, 100);
				expect(fireTouch(close, 'touchmove', 40, 102)).toBe(false);
			});

			it('allows a vertical drag inside scrollable chrome that can consume it', () => {
				renderChromeLightbox();
				const panel = screen.getByTestId('panel');
				makePanelScrollable(panel, 50); // mid-scroll — both directions available
				const text = screen.getByTestId('panel-text');
				fireTouch(text, 'touchstart', 10, 100);
				expect(fireTouch(text, 'touchmove', 10, 130)).toBe(false);
			});

			it('cancels a vertical drag at the scrollable chrome boundary (no chain to the bar)', () => {
				renderChromeLightbox();
				const panel = screen.getByTestId('panel');
				makePanelScrollable(panel, 0); // at top — finger-down pan has nothing to consume
				const text = screen.getByTestId('panel-text');
				fireTouch(text, 'touchstart', 10, 100);
				expect(fireTouch(text, 'touchmove', 10, 130)).toBe(true);
			});

			it('ignores multi-finger gestures (pinch guard owns them)', () => {
				renderChromeLightbox();
				const close = screen.getByTestId('close');
				fireTouch(close, 'touchstart', 10, 100, 2);
				// Single-finger containment must not have latched onto a pinch.
				expect(fireTouch(close, 'touchmove', 10, 130, 2)).toBe(true); // prevented by the PINCH guard
			});
		});

		it('prevents ctrl+wheel (trackpad pinch-to-zoom) on content', () => {
			// On non-Safari browsers (including jsdom), Ctrl+wheel is prevented via
			// a non-passive wheel listener. On Safari, native zoom is prevented via
			// GestureEvent instead (to preserve momentum scrolling).
			render(GestureLightbox, { label: 'Wheel zoom test' });

			const content = screen.getByTestId('content');
			const event = new WheelEvent('wheel', {
				bubbles: true,
				cancelable: true,
				ctrlKey: true,
				deltaY: -10
			});
			const prevented = !content.dispatchEvent(event);
			expect(prevented).toBe(true);
		});

		it('wheel events over content are never cancelled, trackpad or mouse', () => {
			render(GestureLightbox, { label: 'Regular wheel test' });

			const content = screen.getByTestId('content');

			// A classic mouse wheel (line-mode deltas) never participates in the
			// pull gesture — its default action stays native.
			const mouseWheel = new WheelEvent('wheel', {
				bubbles: true,
				cancelable: true,
				ctrlKey: false,
				deltaY: -10
			});
			Object.defineProperty(mouseWheel, 'deltaMode', { value: 1 });
			expect(content.dispatchEvent(mouseWheel)).toBe(true);

			// A pixel-mode vertical wheel starts a trackpad pull, but the gesture
			// only *reads* it — cancelling would forfeit the browser's gesture
			// latch onto Content's contained scroll chain, which is what keeps a
			// dismiss flick's momentum tail from scrolling the page (the listener
			// is passive precisely to enforce this).
			const trackpadWheel = new WheelEvent('wheel', {
				bubbles: true,
				cancelable: true,
				ctrlKey: false,
				deltaY: -10
			});
			Object.defineProperty(trackpadWheel, 'deltaMode', { value: 0 });
			expect(content.dispatchEvent(trackpadWheel)).toBe(true);
		});

		it('regular wheel scroll stays native when pull-to-dismiss is disabled', () => {
			render(GestureLightbox, { label: 'No-pull wheel test', pullToClose: false });

			const content = screen.getByTestId('content');
			const event = new WheelEvent('wheel', {
				bubbles: true,
				cancelable: true,
				ctrlKey: false,
				deltaY: -10
			});
			Object.defineProperty(event, 'deltaMode', { value: 0 });
			const prevented = !content.dispatchEvent(event);
			expect(prevented).toBe(false);
		});
	});

	// ---------------------------------------------------------------------------
	// 14. Zoom
	// ---------------------------------------------------------------------------

	describe('zoom', () => {
		function getZoomRef() {
			const ref = createZoomRef();
			function renderZoomWithRef() {
				return render(ZoomRefLightbox, { zoomRef: ref, label: 'Zoom ref test' });
			}
			return { ref, renderZoomWithRef };
		}

		it('renders zoom container with children', () => {
			render(ZoomLightbox);
			expect(screen.getByTestId('zoom-img')).toBeInTheDocument();
		});

		it('prefers Lightbox.Media box for pan content size over a smaller img', () => {
			const ref = createZoomRef();
			const origRect = HTMLElement.prototype.getBoundingClientRect;
			HTMLElement.prototype.getBoundingClientRect = function () {
				return {
					width: 800,
					height: 800,
					top: 0,
					left: 0,
					right: 800,
					bottom: 800,
					x: 0,
					y: 0,
					toJSON() {}
				} as DOMRect;
			};

			try {
				render(ZoomRefLightbox, { zoomRef: ref, label: 'Zoom media size', media: true });

				const media = screen.getByTestId('media');
				const img = screen.getByAltText('test');
				Object.defineProperty(media, 'offsetWidth', { configurable: true, value: 400 });
				Object.defineProperty(media, 'offsetHeight', { configurable: true, value: 400 });
				Object.defineProperty(img, 'offsetWidth', { configurable: true, value: 100 });
				Object.defineProperty(img, 'offsetHeight', { configurable: true, value: 100 });

				// maxPanOffset = max((content*zoom - container) / 2 / zoom, 0)
				// Media 400 @ 4× → 100; bare img 100 @ 4× → 0. Preferring Media ⇒ non-zero.
				act(() => ref.current!.zoomTo(4, { dx: 10_000, dy: 0 }));
				expect(Math.abs(ref.current!.offsetX)).toBe(100);
			} finally {
				HTMLElement.prototype.getBoundingClientRect = origRect;
			}
		});

		it('ZoomIn and ZoomOut buttons render', () => {
			render(ZoomLightbox);
			expect(screen.getByTestId('zoom-in')).toBeInTheDocument();
			expect(screen.getByTestId('zoom-out')).toBeInTheDocument();
		});

		it('ZoomOut is disabled at minZoom', () => {
			render(ZoomLightbox);
			expect(screen.getByTestId('zoom-out')).toBeDisabled();
		});

		it('ZoomIn is not disabled at minZoom', () => {
			render(ZoomLightbox);
			expect(screen.getByTestId('zoom-in')).not.toBeDisabled();
		});

		it('imperative ref.zoomIn increases zoom', () => {
			const { ref, renderZoomWithRef } = getZoomRef();
			renderZoomWithRef();
			expect(ref.current!.zoom).toBe(1);
			act(() => ref.current!.zoomIn());
			expect(ref.current!.zoom).toBeGreaterThan(1);
		});

		it('imperative ref.zoomOut decreases zoom', () => {
			const { ref, renderZoomWithRef } = getZoomRef();
			renderZoomWithRef();
			act(() => ref.current!.zoomIn());
			const zoomedIn = ref.current!.zoom;
			act(() => ref.current!.zoomOut());
			expect(ref.current!.zoom).toBeLessThan(zoomedIn);
		});

		it('imperative ref.zoomTo sets exact zoom', () => {
			const { ref, renderZoomWithRef } = getZoomRef();
			renderZoomWithRef();
			act(() => ref.current!.zoomTo(2.5));
			expect(ref.current!.zoom).toBe(2.5);
		});

		it('zoom is clamped to maxZoom', () => {
			const { ref, renderZoomWithRef } = getZoomRef();
			renderZoomWithRef();
			act(() => ref.current!.zoomTo(100));
			expect(ref.current!.zoom).toBe(4);
		});

		it('zoom is clamped to minZoom', () => {
			const { ref, renderZoomWithRef } = getZoomRef();
			renderZoomWithRef();
			act(() => ref.current!.zoomTo(0.1));
			expect(ref.current!.zoom).toBe(1);
		});

		it('imperative ref.reset resets to minZoom', () => {
			const { ref, renderZoomWithRef } = getZoomRef();
			renderZoomWithRef();
			act(() => ref.current!.zoomTo(3));
			expect(ref.current!.zoom).toBe(3);
			act(() => ref.current!.reset());
			expect(ref.current!.zoom).toBe(1);
		});

		it('onZoomChange fires when zoom changes', () => {
			const spy = vi.fn();
			const ref = createZoomRef();
			render(ZoomRefLightbox, { zoomRef: ref, label: 'Zoom callback test', onZoomChange: spy });
			act(() => ref.current!.zoomIn());
			expect(spy).toHaveBeenCalledWith(expect.any(Number));
		});

		it('zoom resets when active slide changes', () => {
			const ref = createZoomRef();
			render(ZoomRefLightbox, {
				zoomRef: ref,
				label: 'Zoom reset test',
				testid: 'content',
				slides: 2,
				next: true
			});
			act(() => ref.current!.zoomTo(3));
			expect(ref.current!.zoom).toBe(3);
			fireEvent.click(screen.getByTestId('next'));
			expect(ref.current!.zoom).toBe(1);
		});

		it('ZoomIn button outside Zoom context renders disabled', () => {
			render(BareZoomParts, { variant: 'orphan-in' });
			expect(screen.getByTestId('orphan-zoom-in')).toBeDisabled();
		});

		it('ZoomOut button outside Zoom context renders disabled', () => {
			render(BareZoomParts, { variant: 'orphan-out' });
			expect(screen.getByTestId('orphan-zoom-out')).toBeDisabled();
		});

		it('data-zoom attribute is set when zoomed in', () => {
			const { ref, renderZoomWithRef } = getZoomRef();
			renderZoomWithRef();
			const container = screen.getByTestId('zoom-img').closest('[data-zoom]');
			expect(container).toBeNull();
			act(() => ref.current!.zoomTo(2));
			const zoomedContainer = screen.getByTestId('zoom-img').parentElement!.parentElement!;
			expect(zoomedContainer).toHaveAttribute('data-zoom');
		});

		it('data-zoomed attribute is set on Content when zoomed in', () => {
			render(ZoomLightbox);
			const content = screen.getByTestId('content');
			expect(content).not.toHaveAttribute('data-zoomed');

			const ref = createZoomRef();
			cleanup();
			render(ZoomRefLightbox, { zoomRef: ref, label: 'Zoom zoomed test', testid: 'content' });
			const contentEl = screen.getByTestId('content');
			expect(contentEl).not.toHaveAttribute('data-zoomed');

			act(() => ref.current!.zoomTo(2));
			expect(contentEl).toHaveAttribute('data-zoomed');
		});

		it('fades --lightbox-zoom-progress with live discrete zoom-in (not committed target)', () => {
			// Regression: discrete zoom-in commits the target before paint. Using that
			// committed zoom for --lightbox-zoom-progress snapped snug dim/blur to
			// fully-on. Progress must track the live WAAPI scale so the fade runs.
			type AnimStub = {
				finished: Promise<void>;
				cancel: ReturnType<typeof vi.fn>;
				play: ReturnType<typeof vi.fn>;
				pause: ReturnType<typeof vi.fn>;
				onfinish: ((this: Animation, ev: AnimationPlaybackEvent) => void) | null;
				oncancel: ((this: Animation, ev: AnimationPlaybackEvent) => void) | null;
				commitStyles: ReturnType<typeof vi.fn>;
				currentTime: number;
				duration: number;
			};
			let latest: AnimStub | undefined;
			const animateImpl = vi.fn((_kf: unknown, opts?: number | KeyframeAnimationOptions) => {
				const stub: AnimStub = {
					finished: new Promise<void>(() => {}),
					cancel: vi.fn(),
					play: vi.fn(),
					pause: vi.fn(),
					onfinish: null,
					oncancel: null,
					commitStyles: vi.fn(),
					currentTime: 0,
					duration: typeof opts === 'object' ? Number(opts?.duration ?? 0) : Number(opts ?? 0)
				};
				latest = stub;
				return stub as unknown as Animation;
			});
			const hadAnimate = 'animate' in Element.prototype;
			const previousAnimate = Element.prototype.animate;
			Element.prototype.animate = animateImpl as unknown as typeof Element.prototype.animate;

			const queue: FrameRequestCallback[] = [];
			const origRaf = globalThis.requestAnimationFrame;
			const origCancel = globalThis.cancelAnimationFrame;
			globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
				queue.push(cb);
				return queue.length;
			}) as typeof requestAnimationFrame;
			globalThis.cancelAnimationFrame = ((id: number) => {
				queue[id - 1] = () => {};
			}) as typeof cancelAnimationFrame;

			const pump = () => {
				act(() => {
					// Drain only the currently queued frames; leave the next tick that
					// `bindZoomChrome` reschedules for the following pump.
					const pending = queue.splice(0, queue.length);
					for (const cb of pending) cb(performance.now());
				});
			};

			const ref = createZoomRef();
			render(ZoomRefLightbox, {
				zoomRef: ref,
				label: 'Zoom-in live progress test',
				testid: 'content',
				controls: true
			});
			const contentEl = screen.getByTestId('content');

			try {
				act(() => ref.current!.zoomTo(2));
				expect(latest).toBeDefined();
				expect(ref.current!.zoom).toBe(2);
				// data-zoomed arms from the committed target; progress stays at the
				// live 1× start so snug items can fade in with the WAAPI.
				expect(contentEl).toHaveAttribute('data-zoomed');
				pump();
				expect(Number(contentEl.style.getPropertyValue('--lightbox-zoom-progress') || 0)).toBe(0);

				latest!.currentTime = latest!.duration / 2;
				pump();
				const mid = Number(contentEl.style.getPropertyValue('--lightbox-zoom-progress'));
				expect(mid).toBeGreaterThan(0);
				expect(mid).toBeLessThan(1);

				// Content style wipe must not stick — next tick restores live progress.
				contentEl.style.removeProperty('--lightbox-zoom-progress');
				pump();
				expect(Number(contentEl.style.getPropertyValue('--lightbox-zoom-progress'))).toBeCloseTo(
					mid,
					5
				);
			} finally {
				globalThis.requestAnimationFrame = origRaf;
				globalThis.cancelAnimationFrame = origCancel;
				if (hadAnimate) {
					Element.prototype.animate = previousAnimate;
				} else {
					delete (Element.prototype as { animate?: typeof Element.prototype.animate }).animate;
				}
			}
		});

		it('publishes --lightbox-zoom-progress on Content while zoomed', () => {
			const ref = createZoomRef();
			render(ZoomRefLightbox, { zoomRef: ref, label: 'Zoom progress var test', testid: 'content' });
			const contentEl = screen.getByTestId('content');
			expect(contentEl.style.getPropertyValue('--lightbox-zoom-progress')).toBe('');

			// Progress hits 1 at +1× above min (2× here).
			act(() => ref.current!.zoomTo(2, { rapid: true }));
			expect(Number(contentEl.style.getPropertyValue('--lightbox-zoom-progress'))).toBeCloseTo(1);

			act(() => ref.current!.zoomTo(1.5, { rapid: true }));
			expect(Number(contentEl.style.getPropertyValue('--lightbox-zoom-progress'))).toBeCloseTo(0.5);

			act(() => ref.current!.reset(true));
			expect(contentEl.style.getPropertyValue('--lightbox-zoom-progress')).toBe('');
		});

		it('data-zoomed attribute is removed when zoom resets to 1x (rapid)', () => {
			const ref = createZoomRef();
			render(ZoomRefLightbox, { zoomRef: ref, label: 'Zoom reset attr test', testid: 'content' });
			const contentEl = screen.getByTestId('content');

			act(() => ref.current!.zoomTo(3, { rapid: true }));
			expect(contentEl).toHaveAttribute('data-zoomed');

			act(() => ref.current!.reset(true));
			expect(contentEl).not.toHaveAttribute('data-zoomed');
		});

		it('data-zoomed stays until the zoom-out animation finishes', () => {
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
			render(ZoomRefLightbox, {
				zoomRef: ref,
				label: 'Zoom animated reset attr test',
				testid: 'content'
			});
			const contentEl = screen.getByTestId('content');

			act(() => ref.current!.zoomTo(3, { rapid: true }));
			expect(contentEl).toHaveAttribute('data-zoomed');

			act(() => ref.current!.reset());
			// React zoom is already 1x, but the WAAPI transition is still running —
			// chrome that keys off data-zoomed must not flash back early.
			expect(contentEl).toHaveAttribute('data-zoomed');
			expect(latest).toBeDefined();

			act(() => {
				latest?.onfinish?.call(latest as unknown as Animation, {} as AnimationPlaybackEvent);
			});
			expect(contentEl).not.toHaveAttribute('data-zoomed');

			if (hadAnimate) {
				Element.prototype.animate = previousAnimate;
			} else {
				delete (Element.prototype as { animate?: typeof Element.prototype.animate }).animate;
			}
		});

		it('data-zoomed attribute is removed when slide changes', () => {
			const ref = createZoomRef();
			render(ZoomRefLightbox, {
				zoomRef: ref,
				label: 'Zoom slide change test',
				testid: 'content',
				slides: 2,
				next: true
			});
			const contentEl = screen.getByTestId('content');

			act(() => ref.current!.zoomTo(2));
			expect(contentEl).toHaveAttribute('data-zoomed');

			fireEvent.click(screen.getByTestId('next'));
			expect(contentEl).not.toHaveAttribute('data-zoomed');
		});

		it('maxZoom defaults when not specified', () => {
			render(BareZoomParts, { variant: 'default-max' });
			expect(screen.getByText('No image')).toBeInTheDocument();
		});

		it('touch-action is pan-x pan-y at 1x zoom and none when zoomed', () => {
			// jsdom's CSSOM has no `touch-action`: React's `style.touchAction = …`
			// survives as an expando, but Svelte assigns `style.cssText`, and the
			// CSSOM drops the unknown declaration. Read what Svelte wrote instead.
			const cssTextDescriptor = Object.getOwnPropertyDescriptor(
				CSSStyleDeclaration.prototype,
				'cssText'
			)!;
			const writtenCssText = new WeakMap<CSSStyleDeclaration, string>();
			Object.defineProperty(CSSStyleDeclaration.prototype, 'cssText', {
				...cssTextDescriptor,
				set(this: CSSStyleDeclaration, value: string) {
					writtenCssText.set(this, value);
					cssTextDescriptor.set!.call(this, value);
				}
			});
			const touchAction = (el: HTMLElement) =>
				/(?:^|;)\s*touch-action:\s*([^;]+)/.exec(writtenCssText.get(el.style) ?? '')?.[1].trim();

			try {
				const ref = createZoomRef();
				render(ZoomRefLightbox, { zoomRef: ref, label: 'Touch action test' });

				const zoomContainer = screen.getByAltText('test').parentElement!.parentElement!;
				expect(zoomContainer.style.containerType).toBe('size');
				expect(touchAction(zoomContainer)).toBe('pan-x pan-y');

				act(() => ref.current!.zoomTo(2));
				expect(touchAction(zoomContainer)).toBe('none');

				act(() => ref.current!.reset());
				expect(touchAction(zoomContainer)).toBe('pan-x pan-y');
			} finally {
				Object.defineProperty(CSSStyleDeclaration.prototype, 'cssText', cssTextDescriptor);
			}
		});

		describe('elastic overscroll', () => {
			it('changeZoom with overscroll allows zoom past maxZoom', () => {
				const ref = createZoomRef();
				render(ZoomRefLightbox, { zoomRef: ref, label: 'Elastic test' });

				// Direct zoomTo hard-clamps at maxZoom
				act(() => ref.current!.zoomTo(6));
				expect(ref.current!.zoom).toBe(4);
			});

			it('snapToBounds after overscroll clamps zoom to maxZoom', () => {
				const ref = createZoomRef();
				render(ZoomRefLightbox, { zoomRef: ref, label: 'Snap test' });

				// Hard-clamp zoomTo at max, then try to go beyond (simulating pinch)
				act(() => ref.current!.zoomTo(4));
				expect(ref.current!.zoom).toBe(4);

				// Reset confirms we snap back
				act(() => ref.current!.reset());
				expect(ref.current!.zoom).toBe(1);
			});

			it('zoom below minZoom is clamped by hard clamp', () => {
				const ref = createZoomRef();
				render(ZoomRefLightbox, { zoomRef: ref, label: 'Min clamp test' });

				act(() => ref.current!.zoomTo(0.5));
				expect(ref.current!.zoom).toBe(1);
			});

			describe('elastic pan (mouse + touch)', () => {
				function setupOverflowGeometry(img: HTMLElement) {
					Object.defineProperty(img, 'offsetWidth', { configurable: true, value: 400 });
					Object.defineProperty(img, 'offsetHeight', { configurable: true, value: 400 });
				}

				function setupLetterboxGeometry(img: HTMLElement) {
					Object.defineProperty(img, 'offsetWidth', { configurable: true, value: 120 });
					Object.defineProperty(img, 'offsetHeight', { configurable: true, value: 120 });
				}

				function withViewport(run: () => void) {
					const origRect = HTMLElement.prototype.getBoundingClientRect;
					HTMLElement.prototype.getBoundingClientRect = function () {
						return {
							width: 400,
							height: 400,
							top: 0,
							left: 0,
							right: 400,
							bottom: 400,
							x: 0,
							y: 0,
							toJSON() {}
						} as DOMRect;
					};
					try {
						run();
					} finally {
						HTMLElement.prototype.getBoundingClientRect = origRect;
					}
				}

				function renderZoomPan(ref: ZoomRef) {
					const panRef = { current: null as OverscrollPan | null };
					render(ZoomRefLightbox, { zoomRef: ref, panRef, label: 'Elastic pan test' });
					return panRef;
				}

				// Polyfill PointerEvent + animate for gesture-path tests. Restore both
				// afterward — a mock `animate` that never fires `onfinish` leaves
				// `isAnimating` stuck and leaks `data-zoomed` into later suites.
				const origPointerEvent = globalThis.PointerEvent;
				const origAnimate = Element.prototype.animate;
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
								this.isPrimary = init.isPrimary ?? true;
							}
						};
					}
					Element.prototype.animate = vi.fn(() => {
						let onfinish: (() => void) | null = null;
						const anim = {
							finished: Promise.resolve(),
							cancel: vi.fn(),
							play: vi.fn(),
							pause: vi.fn(),
							oncancel: null as (() => void) | null,
							commitStyles: vi.fn(),
							get onfinish() {
								return onfinish;
							},
							// Finish when assigned — `act()` does not reliably flush
							// queueMicrotask, and settle commits rest only on finish.
							set onfinish(fn: (() => void) | null) {
								onfinish = fn;
								if (fn) fn();
							}
						};
						return anim;
					}) as unknown as typeof Element.prototype.animate;
				});
				afterEach(() => {
					if (origPointerEvent) {
						(globalThis as Record<string, unknown>).PointerEvent = origPointerEvent;
					} else {
						delete (globalThis as Record<string, unknown>).PointerEvent;
					}
					Element.prototype.animate = origAnimate;
				});

				function dispatchPointer(
					el: Element,
					type: string,
					init: Partial<PointerEventInit> & {
						pointerId?: number;
						pointerType?: string;
						clientX?: number;
						clientY?: number;
					} = {}
				) {
					el.dispatchEvent(
						new PointerEvent(type, {
							bubbles: true,
							cancelable: true,
							pointerId: 1,
							isPrimary: true,
							...init
						})
					);
				}

				/**
				 * Install a sync rAF queue, run `release`, pump frames until the
				 * physics sim settles, then flush WAAPI `onfinish` microtasks so the
				 * pose store commits rest (settle no longer commits on release).
				 */
				function withPanPhysicsFlush(release: () => void, frames = 120) {
					const queue: FrameRequestCallback[] = [];
					let now = 0;
					const origRaf = globalThis.requestAnimationFrame;
					const origCancel = globalThis.cancelAnimationFrame;
					const origNow = performance.now.bind(performance);
					globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
						queue.push(cb);
						return queue.length;
					}) as typeof requestAnimationFrame;
					globalThis.cancelAnimationFrame = (() => {}) as typeof cancelAnimationFrame;
					performance.now = () => now;
					try {
						act(release);
						act(() => {
							for (let i = 0; i < frames && queue.length > 0; i++) {
								const cb = queue.shift()!;
								now += 1000 / 60;
								cb(now);
							}
						});
						// Default mock finishes settle when `onfinish` is assigned; this
						// drains any leftover React commit from that landing.
						act(() => {});
					} finally {
						globalThis.requestAnimationFrame = origRaf;
						globalThis.cancelAnimationFrame = origCancel;
						performance.now = origNow;
					}
				}

				it('elastic overscroll lets mouse pan past the hard pan edge', () => {
					withViewport(() => {
						const ref = createZoomRef();
						const panRef = renderZoomPan(ref);
						setupOverflowGeometry(screen.getByTestId('zoom-img'));

						// content 400 @ zoom 2 in 400 viewport → ±100 pan range
						act(() => ref.current!.zoomTo(2));
						expect(ref.current!.zoom).toBe(2);

						// Hard-clamp path stops at the edge
						act(() => panRef.current!(-200, 0, false));
						expect(ref.current!.offsetX).toBe(100);

						// Elastic path allows past the edge (resisted, not raw) — mouse leash
						act(() => panRef.current!(-200, 0, true));
						const dim = rubberBandPanDimension(400, 2, RUBBER_BAND_DIMENSION_FACTOR_MOUSE);
						expect(ref.current!.offsetX).toBeCloseTo(rubberBandClamp(300, -100, 100, dim), 5);
						expect(ref.current!.offsetX).toBeGreaterThan(100);
						expect(ref.current!.offsetX).toBeLessThan(300);
					});
				});

				it('mouse elastic overscroll allows letterboxed (non-overflowing) pan past rest', () => {
					withViewport(() => {
						const ref = createZoomRef();
						const panRef = renderZoomPan(ref);
						setupLetterboxGeometry(screen.getByTestId('zoom-img'));

						act(() => ref.current!.zoomTo(2));

						// Hard-clamp: still fits → no pan
						act(() => panRef.current!(40, 0, false));
						expect(ref.current!.offsetX).toBe(0);

						// Mouse elastic: rubber-band away from rest even when letterboxed
						act(() => panRef.current!(40, 0, true, false));
						expect(ref.current!.offsetX).not.toBe(0);
						const dim = rubberBandPanDimension(400, 2, RUBBER_BAND_DIMENSION_FACTOR_MOUSE);
						// dx positive → raw decreases (changeOffsets subtracts dx)
						expect(ref.current!.offsetX).toBeCloseTo(rubberBandClamp(-40, 0, 0, dim), 5);
					});
				});

				it('touch elastic overscroll does not pan letterboxed (non-overflowing) axes', () => {
					withViewport(() => {
						const ref = createZoomRef();
						const panRef = renderZoomPan(ref);
						setupLetterboxGeometry(screen.getByTestId('zoom-img'));

						act(() => ref.current!.zoomTo(2));
						act(() => panRef.current!(40, 25, true, true));
						expect(ref.current!.offsetX).toBe(0);
						expect(ref.current!.offsetY).toBe(0);
					});
				});

				it('mouse drag past bounds rubber-bands and snaps back on release', () => {
					const origRect = HTMLElement.prototype.getBoundingClientRect;
					HTMLElement.prototype.getBoundingClientRect = function () {
						return {
							width: 400,
							height: 400,
							top: 0,
							left: 0,
							right: 400,
							bottom: 400,
							x: 0,
							y: 0,
							toJSON() {}
						} as DOMRect;
					};
					try {
						const ref = createZoomRef();
						renderZoomPan(ref);
						const img = screen.getByTestId('zoom-img');
						setupOverflowGeometry(img);

						act(() => ref.current!.zoomTo(2, { rapid: true }));

						// Pointer moves right → content offset past +max
						act(() => {
							dispatchPointer(img, 'pointerdown', {
								clientX: 200,
								clientY: 200,
								pointerType: 'mouse',
								button: 0
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 600,
								clientY: 200,
								pointerType: 'mouse'
							});
						});

						expect(ref.current!.offsetX).toBeGreaterThan(100);

						withPanPhysicsFlush(() => {
							dispatchPointer(img, 'pointerup', {
								clientX: 600,
								clientY: 200,
								pointerType: 'mouse'
							});
						});
						expect(ref.current!.offsetX).toBe(100);
						expect(ref.current!.offsetY).toBe(0);
					} finally {
						HTMLElement.prototype.getBoundingClientRect = origRect;
					}
				});

				it('touch drag past bounds rubber-bands and snaps back on release', () => {
					const origRect = HTMLElement.prototype.getBoundingClientRect;
					HTMLElement.prototype.getBoundingClientRect = function () {
						return {
							width: 400,
							height: 400,
							top: 0,
							left: 0,
							right: 400,
							bottom: 400,
							x: 0,
							y: 0,
							toJSON() {}
						} as DOMRect;
					};
					try {
						const ref = createZoomRef();
						renderZoomPan(ref);
						const img = screen.getByTestId('zoom-img');
						setupOverflowGeometry(img);

						act(() => ref.current!.zoomTo(2, { rapid: true }));

						act(() => {
							dispatchPointer(img, 'pointerdown', {
								clientX: 200,
								clientY: 200,
								pointerType: 'touch'
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 600,
								clientY: 200,
								pointerType: 'touch'
							});
						});

						expect(ref.current!.offsetX).toBeGreaterThan(100);

						withPanPhysicsFlush(() => {
							dispatchPointer(img, 'pointerup', {
								clientX: 600,
								clientY: 200,
								pointerType: 'touch'
							});
						});
						expect(ref.current!.offsetX).toBe(100);
						expect(ref.current!.offsetY).toBe(0);
					} finally {
						HTMLElement.prototype.getBoundingClientRect = origRect;
					}
				});

				it('mouse rubber-band leash is shorter than touch for the same drag', () => {
					withViewport(() => {
						const measure = (pointerType: 'mouse' | 'touch') => {
							cleanup();
							const ref = createZoomRef();
							renderZoomPan(ref);
							const img = screen.getByTestId('zoom-img');
							setupOverflowGeometry(img);
							act(() => ref.current!.zoomTo(2, { rapid: true }));
							act(() => {
								dispatchPointer(img, 'pointerdown', {
									clientX: 200,
									clientY: 200,
									pointerType,
									button: 0
								});
								dispatchPointer(img, 'pointermove', {
									clientX: 600,
									clientY: 200,
									pointerType
								});
							});
							return ref.current!.offsetX;
						};

						const mouseX = measure('mouse');
						const touchX = measure('touch');
						expect(mouseX).toBeGreaterThan(100);
						expect(touchX).toBeGreaterThan(mouseX);
					});
				});

				it('touch drag on letterboxed zoom does not move offsets', () => {
					withViewport(() => {
						const ref = createZoomRef();
						renderZoomPan(ref);
						const img = screen.getByTestId('zoom-img');
						setupLetterboxGeometry(img);

						act(() => ref.current!.zoomTo(2, { rapid: true }));
						act(() => {
							dispatchPointer(img, 'pointerdown', {
								clientX: 200,
								clientY: 200,
								pointerType: 'touch'
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 280,
								clientY: 260,
								pointerType: 'touch'
							});
						});
						expect(ref.current!.offsetX).toBe(0);
						expect(ref.current!.offsetY).toBe(0);
					});
				});

				it('mouse drag on letterboxed zoom rubber-bands then snaps home', () => {
					const origRect = HTMLElement.prototype.getBoundingClientRect;
					HTMLElement.prototype.getBoundingClientRect = function () {
						return {
							width: 400,
							height: 400,
							top: 0,
							left: 0,
							right: 400,
							bottom: 400,
							x: 0,
							y: 0,
							toJSON() {}
						} as DOMRect;
					};
					try {
						const ref = createZoomRef();
						renderZoomPan(ref);
						const img = screen.getByTestId('zoom-img');
						setupLetterboxGeometry(img);

						act(() => ref.current!.zoomTo(2, { rapid: true }));
						act(() => {
							dispatchPointer(img, 'pointerdown', {
								clientX: 200,
								clientY: 200,
								pointerType: 'mouse',
								button: 0
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 280,
								clientY: 200,
								pointerType: 'mouse'
							});
						});
						expect(ref.current!.offsetX).not.toBe(0);

						withPanPhysicsFlush(() => {
							dispatchPointer(img, 'pointerup', {
								clientX: 280,
								clientY: 200,
								pointerType: 'mouse'
							});
						});
						expect(ref.current!.offsetX).toBe(0);
						expect(ref.current!.offsetY).toBe(0);
					} finally {
						HTMLElement.prototype.getBoundingClientRect = origRect;
					}
				});

				it('hands off to pan on the remaining finger after pinch 2→1 (rebase then pan)', () => {
					withViewport(() => {
						const ref = createZoomRef();
						renderZoomPan(ref);
						const img = screen.getByTestId('zoom-img');
						setupOverflowGeometry(img);

						act(() => {
							// Two-finger pinch out
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
								clientX: 100,
								clientY: 200,
								pointerId: 1,
								pointerType: 'touch'
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 300,
								clientY: 200,
								pointerId: 2,
								pointerType: 'touch'
							});
						});
						expect(ref.current!.zoom).toBeGreaterThan(1);
						const zoomedOffsets = {
							x: ref.current!.offsetX,
							y: ref.current!.offsetY
						};

						act(() => {
							// Lift finger 1 — first remaining move rebases (no pan jump).
							dispatchPointer(img, 'pointerup', {
								clientX: 100,
								clientY: 200,
								pointerId: 1,
								pointerType: 'touch'
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 310,
								clientY: 210,
								pointerId: 2,
								pointerType: 'touch'
							});
						});
						expect(ref.current!.offsetX).toBeCloseTo(zoomedOffsets.x, 5);
						expect(ref.current!.offsetY).toBeCloseTo(zoomedOffsets.y, 5);

						// Further moves with the remaining finger pan.
						act(() => {
							dispatchPointer(img, 'pointermove', {
								clientX: 360,
								clientY: 240,
								pointerId: 2,
								pointerType: 'touch'
							});
						});
						expect(ref.current!.offsetX).not.toBeCloseTo(zoomedOffsets.x, 5);
					});
				});

				it('pans a zoomed image when two fingers translate without changing spread', () => {
					withViewport(() => {
						const ref = createZoomRef();
						renderZoomPan(ref);
						const img = screen.getByTestId('zoom-img');
						setupOverflowGeometry(img);

						act(() => ref.current!.zoomTo(2, { rapid: true }));
						expect(ref.current!.offsetX).toBe(0);
						expect(ref.current!.offsetY).toBe(0);

						act(() => {
							dispatchPointer(img, 'pointerdown', {
								clientX: 160,
								clientY: 200,
								pointerId: 1,
								pointerType: 'touch',
								isPrimary: true
							});
							dispatchPointer(img, 'pointerdown', {
								clientX: 240,
								clientY: 200,
								pointerId: 2,
								pointerType: 'touch',
								isPrimary: false
							});
							// Interleaved 8px steps (real touch samples). A single 60px
							// jump on one finger collapses the span and reads as a pinch.
							for (const [x1, x2] of [
								[168, 248],
								[176, 256],
								[184, 264],
								[192, 272],
								[200, 280],
								[208, 288],
								[216, 296],
								[220, 300]
							] as const) {
								dispatchPointer(img, 'pointermove', {
									clientX: x1,
									clientY: 200,
									pointerId: 1,
									pointerType: 'touch'
								});
								dispatchPointer(img, 'pointermove', {
									clientX: x2,
									clientY: 200,
									pointerId: 2,
									pointerType: 'touch'
								});
							}
						});

						expect(ref.current!.zoom).toBeCloseTo(2, 5);
						// Centroid traveled +60 screen-px at 2× → +30 offset-px.
						expect(ref.current!.offsetX).toBeCloseTo(30, 5);
						expect(ref.current!.offsetY).toBeCloseTo(0, 5);
					});
				});

				it('does not zoom from finger-span jitter during a two-finger pan', () => {
					withViewport(() => {
						const ref = createZoomRef();
						renderZoomPan(ref);
						const img = screen.getByTestId('zoom-img');
						setupOverflowGeometry(img);

						act(() => ref.current!.zoomTo(2, { rapid: true }));

						act(() => {
							dispatchPointer(img, 'pointerdown', {
								clientX: 160,
								clientY: 200,
								pointerId: 1,
								pointerType: 'touch',
								isPrimary: true
							});
							dispatchPointer(img, 'pointerdown', {
								clientX: 240,
								clientY: 200,
								pointerId: 2,
								pointerType: 'touch',
								isPrimary: false
							});
							// Interleaved 8px steps (real touch samples), then a 12px span drift.
							// A single 60px jump on one finger would look like a pinch.
							for (const [x1, x2] of [
								[168, 248],
								[176, 256],
								[184, 264],
								[192, 272],
								[200, 280],
								[208, 300]
							] as const) {
								dispatchPointer(img, 'pointermove', {
									clientX: x1,
									clientY: 200,
									pointerId: 1,
									pointerType: 'touch'
								});
								dispatchPointer(img, 'pointermove', {
									clientX: x2,
									clientY: 200,
									pointerId: 2,
									pointerType: 'touch'
								});
							}
						});

						expect(ref.current!.zoom).toBeCloseTo(2, 5);
						expect(ref.current!.offsetX).toBeGreaterThan(20);
					});
				});

				it('composes two-finger pan with pinch scale in one gesture', () => {
					withViewport(() => {
						const ref = createZoomRef();
						renderZoomPan(ref);
						const img = screen.getByTestId('zoom-img');
						setupOverflowGeometry(img);

						act(() => ref.current!.zoomTo(2, { rapid: true }));

						act(() => {
							dispatchPointer(img, 'pointerdown', {
								clientX: 160,
								clientY: 200,
								pointerId: 1,
								pointerType: 'touch',
								isPrimary: true
							});
							dispatchPointer(img, 'pointerdown', {
								clientX: 240,
								clientY: 200,
								pointerId: 2,
								pointerType: 'touch',
								isPrimary: false
							});
							// Spread 80→160 and slide the midpoint +40px right.
							dispatchPointer(img, 'pointermove', {
								clientX: 160,
								clientY: 200,
								pointerId: 1,
								pointerType: 'touch'
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 320,
								clientY: 200,
								pointerId: 2,
								pointerType: 'touch'
							});
						});

						expect(ref.current!.zoom).toBeCloseTo(4, 5);
						// origin centroid 0 at 2×; current centroid +40 at 4× → +10 offset.
						expect(ref.current!.offsetX).toBeCloseTo(10, 5);
					});
				});

				it('continues pan without a jump after a pan → pinch → 2→1 handoff', () => {
					withViewport(() => {
						const ref = createZoomRef();
						renderZoomPan(ref);
						const img = screen.getByTestId('zoom-img');
						setupOverflowGeometry(img);

						act(() => ref.current!.zoomTo(2, { rapid: true }));

						// Single-finger pan — latches the elastic-drag accumulator.
						act(() => {
							dispatchPointer(img, 'pointerdown', {
								clientX: 200,
								clientY: 200,
								pointerId: 1,
								pointerType: 'touch',
								isPrimary: true
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 240,
								clientY: 200,
								pointerId: 1,
								pointerType: 'touch'
							});
						});
						expect(ref.current!.offsetX).not.toBe(0);

						// Second finger lands mid-pan → pinch. The pinch rewrites zoom AND
						// offsets via focal projection, bypassing the pan accumulator.
						act(() => {
							dispatchPointer(img, 'pointerdown', {
								clientX: 300,
								clientY: 260,
								pointerId: 2,
								pointerType: 'touch',
								isPrimary: false
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 340,
								clientY: 300,
								pointerId: 2,
								pointerType: 'touch'
							});
						});
						expect(ref.current!.zoom).toBeGreaterThan(2);
						const postPinch = { x: ref.current!.offsetX, y: ref.current!.offsetY };

						// Release the second finger and keep panning with the first:
						// one rebase move, then a small (2px) real pan move.
						act(() => {
							dispatchPointer(img, 'pointerup', {
								clientX: 340,
								clientY: 300,
								pointerId: 2,
								pointerType: 'touch'
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 241,
								clientY: 201,
								pointerId: 1,
								pointerType: 'touch'
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 243,
								clientY: 203,
								pointerId: 1,
								pointerType: 'touch'
							});
						});

						// Regression: the stale pre-pinch accumulator used to teleport the
						// offsets back toward their pre-pinch values here (a ~18px jump).
						// A 2px finger move must produce a comparably small offset delta.
						expect(Math.abs(ref.current!.offsetX - postPinch.x)).toBeLessThan(2);
						expect(Math.abs(ref.current!.offsetY - postPinch.y)).toBeLessThan(2);
					});
				});

				it('runs the 2→1 snap-back concurrently with the surviving finger’s pan', () => {
					withViewport(() => {
						const ref = createZoomRef();
						renderZoomPan(ref);
						const img = screen.getByTestId('zoom-img');
						setupOverflowGeometry(img);

						act(() => ref.current!.zoomTo(3, { rapid: true }));

						// Manual rAF queue so snap frames can be interleaved with pointer
						// moves — that's exactly what happens on a real device.
						const queue: FrameRequestCallback[] = [];
						let now = 0;
						const origRaf = globalThis.requestAnimationFrame;
						const origCancel = globalThis.cancelAnimationFrame;
						globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
							queue.push(cb);
							return queue.length;
						}) as typeof requestAnimationFrame;
						globalThis.cancelAnimationFrame = (() => {}) as typeof cancelAnimationFrame;
						const pump = (frames: number) => {
							act(() => {
								for (let i = 0; i < frames && queue.length > 0; i++) {
									const cb = queue.shift()!;
									now += 1000 / 60;
									cb(now);
								}
							});
						};

						try {
							// Pinch out past maxZoom (4) — elastic overshoot to 5×.
							act(() => {
								dispatchPointer(img, 'pointerdown', {
									clientX: 180,
									clientY: 200,
									pointerId: 1,
									pointerType: 'touch',
									isPrimary: true
								});
								dispatchPointer(img, 'pointerdown', {
									clientX: 220,
									clientY: 200,
									pointerId: 2,
									pointerType: 'touch',
									isPrimary: false
								});
								dispatchPointer(img, 'pointermove', {
									clientX: 140,
									clientY: 200,
									pointerId: 1,
									pointerType: 'touch'
								});
								dispatchPointer(img, 'pointermove', {
									clientX: 260,
									clientY: 200,
									pointerId: 2,
									pointerType: 'touch'
								});
							});
							expect(ref.current!.zoom).toBeCloseTo(5, 5);

							// Lift one finger: like iOS, the rubber-band return starts NOW —
							// as a rAF value animation, not a WAAPI racing the pointer.
							act(() => {
								dispatchPointer(img, 'pointerup', {
									clientX: 140,
									clientY: 200,
									pointerId: 1,
									pointerType: 'touch'
								});
							});
							pump(3);
							const mid = ref.current!.zoom;
							expect(mid).toBeLessThan(5);
							expect(mid).toBeGreaterThan(4);

							// Mid-snap the pan is LIVE: the first move only re-anchors the
							// pan origin (rebase), the next one pans — concurrently with
							// the returning zoom. The moves themselves never touch zoom.
							const held = { x: ref.current!.offsetX, y: ref.current!.offsetY };
							act(() => {
								dispatchPointer(img, 'pointermove', {
									clientX: 261,
									clientY: 201,
									pointerId: 2,
									pointerType: 'touch'
								});
							});
							expect(ref.current!.offsetX).toBe(held.x);
							act(() => {
								dispatchPointer(img, 'pointermove', {
									clientX: 275,
									clientY: 215,
									pointerId: 2,
									pointerType: 'touch'
								});
							});
							expect(ref.current!.offsetX).not.toBe(held.x);
							expect(ref.current!.zoom).toBe(mid);

							// Snap completes while the finger is still down — the pan
							// position it carried is untouched by the settle.
							const panned = { x: ref.current!.offsetX, y: ref.current!.offsetY };
							pump(200);
							expect(ref.current!.zoom).toBe(4);
							expect(ref.current!.offsetX).toBe(panned.x);
							expect(ref.current!.offsetY).toBe(panned.y);

							// Panning continues seamlessly after the snap lands.
							act(() => {
								dispatchPointer(img, 'pointermove', {
									clientX: 300,
									clientY: 240,
									pointerId: 2,
									pointerType: 'touch'
								});
							});
							expect(ref.current!.offsetX).not.toBe(panned.x);
							expect(ref.current!.zoom).toBe(4);

							// Final release: nothing left to snap.
							act(() => {
								dispatchPointer(img, 'pointerup', {
									clientX: 300,
									clientY: 240,
									pointerId: 2,
									pointerType: 'touch'
								});
							});
							pump(200);
							expect(ref.current!.zoom).toBe(4);
						} finally {
							globalThis.requestAnimationFrame = origRaf;
							globalThis.cancelAnimationFrame = origCancel;
						}
					});
				});

				it('blocks pan while a discrete zoom WAAPI is in flight and resumes after it settles', () => {
					withViewport(() => {
						const ref = createZoomRef();
						renderZoomPan(ref);
						const img = screen.getByTestId('zoom-img');
						setupOverflowGeometry(img);

						// Hold the discrete zoom WAAPI mid-flight.
						const held: Array<{
							cancel: ReturnType<typeof vi.fn>;
							onfinish: (() => void) | null;
						}> = [];
						Element.prototype.animate = vi.fn(() => {
							const anim = {
								finished: new Promise<void>(() => {}),
								cancel: vi.fn(),
								play: vi.fn(),
								pause: vi.fn(),
								onfinish: null as (() => void) | null,
								oncancel: null as (() => void) | null,
								commitStyles: vi.fn()
							};
							held.push(anim);
							return anim;
						}) as unknown as typeof Element.prototype.animate;

						act(() => ref.current!.zoomTo(2, { rapid: true }));
						act(() => ref.current!.zoomTo(4));
						expect(ref.current!.zoom).toBe(4);
						expect(held.length).toBeGreaterThan(0);
						const zoomAnim = held[held.length - 1]!;

						// Pan attempt mid-animation: absorbed. The WAAPI is never torn
						// and the pose stays at the animation's committed target.
						act(() => {
							dispatchPointer(img, 'pointerdown', {
								clientX: 200,
								clientY: 200,
								pointerId: 3,
								pointerType: 'touch',
								isPrimary: true
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 215,
								clientY: 215,
								pointerId: 3,
								pointerType: 'touch'
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 230,
								clientY: 230,
								pointerId: 3,
								pointerType: 'touch'
							});
						});
						expect(zoomAnim.cancel).not.toHaveBeenCalled();
						expect(ref.current!.zoom).toBe(4);
						expect(ref.current!.offsetX).toBe(0);
						expect(ref.current!.offsetY).toBe(0);

						// Animation settles → the very next move pans from the latest
						// absorbed sample (fresh origin, no jump, no dead window).
						act(() => {
							zoomAnim.onfinish?.();
						});
						act(() => {
							dispatchPointer(img, 'pointermove', {
								clientX: 245,
								clientY: 245,
								pointerId: 3,
								pointerType: 'touch'
							});
						});
						expect(ref.current!.offsetX).not.toBe(0);
						expect(ref.current!.zoom).toBe(4);
					});
				});

				it('defers pinch arming until the discrete zoom WAAPI settles', () => {
					withViewport(() => {
						const ref = createZoomRef();
						renderZoomPan(ref);
						const img = screen.getByTestId('zoom-img');
						setupOverflowGeometry(img);

						const held: Array<{
							cancel: ReturnType<typeof vi.fn>;
							onfinish: (() => void) | null;
						}> = [];
						Element.prototype.animate = vi.fn(() => {
							const anim = {
								finished: new Promise<void>(() => {}),
								cancel: vi.fn(),
								play: vi.fn(),
								pause: vi.fn(),
								onfinish: null as (() => void) | null,
								oncancel: null as (() => void) | null,
								commitStyles: vi.fn()
							};
							held.push(anim);
							return anim;
						}) as unknown as typeof Element.prototype.animate;

						act(() => ref.current!.zoomTo(2, { rapid: true }));
						act(() => ref.current!.zoomTo(4));
						expect(ref.current!.zoom).toBe(4);
						const zoomAnim = held[held.length - 1]!;

						// Two fingers land mid-animation and move: no pinch arms, the
						// WAAPI is never torn, zoom stays at the committed target.
						act(() => {
							dispatchPointer(img, 'pointerdown', {
								clientX: 100,
								clientY: 200,
								pointerId: 1,
								pointerType: 'touch',
								isPrimary: true
							});
							dispatchPointer(img, 'pointerdown', {
								clientX: 300,
								clientY: 200,
								pointerId: 2,
								pointerType: 'touch',
								isPrimary: false
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 140,
								clientY: 200,
								pointerId: 1,
								pointerType: 'touch'
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 260,
								clientY: 200,
								pointerId: 2,
								pointerType: 'touch'
							});
						});
						expect(zoomAnim.cancel).not.toHaveBeenCalled();
						expect(ref.current!.zoom).toBe(4);

						// Settle → the queued arm fires with the fingers' FRESH positions
						// (distance 120) and the settled 4× zoom. Pinching in to distance
						// 60 must halve the zoom — continuous from the settled state.
						act(() => {
							zoomAnim.onfinish?.();
						});
						act(() => {
							dispatchPointer(img, 'pointermove', {
								clientX: 170,
								clientY: 200,
								pointerId: 1,
								pointerType: 'touch'
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 230,
								clientY: 200,
								pointerId: 2,
								pointerType: 'touch'
							});
						});
						expect(ref.current!.zoom).toBeCloseTo(2, 5);
					});
				});

				it('swallows wheel zoom and wheel pan while a discrete zoom WAAPI is in flight', () => {
					withViewport(() => {
						const ref = createZoomRef();
						renderZoomPan(ref);
						const img = screen.getByTestId('zoom-img');
						setupOverflowGeometry(img);

						const held: Array<{
							cancel: ReturnType<typeof vi.fn>;
							onfinish: (() => void) | null;
						}> = [];
						Element.prototype.animate = vi.fn(() => {
							const anim = {
								finished: new Promise<void>(() => {}),
								cancel: vi.fn(),
								play: vi.fn(),
								pause: vi.fn(),
								onfinish: null as (() => void) | null,
								oncancel: null as (() => void) | null,
								commitStyles: vi.fn()
							};
							held.push(anim);
							return anim;
						}) as unknown as typeof Element.prototype.animate;

						act(() => ref.current!.zoomTo(2, { rapid: true }));
						act(() => ref.current!.zoomTo(4));
						expect(ref.current!.zoom).toBe(4);
						const zoomAnim = held[held.length - 1]!;

						const dispatchWheel = (opts: {
							ctrlKey?: boolean;
							deltaX?: number;
							deltaY?: number;
						}) => {
							const event = new WheelEvent('wheel', {
								bubbles: true,
								cancelable: true,
								ctrlKey: opts.ctrlKey ?? false,
								deltaX: opts.deltaX ?? 0,
								deltaY: opts.deltaY ?? 0
							});
							Object.defineProperty(event, 'deltaMode', { value: 0 });
							img.dispatchEvent(event);
							return event;
						};

						// Trackpad pinch (ctrl+wheel) mid-animation: swallowed. The WAAPI
						// is never torn — this is the desktop freeze regression: canceling
						// it re-based the wheel zoom on the stale committed target.
						let event!: WheelEvent;
						act(() => {
							event = dispatchWheel({ ctrlKey: true, deltaY: 40 });
						});
						expect(event.defaultPrevented).toBe(true);
						expect(zoomAnim.cancel).not.toHaveBeenCalled();
						expect(ref.current!.zoom).toBe(4);

						// Wheel pan mid-animation: also swallowed, offsets untouched.
						act(() => {
							event = dispatchWheel({ deltaX: 30, deltaY: 30 });
						});
						expect(event.defaultPrevented).toBe(true);
						expect(ref.current!.offsetX).toBe(0);
						expect(ref.current!.offsetY).toBe(0);

						// Animation settles → wheel input works again.
						act(() => {
							zoomAnim.onfinish?.();
						});
						act(() => {
							dispatchWheel({ ctrlKey: true, deltaY: 40 });
						});
						expect(ref.current!.zoom).toBeLessThan(4);
					});
				});

				it('wheel pan is screen-space 1:1 — deltas divide by zoom, like mouse drag', () => {
					withViewport(() => {
						const ref = createZoomRef();
						renderZoomPan(ref);
						const img = screen.getByTestId('zoom-img');
						setupOverflowGeometry(img);

						const dispatchWheel = (deltaX: number, deltaY: number) => {
							const event = new WheelEvent('wheel', {
								bubbles: true,
								cancelable: true,
								deltaX,
								deltaY
							});
							Object.defineProperty(event, 'deltaMode', { value: 0 });
							img.dispatchEvent(event);
						};

						// Offsets sit under `scale(zoom)`: one screen px costs 1/zoom
						// offset units. At 2×, 40 device px must pan 20 offset units —
						// raw deltas would pan zoom× faster than the fingers.
						act(() => ref.current!.zoomTo(2, { rapid: true }));
						act(() => dispatchWheel(40, 30));
						expect(ref.current!.offsetX).toBeCloseTo(-20, 5);
						expect(ref.current!.offsetY).toBeCloseTo(-15, 5);

						// Same gesture at 4× travels half as far again.
						act(() => ref.current!.zoomTo(4, { rapid: true }));
						act(() => dispatchWheel(40, 0));
						expect(ref.current!.offsetX).toBeCloseTo(-30, 5);
						expect(ref.current!.offsetY).toBeCloseTo(-15, 5);
					});
				});

				it('keyboard pan glides one content-space step through the pan physics', () => {
					withViewport(() => {
						const ref = createZoomRef();
						renderZoomPan(ref);
						setupOverflowGeometry(screen.getByTestId('zoom-img'));
						const content = screen.getByLabelText('Elastic pan test');

						act(() => ref.current!.zoomTo(2, { rapid: true }));
						const animate = Element.prototype.animate as unknown as ReturnType<typeof vi.fn>;
						const callsBefore = animate.mock.calls.length;

						// ArrowRight seeds a friction-coast impulse sized to cover the
						// default keyboardPanDistance (50 content px). The mocked WAAPI
						// finishes synchronously, committing the baked rest pose. The
						// coast is integrated in discrete frames, so allow a small
						// tolerance.
						fireEvent.keyDown(content, { key: 'ArrowRight' });
						expect(animate.mock.calls.length).toBeGreaterThan(callsBefore);
						expect(ref.current!.offsetX).toBeGreaterThan(-56);
						expect(ref.current!.offsetX).toBeLessThan(-44);
						expect(ref.current!.offsetY).toBeCloseTo(0, 5);

						// The glide must land between two failure modes: a flick-length
						// coast (~830ms, floaty) and a hard sub-350ms stop that makes
						// successive presses read as notchy stop-start.
						const settleOptions = animate.mock.calls[animate.mock.calls.length - 1]![1] as {
							duration: number;
						};
						expect(settleOptions.duration).toBeGreaterThan(350);
						expect(settleOptions.duration).toBeLessThan(750);

						// A second press on the other axis glides independently.
						fireEvent.keyDown(content, { key: 'ArrowDown' });
						expect(ref.current!.offsetY).toBeGreaterThan(-56);
						expect(ref.current!.offsetY).toBeLessThan(-44);

						// The step stays constant in content px at any zoom — keyboard is
						// a discrete command over the pannable range (which grows with
						// zoom), so press count to cross the image stays roughly flat.
						act(() => ref.current!.zoomTo(4, { rapid: true }));
						const yBefore = ref.current!.offsetY;
						fireEvent.keyDown(content, { key: 'ArrowDown' });
						const step = ref.current!.offsetY - yBefore;
						expect(step).toBeGreaterThan(-56);
						expect(step).toBeLessThan(-44);
					});
				});

				it('keyboard pan into the edge spring-settles at the bound', () => {
					withViewport(() => {
						const ref = createZoomRef();
						const panRef = renderZoomPan(ref);
						setupOverflowGeometry(screen.getByTestId('zoom-img'));
						const content = screen.getByLabelText('Elastic pan test');

						// content 400 @ zoom 2 in 400 viewport → ±100 pan range. Park on
						// the right edge via the hard-clamped pan path.
						act(() => ref.current!.zoomTo(2, { rapid: true }));
						act(() => panRef.current!(200, 0, false));
						expect(ref.current!.offsetX).toBe(-100);

						// Pressing further into the wall must not stick past the bound:
						// the glide overshoots into the rubber band and springs back.
						fireEvent.keyDown(content, { key: 'ArrowRight' });
						expect(ref.current!.offsetX).toBeCloseTo(-100, 5);
					});
				});

				it('keyboard pan is an instant clamped step under prefers-reduced-motion', () => {
					// The runtime samples the media query at render, so spy first.
					vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
						matches: query === '(prefers-reduced-motion: reduce)',
						media: query,
						onchange: null,
						addListener: vi.fn(),
						removeListener: vi.fn(),
						addEventListener: vi.fn(),
						removeEventListener: vi.fn(),
						dispatchEvent: vi.fn()
					}));
					withViewport(() => {
						const ref = createZoomRef();
						renderZoomPan(ref);
						setupOverflowGeometry(screen.getByTestId('zoom-img'));
						const content = screen.getByLabelText('Elastic pan test');

						act(() => ref.current!.zoomTo(2, { rapid: true }));
						const animate = Element.prototype.animate as unknown as ReturnType<typeof vi.fn>;
						const callsBefore = animate.mock.calls.length;

						// Exact hard-clamped step (50 content px), no settle animation
						// started.
						fireEvent.keyDown(content, { key: 'ArrowRight' });
						expect(ref.current!.offsetX).toBeCloseTo(-50, 5);
						fireEvent.keyDown(content, { key: 'ArrowDown' });
						expect(ref.current!.offsetY).toBeCloseTo(-50, 5);
						expect(animate.mock.calls.length).toBe(callsBefore);
					});
				});

				it('ctrl+wheel (Chrome/FF trackpad pinch) rubber-bands past maxZoom', () => {
					withViewport(() => {
						const ref = createZoomRef();
						renderZoomPan(ref);
						const img = screen.getByTestId('zoom-img');
						setupOverflowGeometry(img);

						act(() => ref.current!.zoomTo(4, { rapid: true }));

						act(() => {
							img.dispatchEvent(
								new WheelEvent('wheel', {
									bubbles: true,
									cancelable: true,
									ctrlKey: true,
									deltaY: -100
								})
							);
						});
						// Unconstrained 4 → 8, displayed through elasticClamp — not hard-clamped.
						expect(ref.current!.zoom).toBeCloseTo(elasticClamp(8, 1, 4), 5);
						expect(ref.current!.zoom).toBeGreaterThan(4);
					});
				});

				it('ctrl+wheel rubber-band accumulates unconstrained scale across events', () => {
					withViewport(() => {
						const ref = createZoomRef();
						renderZoomPan(ref);
						const img = screen.getByTestId('zoom-img');
						setupOverflowGeometry(img);

						act(() => ref.current!.zoomTo(4, { rapid: true }));

						const dispatchPinch = (deltaY: number) => {
							img.dispatchEvent(
								new WheelEvent('wheel', {
									bubbles: true,
									cancelable: true,
									ctrlKey: true,
									deltaY
								})
							);
						};

						act(() => {
							dispatchPinch(-50);
							dispatchPinch(-50);
						});
						const unconstrained = scaleZoom(scaleZoom(4, 50, 100), 50, 100);
						expect(ref.current!.zoom).toBeCloseTo(elasticClamp(unconstrained, 1, 4), 5);
						// Compounding elastic onto the displayed zoom would undershoot this.
						expect(ref.current!.zoom).toBeGreaterThan(elasticClamp(scaleZoom(4, 50, 100), 1, 4));
					});
				});

				it('ctrl+wheel snaps back to maxZoom after the pinch stream goes idle', () => {
					vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
					try {
						withViewport(() => {
							const ref = createZoomRef();
							renderZoomPan(ref);
							const img = screen.getByTestId('zoom-img');
							setupOverflowGeometry(img);

							act(() => ref.current!.zoomTo(4, { rapid: true }));
							act(() => {
								img.dispatchEvent(
									new WheelEvent('wheel', {
										bubbles: true,
										cancelable: true,
										ctrlKey: true,
										deltaY: -100
									})
								);
							});
							expect(ref.current!.zoom).toBeGreaterThan(4);

							act(() => {
								vi.advanceTimersByTime(WHEEL_PINCH_END_MS);
							});
							expect(ref.current!.zoom).toBe(4);
						});
					} finally {
						vi.useRealTimers();
					}
				});

				it('ctrl+wheel snap-back does not pan toward center from an off-center cursor', () => {
					vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
					try {
						withViewport(() => {
							const ref = createZoomRef();
							renderZoomPan(ref);
							const img = screen.getByTestId('zoom-img');
							setupOverflowGeometry(img);

							act(() => ref.current!.zoomTo(4, { rapid: true }));
							expect(ref.current!.offsetX).toBe(0);

							act(() => {
								img.dispatchEvent(
									new WheelEvent('wheel', {
										bubbles: true,
										cancelable: true,
										ctrlKey: true,
										deltaY: -100,
										clientX: 350,
										clientY: 200
									})
								);
							});
							expect(ref.current!.zoom).toBeGreaterThan(4);
							expect(ref.current!.offsetX).not.toBeCloseTo(0, 5);

							act(() => {
								vi.advanceTimersByTime(WHEEL_PINCH_END_MS);
							});
							expect(ref.current!.zoom).toBe(4);
							expect(ref.current!.offsetX).toBeCloseTo(0, 2);
						});
					} finally {
						vi.useRealTimers();
					}
				});

				it('ctrl+wheel rubber-bands below minZoom and snaps back on idle', () => {
					vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
					try {
						withViewport(() => {
							const ref = createZoomRef();
							renderZoomPan(ref);
							const img = screen.getByTestId('zoom-img');
							setupOverflowGeometry(img);

							act(() => {
								img.dispatchEvent(
									new WheelEvent('wheel', {
										bubbles: true,
										cancelable: true,
										ctrlKey: true,
										deltaY: 100
									})
								);
							});
							expect(ref.current!.zoom).toBeCloseTo(elasticClamp(0.5, 1, 4), 5);
							expect(ref.current!.zoom).toBeLessThan(1);

							act(() => {
								vi.advanceTimersByTime(WHEEL_PINCH_END_MS);
							});
							expect(ref.current!.zoom).toBe(1);
						});
					} finally {
						vi.useRealTimers();
					}
				});

				it('physical Ctrl+wheel hard-clamps at maxZoom (no rubber-band or snap-back)', () => {
					vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
					try {
						withViewport(() => {
							const ref = createZoomRef();
							renderZoomPan(ref);
							const img = screen.getByTestId('zoom-img');
							setupOverflowGeometry(img);

							act(() => ref.current!.zoomTo(4, { rapid: true }));
							act(() => {
								window.dispatchEvent(
									new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true, bubbles: true })
								);
								img.dispatchEvent(
									new WheelEvent('wheel', {
										bubbles: true,
										cancelable: true,
										ctrlKey: true,
										deltaY: -100
									})
								);
							});
							expect(ref.current!.zoom).toBe(4);

							act(() => {
								vi.advanceTimersByTime(WHEEL_PINCH_END_MS);
							});
							expect(ref.current!.zoom).toBe(4);
						});
					} finally {
						vi.useRealTimers();
					}
				});

				it('physical Ctrl+wheel hard-clamps at minZoom', () => {
					withViewport(() => {
						const ref = createZoomRef();
						renderZoomPan(ref);
						const img = screen.getByTestId('zoom-img');
						setupOverflowGeometry(img);

						act(() => {
							window.dispatchEvent(
								new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true, bubbles: true })
							);
							img.dispatchEvent(
								new WheelEvent('wheel', {
									bubbles: true,
									cancelable: true,
									ctrlKey: true,
									deltaY: 100
								})
							);
						});
						expect(ref.current!.zoom).toBe(1);
					});
				});

				it('ctrl+wheel rubber-bands again after Control is released', () => {
					withViewport(() => {
						const ref = createZoomRef();
						renderZoomPan(ref);
						const img = screen.getByTestId('zoom-img');
						setupOverflowGeometry(img);

						act(() => ref.current!.zoomTo(4, { rapid: true }));
						act(() => {
							window.dispatchEvent(
								new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true, bubbles: true })
							);
							img.dispatchEvent(
								new WheelEvent('wheel', {
									bubbles: true,
									cancelable: true,
									ctrlKey: true,
									deltaY: -100
								})
							);
						});
						expect(ref.current!.zoom).toBe(4);

						act(() => {
							window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Control', bubbles: true }));
							img.dispatchEvent(
								new WheelEvent('wheel', {
									bubbles: true,
									cancelable: true,
									ctrlKey: true,
									deltaY: -100
								})
							);
						});
						expect(ref.current!.zoom).toBeGreaterThan(4);
					});
				});

				it('ctrl+wheel pinch takes over an in-flight snap-back without jumping toward the bound', () => {
					vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
					try {
						withViewport(() => {
							const ref = createZoomRef();
							renderZoomPan(ref);
							const img = screen.getByTestId('zoom-img');
							setupOverflowGeometry(img);

							const held: Array<{
								cancel: ReturnType<typeof vi.fn>;
								currentTime: number;
								duration: number;
							}> = [];
							Element.prototype.animate = vi.fn(
								(_keyframes: unknown, opts?: number | KeyframeAnimationOptions) => {
									const anim = {
										finished: new Promise<void>(() => {}),
										cancel: vi.fn(),
										play: vi.fn(),
										pause: vi.fn(),
										onfinish: null as (() => void) | null,
										oncancel: null as (() => void) | null,
										commitStyles: vi.fn(),
										currentTime: 0,
										duration:
											typeof opts === 'object' ? Number(opts?.duration ?? 0) : Number(opts ?? 0)
									};
									held.push(anim);
									return anim;
								}
							) as unknown as typeof Element.prototype.animate;

							act(() => ref.current!.zoomTo(4, { rapid: true }));
							act(() => {
								img.dispatchEvent(
									new WheelEvent('wheel', {
										bubbles: true,
										cancelable: true,
										ctrlKey: true,
										deltaY: -100
									})
								);
							});
							const overshot = ref.current!.zoom;
							expect(overshot).toBeGreaterThan(4);

							act(() => {
								vi.advanceTimersByTime(WHEEL_PINCH_END_MS);
							});
							expect(held.length).toBeGreaterThan(0);
							const settleAnim = held[held.length - 1]!;
							expect(settleAnim.duration).toBeGreaterThan(0);
							settleAnim.currentTime = settleAnim.duration / 2;

							const mid = ref.current!.zoom;
							expect(mid).toBeGreaterThan(4);
							expect(mid).toBeLessThan(overshot);

							// Continue pinching out. Seeding unconstrained from the displayed
							// mid-snap zoom (without invert) elastic-clamps back toward max.
							act(() => {
								img.dispatchEvent(
									new WheelEvent('wheel', {
										bubbles: true,
										cancelable: true,
										ctrlKey: true,
										deltaY: -20
									})
								);
							});
							expect(ref.current!.zoom).toBeGreaterThanOrEqual(mid);
						});
					} finally {
						vi.useRealTimers();
					}
				});

				it('snaps an out-of-bounds pinch released in the same task as its moves', () => {
					withViewport(() => {
						const ref = createZoomRef();
						renderZoomPan(ref);
						const img = screen.getByTestId('zoom-img');
						setupOverflowGeometry(img);

						act(() => ref.current!.zoomTo(3, { rapid: true }));

						// Whole gesture — downs, elastic pinch to 5×, both ups — in ONE
						// synchronous task, so React batches every state commit until the
						// end. Regression for the eager ref sync: `zoomRef` used to lag
						// the batched state, so the 2→1 breakup read the stale in-bounds
						// zoom (3×), never started the snap-back, and zoom stuck at 5×.
						// The flush then pumps the rAF spring to convergence.
						withPanPhysicsFlush(() => {
							dispatchPointer(img, 'pointerdown', {
								clientX: 180,
								clientY: 200,
								pointerId: 1,
								pointerType: 'touch',
								isPrimary: true
							});
							dispatchPointer(img, 'pointerdown', {
								clientX: 220,
								clientY: 200,
								pointerId: 2,
								pointerType: 'touch',
								isPrimary: false
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 140,
								clientY: 200,
								pointerId: 1,
								pointerType: 'touch'
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 260,
								clientY: 200,
								pointerId: 2,
								pointerType: 'touch'
							});
							dispatchPointer(img, 'pointerup', {
								clientX: 140,
								clientY: 200,
								pointerId: 1,
								pointerType: 'touch'
							});
							dispatchPointer(img, 'pointerup', {
								clientX: 260,
								clientY: 200,
								pointerId: 2,
								pointerType: 'touch'
							});
						});
						expect(ref.current!.zoom).toBe(4);
					});
				});

				it('lets a new pinch take over the under-min settle mid-flight (no freeze between pinch-ins)', () => {
					withViewport(() => {
						const ref = createZoomRef();
						renderZoomPan(ref);
						const img = screen.getByTestId('zoom-img');
						setupOverflowGeometry(img);

						// Hold the baked settle WAAPI open with a scrubbable clock.
						const held: Array<{
							cancel: ReturnType<typeof vi.fn>;
							onfinish: (() => void) | null;
							currentTime: number;
							duration: number;
						}> = [];
						Element.prototype.animate = vi.fn(
							(_keyframes: unknown, opts?: number | KeyframeAnimationOptions) => {
								const anim = {
									finished: new Promise<void>(() => {}),
									cancel: vi.fn(),
									play: vi.fn(),
									pause: vi.fn(),
									onfinish: null as (() => void) | null,
									oncancel: null as (() => void) | null,
									commitStyles: vi.fn(),
									currentTime: 0,
									duration:
										typeof opts === 'object' ? Number(opts?.duration ?? 0) : Number(opts ?? 0)
								};
								held.push(anim);
								return anim;
							}
						) as unknown as typeof Element.prototype.animate;

						// Pinch in past minZoom (elastic under-zoom).
						act(() => {
							dispatchPointer(img, 'pointerdown', {
								clientX: 100,
								clientY: 200,
								pointerId: 1,
								pointerType: 'touch',
								isPrimary: true
							});
							dispatchPointer(img, 'pointerdown', {
								clientX: 300,
								clientY: 200,
								pointerId: 2,
								pointerType: 'touch',
								isPrimary: false
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 180,
								clientY: 200,
								pointerId: 1,
								pointerType: 'touch'
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 220,
								clientY: 200,
								pointerId: 2,
								pointerType: 'touch'
							});
						});
						const elastic = ref.current!.zoom;
						expect(elastic).toBeLessThan(1);

						// Release both fingers: the snap-back bakes into a compositor
						// settle. Rest commits on WAAPI finish — live pose stays under-min
						// at t=0 so a follow-up pinch can catch mid-trajectory.
						act(() => {
							dispatchPointer(img, 'pointerup', {
								clientX: 180,
								clientY: 200,
								pointerId: 1,
								pointerType: 'touch'
							});
							dispatchPointer(img, 'pointerup', {
								clientX: 220,
								clientY: 200,
								pointerId: 2,
								pointerType: 'touch'
							});
						});
						expect(held.length).toBeGreaterThan(0);
						const settleAnim = held[held.length - 1]!;
						expect(settleAnim.duration).toBeGreaterThan(0);
						expect(ref.current!.zoom).toBeLessThan(1);

						// Scrub the settle mid-flight, then pinch again — the downs must
						// catch it at the LIVE pose recovered from the baked trajectory
						// (no jump to 1×), and the pinch scales from there.
						settleAnim.currentTime = settleAnim.duration / 2;
						act(() => {
							dispatchPointer(img, 'pointerdown', {
								clientX: 100,
								clientY: 200,
								pointerId: 3,
								pointerType: 'touch',
								isPrimary: true
							});
							dispatchPointer(img, 'pointerdown', {
								clientX: 300,
								clientY: 200,
								pointerId: 4,
								pointerType: 'touch',
								isPrimary: false
							});
						});
						const mid = ref.current!.zoom;
						expect(mid).toBeGreaterThan(elastic);
						expect(mid).toBeLessThan(1);

						act(() => {
							dispatchPointer(img, 'pointermove', {
								clientX: 170,
								clientY: 200,
								pointerId: 3,
								pointerType: 'touch'
							});
							dispatchPointer(img, 'pointermove', {
								clientX: 230,
								clientY: 200,
								pointerId: 4,
								pointerType: 'touch'
							});
						});
						expect(ref.current!.zoom).toBeLessThan(mid);
					});
				});
			});
		});
	});
});
