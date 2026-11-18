// Port of ramka's `lightbox.test.tsx` › `describe('Lightbox')` › `describe('view transitions')`.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { LightboxZoomContext } from '../../lib/lightbox/LightboxZoom.svelte';
import { mockTouchDevice } from './lightbox-suite-env';
import TestLightbox from './fixtures/TestLightbox.svelte';
import InterleavedRoots from './fixtures/view-transitions/InterleavedRoots.svelte';
import MorphLightbox from './fixtures/view-transitions/MorphLightbox.svelte';
import { act, cleanup, fireEvent, render, screen } from './test-utils';

type VtCallback = () => void | Promise<void>;

describe('Lightbox', () => {
	describe('view transitions', () => {
		beforeEach(async () => {
			const { loadMorphRuntime } = await import('../../lib/lightbox/lightbox-morph-loader');
			await loadMorphRuntime();
		});

		function mockViewTransitionAPI() {
			let resolveFinished: () => void;
			const finishedPromise = new Promise<void>((r) => {
				resolveFinished = r;
			});

			const startViewTransition = vi.fn((callback: VtCallback) => {
				const result = callback();
				if (result && typeof (result as Promise<void>).then === 'function') {
					(result as Promise<void>).catch(vi.fn());
				}
				return { finished: finishedPromise };
			});

			Object.defineProperty(document, 'startViewTransition', {
				value: startViewTransition,
				writable: true,
				configurable: true
			});

			return { startViewTransition, resolveFinished: () => resolveFinished() };
		}

		function cleanupViewTransitionAPI() {
			delete (document as unknown as Record<string, unknown>).startViewTransition;
			document.documentElement.removeAttribute('data-ramka-view-transition');
			document.documentElement.removeAttribute('data-ramka-crossfade');
			document.documentElement.removeAttribute('data-ramka-vt-preset');
			document.documentElement.removeAttribute('data-ramka-vt-isolate');
			document.documentElement.style.removeProperty('--lightbox-morph-border-radius-from');
			document.documentElement.style.removeProperty('--lightbox-morph-border-radius-to');
			document.documentElement.style.removeProperty('--lightbox-morph-old-opacity');
			document.documentElement.style.removeProperty('--lightbox-morph-new-opacity');
			document.documentElement.style.removeProperty('--lightbox-vt-duration');
			document.documentElement.style.removeProperty('--lightbox-vt-easing');
			document.documentElement.style.removeProperty('--lightbox-vt-crossfade-close-easing');
			document.documentElement.style.removeProperty('--lightbox-vt-root-easing');
		}

		/** A mock whose first call (open) and later calls (close) get separate `finished` promises. */
		function mockOpenCloseVT(onCall?: (call: number) => void) {
			let resolveOpen: () => void;
			let resolveClose: () => void;

			const startViewTransition = vi.fn((callback: VtCallback) => {
				const result = callback();
				onCall?.(startViewTransition.mock.calls.length);
				if (result && typeof (result as Promise<void>).then === 'function') {
					(result as Promise<void>).catch(vi.fn());
				}
				if (startViewTransition.mock.calls.length === 1) {
					return {
						finished: new Promise<void>((r) => {
							resolveOpen = r;
						})
					};
				}
				return {
					finished: new Promise<void>((r) => {
						resolveClose = r;
					})
				};
			});

			Object.defineProperty(document, 'startViewTransition', {
				value: startViewTransition,
				writable: true,
				configurable: true
			});

			return {
				startViewTransition,
				resolveOpen: () => resolveOpen!(),
				resolveClose: () => resolveClose!()
			};
		}

		afterEach(() => {
			cleanupViewTransitionAPI();
		});

		it('falls back gracefully when viewTransition=true but API is absent', () => {
			render(TestLightbox, { viewTransition: true });
			fireEvent.click(screen.getByTestId('trigger-0'));
			expect(screen.getByTestId('content')).toBeInTheDocument();
		});

		it('calls document.startViewTransition on open', () => {
			const { startViewTransition } = mockViewTransitionAPI();
			render(TestLightbox, { viewTransition: true });
			fireEvent.click(screen.getByTestId('trigger-0'));
			expect(startViewTransition).toHaveBeenCalledOnce();
		});

		it('does not start a view transition when viewTransition is false', () => {
			const { startViewTransition } = mockViewTransitionAPI();
			render(TestLightbox, { viewTransition: false });
			fireEvent.click(screen.getByTestId('trigger-0'));
			expect(startViewTransition).not.toHaveBeenCalled();
			expect(screen.getByTestId('content')).toBeInTheDocument();
		});

		it('sets data-ramka-view-transition on <html> during open', () => {
			mockViewTransitionAPI();
			render(TestLightbox, { viewTransition: true });
			fireEvent.click(screen.getByTestId('trigger-0'));
			expect(document.documentElement).toHaveAttribute('data-ramka-view-transition');
		});

		it('removes data-ramka-view-transition after open transition finishes', async () => {
			const { resolveFinished } = mockViewTransitionAPI();
			render(TestLightbox, { viewTransition: true });
			fireEvent.click(screen.getByTestId('trigger-0'));
			expect(document.documentElement).toHaveAttribute('data-ramka-view-transition');

			await act(async () => resolveFinished());
			expect(document.documentElement).not.toHaveAttribute('data-ramka-view-transition');
		});

		it('defers the user-select guard until the open morph finishes', async () => {
			// `user-select` is inherited: writing it on <html> inside the capture
			// window forces a full-document restyle. The VT open locks scroll at
			// reveal but applies the selection guard only in handleOpenComplete.
			const restoreTouch = mockTouchDevice();
			try {
				const { resolveFinished } = mockViewTransitionAPI();
				render(TestLightbox, { viewTransition: true });
				fireEvent.click(screen.getByTestId('trigger-0'));
				// Scroll is locked from the reveal, but selection stays untouched…
				expect(document.documentElement.style.overflow).toBe('hidden');
				expect(document.documentElement.style.userSelect).toBe('');

				// …until the morph settles.
				await act(async () => resolveFinished());
				expect(document.documentElement.style.userSelect).toBe('none');
			} finally {
				restoreTouch();
			}
		});

		it('does not arm name isolation on a page without foreign view-transition-names', () => {
			// Arming flips a root attribute a universal descendant rule keys on —
			// a whole-document restyle the common (name-free) page must never pay.
			mockViewTransitionAPI();
			render(TestLightbox, { viewTransition: true });
			fireEvent.click(screen.getByTestId('trigger-0'));
			expect(document.documentElement).toHaveAttribute('data-ramka-view-transition');
			expect(document.documentElement).not.toHaveAttribute('data-ramka-vt-isolate');
		});

		it('arms name isolation when the page declares a foreign view-transition-name', async () => {
			const foreign = document.createElement('div');
			foreign.setAttribute('style', 'view-transition-name: consumer-hero');
			document.body.appendChild(foreign);
			try {
				const { resolveFinished } = mockViewTransitionAPI();
				render(TestLightbox, { viewTransition: true });
				fireEvent.click(screen.getByTestId('trigger-0'));
				expect(document.documentElement).toHaveAttribute('data-ramka-vt-isolate');

				await act(async () => resolveFinished());
				expect(document.documentElement).not.toHaveAttribute('data-ramka-vt-isolate');
			} finally {
				foreign.remove();
			}
		});

		it('cleans up CSS custom properties after open transition finishes', async () => {
			const { resolveFinished } = mockViewTransitionAPI();
			render(TestLightbox, { viewTransition: true });
			fireEvent.click(screen.getByTestId('trigger-0'));

			await act(async () => resolveFinished());
			const docStyle = document.documentElement.style;
			expect(docStyle.getPropertyValue('--lightbox-morph-border-radius-from')).toBe('');
			expect(docStyle.getPropertyValue('--lightbox-morph-border-radius-to')).toBe('');
			expect(docStyle.getPropertyValue('--lightbox-vt-duration')).toBe('');
			expect(docStyle.getPropertyValue('--lightbox-vt-easing')).toBe('');
			expect(docStyle.getPropertyValue('--lightbox-vt-crossfade-close-easing')).toBe('');
			expect(docStyle.getPropertyValue('--lightbox-vt-root-easing')).toBe('');
		});

		it('publishes the default timing preset as the vt-preset attribute during morph', async () => {
			// Timing vars are no longer written inline on <html> — inherited
			// custom-property writes on the root are a full-document restyle in
			// WebKit. The attribute keys static per-preset rules on the
			// ::view-transition pseudo (see vt-structural-styles.ts).
			const { resolveFinished } = mockViewTransitionAPI();
			render(TestLightbox, { viewTransition: true });

			fireEvent.click(screen.getByTestId('trigger-0'));
			const docEl = document.documentElement;
			expect(docEl).toHaveAttribute('data-ramka-vt-preset', 'default');
			expect(docEl.style.getPropertyValue('--lightbox-vt-duration')).toBe('');

			const structural = document.querySelector('style[data-ramka-lightbox-vt-styles]');
			expect(structural?.textContent).toContain(
				':root[data-ramka-vt-preset="default"]::view-transition'
			);
			expect(structural?.textContent).toContain('--lightbox-vt-duration: 360ms');

			await act(async () => resolveFinished());
			expect(docEl).not.toHaveAttribute('data-ramka-vt-preset');
		});

		it('writes a named timing preset (viewTransition="spring") onto documentElement', async () => {
			const { resolveFinished } = mockViewTransitionAPI();
			render(MorphLightbox, {
				root: { viewTransition: 'spring' },
				trigger: 'image',
				contentProps: { 'data-testid': 'content', 'aria-label': 'vt preset test' },
				close: 'content-end'
			});

			fireEvent.click(screen.getByTestId('trigger-0'));
			const docEl = document.documentElement;
			expect(docEl).toHaveAttribute('data-ramka-vt-preset', 'spring');

			const structural = document.querySelector('style[data-ramka-lightbox-vt-styles]');
			expect(structural?.textContent).toContain(
				':root[data-ramka-vt-preset="spring"]::view-transition'
			);
			expect(structural?.textContent).toContain('--lightbox-vt-duration: 450ms');

			await act(async () => resolveFinished());
			expect(docEl).not.toHaveAttribute('data-ramka-vt-preset');
		});

		it('always publishes the preset timing vars on the Portal host (skin motion clock)', async () => {
			// Skins read `--lightbox-vt-*` for their non-VT open/close fades, so the
			// Portal host must carry them whenever it is mounted — including after
			// the morph's documentElement promotion has been cleaned up.
			const { resolveFinished } = mockViewTransitionAPI();
			render(MorphLightbox, {
				root: { viewTransition: 'spring' },
				trigger: 'image',
				portalProps: { 'data-testid': 'portal' },
				contentProps: { 'data-testid': 'content', 'aria-label': 'portal vars test' },
				close: 'content-end'
			});

			fireEvent.click(screen.getByTestId('trigger-0'));
			await act(async () => resolveFinished());

			const host = document.querySelector('[data-ramka-portal]') as HTMLElement;
			expect(host).not.toBeNull();
			expect(host.style.getPropertyValue('--lightbox-vt-duration')).toBe('450ms');
			expect(host.style.getPropertyValue('--lightbox-vt-easing')).toBe(
				'cubic-bezier(0.22, 1, 0.36, 1)'
			);
			expect(host.style.getPropertyValue('--lightbox-vt-root-easing')).toBe(
				'cubic-bezier(0.16, 1, 0.3, 1)'
			);
			// documentElement promotion is transition-scoped and already gone.
			expect(document.documentElement.style.getPropertyValue('--lightbox-vt-duration')).toBe('');
		});

		it('a stale transition finalizer cannot wipe a newer morph state (interleaved Roots)', async () => {
			// Per-transition finished promises — starting a new document transition
			// skips the active one, whose finalizer then runs AFTER the new morph
			// has promoted its state. The stale finalizer must be a no-op.
			const resolvers: Array<() => void> = [];
			Object.defineProperty(document, 'startViewTransition', {
				value: vi.fn((callback: VtCallback) => {
					const finished = new Promise<void>((r) => resolvers.push(r));
					const result = callback();
					if (result && typeof (result as Promise<void>).then === 'function') {
						(result as Promise<void>).catch(vi.fn());
					}
					return { finished };
				}),
				writable: true,
				configurable: true
			});

			// Svelte: React's fragment of two `makeLightbox(id, preset)` trees is a fixture.
			render(InterleavedRoots);
			const docEl = document.documentElement;

			// Open A (transition #1), then B while A is still unfinished (#2).
			fireEvent.click(screen.getByTestId('a-trigger'));
			expect(docEl).toHaveAttribute('data-ramka-vt-preset', 'snappy');
			fireEvent.click(screen.getByTestId('b-trigger'));
			expect(docEl).toHaveAttribute('data-ramka-vt-preset', 'spring');

			// A's transition settles late — B's promoted state must survive.
			await act(async () => resolvers[0]!());
			expect(docEl).toHaveAttribute('data-ramka-view-transition', 'opening');
			expect(docEl).toHaveAttribute('data-ramka-vt-preset', 'spring');

			// B's own finalizer still cleans up normally.
			await act(async () => resolvers[1]!());
			expect(docEl).not.toHaveAttribute('data-ramka-view-transition');
			expect(docEl).not.toHaveAttribute('data-ramka-vt-preset');

			// Both Roots are left open, so their scroll locks overlap: each saved
			// the other's `overflow` as its "original", and unmount restore order
			// would leak `overflow: hidden` into later tests. Reset explicitly.
			cleanup();
			docEl.style.overflow = '';
			docEl.style.userSelect = '';
			docEl.style.removeProperty('-webkit-user-select');
			document.body.style.paddingRight = '';
		});

		it('fires onOpenChangeComplete(true) after VT open finishes', async () => {
			const { resolveFinished } = mockViewTransitionAPI();
			const completeSpy = vi.fn();
			render(TestLightbox, { viewTransition: true, onOpenChangeComplete: completeSpy });
			fireEvent.click(screen.getByTestId('trigger-0'));
			expect(completeSpy).not.toHaveBeenCalled();

			await act(async () => resolveFinished());
			expect(completeSpy).toHaveBeenCalledWith(true);
		});

		it('calls startViewTransition on close', async () => {
			const { startViewTransition, resolveFinished } = mockViewTransitionAPI();
			render(TestLightbox, { viewTransition: true, defaultOpen: true });
			startViewTransition.mockClear();

			fireEvent.click(screen.getByTestId('close'));
			expect(startViewTransition).toHaveBeenCalledOnce();

			await act(async () => resolveFinished());
		});

		it('Firefox: resets zoom instantly before close view transition capture when zoomed', () => {
			// Firefox clips zoomed Media into the named VT snapshot; reset(true) before
			// startViewTransition. Chrome/Safari keep the live zoomed pose.
			const originalUa = navigator.userAgent;
			Object.defineProperty(navigator, 'userAgent', {
				configurable: true,
				value: 'Mozilla/5.0 (Macintosh; rv:153.0) Gecko/20100101 Firefox/153.0'
			});

			// Svelte: the Zoom context stands in for React's `LightboxZoomRef`.
			const zoomRef: { current: LightboxZoomContext | null } = { current: null };
			let zoomAtOldSnapshot = -1;
			const startViewTransition = vi.fn((callback: VtCallback) => {
				zoomAtOldSnapshot = zoomRef.current?.zoom ?? -1;
				const result = callback();
				if (result && typeof (result as Promise<void>).then === 'function') {
					(result as Promise<void>).catch(vi.fn());
				}
				return { finished: Promise.resolve() };
			});
			Object.defineProperty(document, 'startViewTransition', {
				value: startViewTransition,
				writable: true,
				configurable: true
			});

			try {
				render(MorphLightbox, {
					root: { viewTransition: true, open: true, awaitImageDecode: false },
					trigger: 'text',
					contentProps: { 'data-testid': 'content', 'aria-label': 'zoomed close morph' },
					close: 'content-start',
					item: 'zoom-media',
					itemProps: { 'data-testid': 'item-0' },
					zoomProps: { maxZoom: 4 },
					onzoom: (zoom) => (zoomRef.current = zoom)
				});

				act(() => zoomRef.current!.zoomTo(3, { rapid: true }));
				expect(zoomRef.current!.zoom).toBeGreaterThan(1);

				startViewTransition.mockClear();
				fireEvent.click(screen.getByTestId('close'));

				expect(startViewTransition).toHaveBeenCalledOnce();
				// Captured before the VT callback unmounts Zoom — must already be resting.
				expect(zoomAtOldSnapshot).toBe(1);
			} finally {
				Object.defineProperty(navigator, 'userAgent', {
					configurable: true,
					value: originalUa
				});
			}
		});

		it('does not reset zoom before close view transition outside Firefox', () => {
			const originalUa = navigator.userAgent;
			Object.defineProperty(navigator, 'userAgent', {
				configurable: true,
				value: 'Mozilla/5.0 (Macintosh; Chrome/120.0.0.0)'
			});

			// Svelte: the Zoom context stands in for React's `LightboxZoomRef`.
			const zoomRef: { current: LightboxZoomContext | null } = { current: null };
			let zoomAtOldSnapshot = -1;
			const startViewTransition = vi.fn((callback: VtCallback) => {
				zoomAtOldSnapshot = zoomRef.current?.zoom ?? -1;
				const result = callback();
				if (result && typeof (result as Promise<void>).then === 'function') {
					(result as Promise<void>).catch(vi.fn());
				}
				return { finished: Promise.resolve() };
			});
			Object.defineProperty(document, 'startViewTransition', {
				value: startViewTransition,
				writable: true,
				configurable: true
			});

			try {
				render(MorphLightbox, {
					root: { viewTransition: true, open: true, awaitImageDecode: false },
					trigger: 'text',
					contentProps: { 'data-testid': 'content', 'aria-label': 'zoomed close chromelike' },
					close: 'content-start',
					item: 'zoom-media',
					itemProps: { 'data-testid': 'item-0' },
					zoomProps: { maxZoom: 4 },
					onzoom: (zoom) => (zoomRef.current = zoom)
				});

				act(() => zoomRef.current!.zoomTo(3, { rapid: true }));
				expect(zoomRef.current!.zoom).toBe(3);

				startViewTransition.mockClear();
				fireEvent.click(screen.getByTestId('close'));

				expect(startViewTransition).toHaveBeenCalledOnce();
				expect(zoomAtOldSnapshot).toBe(3);
			} finally {
				Object.defineProperty(navigator, 'userAgent', {
					configurable: true,
					value: originalUa
				});
			}
		});

		it('close without a trigger falls back to root crossfade (no item morph name)', () => {
			// Controlled/defaultOpen with no Trigger: naming the item alone would lift
			// it out of the root snapshot so chrome fades while the photo sticks.
			let namedDuringCapture = 'unset';
			const startViewTransition = vi.fn((callback: VtCallback) => {
				const img = screen.getByTestId('item-0').querySelector('img');
				namedDuringCapture = img?.style.getPropertyValue('view-transition-name') ?? '';
				const result = callback();
				if (result && typeof (result as Promise<void>).then === 'function') {
					(result as Promise<void>).catch(vi.fn());
				}
				return { finished: Promise.resolve() };
			});
			Object.defineProperty(document, 'startViewTransition', {
				value: startViewTransition,
				writable: true,
				configurable: true
			});

			render(MorphLightbox, {
				root: { viewTransition: true, open: true, awaitImageDecode: false },
				trigger: 'none',
				contentProps: { 'data-testid': 'content', 'aria-label': 'no-trigger close' },
				close: 'content-start',
				item: 'image',
				itemProps: { 'data-testid': 'item-0' },
				itemImageSrc: 'a.jpg',
				itemImageAlt: 'a'
			});

			fireEvent.click(screen.getByTestId('close'));
			expect(startViewTransition).toHaveBeenCalledOnce();
			expect(namedDuringCapture).toBe('');
			expect(document.documentElement).toHaveAttribute('data-ramka-view-transition', 'closing');
			// No trigger end → plain root crossfade (not a hard-cut morph).
			expect(document.documentElement).toHaveAttribute('data-ramka-crossfade');
		});

		it('removes data-ramka-view-transition after close transition finishes', async () => {
			const { resolveOpen, resolveClose } = mockOpenCloseVT();

			render(TestLightbox, { viewTransition: true });
			fireEvent.click(screen.getByTestId('trigger-0'));
			await act(async () => resolveOpen());

			fireEvent.click(screen.getByTestId('close'));
			expect(document.documentElement).toHaveAttribute('data-ramka-view-transition');

			await act(async () => resolveClose());
			expect(document.documentElement).not.toHaveAttribute('data-ramka-view-transition');
		});

		it('unmounts Content inside the VT close update callback', async () => {
			// Safari / desktop Chrome: unnamed position:fixed chrome only fades
			// with ::view-transition-old(root) if it is gone from the live tree.
			// Extra named groups on Content are not an option — WebKit
			// CPU-rasterizes each, and Content is fullscreen.
			let contentDuringCloseUpdate: boolean | null = null;
			const { resolveOpen, resolveClose } = mockOpenCloseVT((call) => {
				if (call === 2) contentDuringCloseUpdate = !!screen.queryByTestId('content');
			});

			render(TestLightbox, { viewTransition: true });
			fireEvent.click(screen.getByTestId('trigger-0'));
			await act(async () => resolveOpen());

			fireEvent.click(screen.getByTestId('close'));
			expect(contentDuringCloseUpdate).toBe(false);
			expect(screen.queryByTestId('content')).not.toBeInTheDocument();

			await act(async () => resolveClose());
			expect(screen.queryByTestId('content')).not.toBeInTheDocument();
		});

		it('Android Chrome: keeps Content mounted (paint-suppressed) until the VT close finishes', async () => {
			const originalChrome = (window as unknown as { chrome?: unknown }).chrome;
			const originalUaData = (navigator as Navigator & { userAgentData?: unknown }).userAgentData;
			(window as unknown as { chrome: object }).chrome = {};
			Object.defineProperty(navigator, 'userAgentData', {
				configurable: true,
				value: { mobile: true }
			});

			let contentDuringCloseUpdate: boolean | null = null;
			const { resolveOpen, resolveClose } = mockOpenCloseVT((call) => {
				if (call === 2) contentDuringCloseUpdate = !!screen.queryByTestId('content');
			});

			try {
				render(TestLightbox, { viewTransition: true });
				fireEvent.click(screen.getByTestId('trigger-0'));
				await act(async () => resolveOpen());

				fireEvent.click(screen.getByTestId('close'));
				expect(contentDuringCloseUpdate).toBe(true);
				expect(screen.getByTestId('content')).toBeInTheDocument();
				expect(screen.getByTestId('content')).toHaveStyle({ visibility: 'hidden' });

				await act(async () => resolveClose());
				expect(screen.queryByTestId('content')).not.toBeInTheDocument();
			} finally {
				if (originalChrome === undefined) {
					delete (window as unknown as { chrome?: unknown }).chrome;
				} else {
					(window as unknown as { chrome?: unknown }).chrome = originalChrome;
				}
				if (originalUaData === undefined) {
					delete (navigator as Navigator & { userAgentData?: unknown }).userAgentData;
				} else {
					Object.defineProperty(navigator, 'userAgentData', {
						configurable: true,
						value: originalUaData
					});
				}
			}
		});

		it('keeps the page scroll locked until the VT close transition finishes', async () => {
			const { resolveOpen, resolveClose } = mockOpenCloseVT();

			render(TestLightbox, { viewTransition: true });
			fireEvent.click(screen.getByTestId('trigger-0'));
			await act(async () => resolveOpen());

			// Open: page scroll is locked.
			expect(document.documentElement.style.overflow).toBe('hidden');

			// Close starts — but the transition hasn't finished yet, so the lock must
			// still hold (otherwise the page scrolls behind the closing animation).
			fireEvent.click(screen.getByTestId('close'));
			expect(document.documentElement.style.overflow).toBe('hidden');

			// Only once the close transition finishes is scrolling restored.
			await act(async () => resolveClose());
			expect(document.documentElement.style.overflow).toBe('');
		});

		it('fires onOpenChangeComplete(false) after VT close finishes', async () => {
			const { resolveOpen, resolveClose } = mockOpenCloseVT();

			const completeSpy = vi.fn();
			render(TestLightbox, { viewTransition: true, onOpenChangeComplete: completeSpy });
			fireEvent.click(screen.getByTestId('trigger-0'));
			await act(async () => resolveOpen());
			completeSpy.mockClear();

			fireEvent.click(screen.getByTestId('close'));
			expect(completeSpy).not.toHaveBeenCalled();

			await act(async () => resolveClose());
			expect(completeSpy).toHaveBeenCalledWith(false);
		});

		describe('image decode before open transition', () => {
			it('does not delay open when item has no real image to decode', () => {
				const { startViewTransition } = mockViewTransitionAPI();

				render(TestLightbox, { viewTransition: true });
				fireEvent.click(screen.getByTestId('trigger-0'));

				expect(startViewTransition).toHaveBeenCalledOnce();
				expect(screen.getByTestId('content')).toBeInTheDocument();
			});

			it('passes a synchronous callback to startViewTransition on open', () => {
				const { startViewTransition } = mockViewTransitionAPI();

				render(TestLightbox, { viewTransition: true });
				fireEvent.click(screen.getByTestId('trigger-0'));

				expect(startViewTransition).toHaveBeenCalledOnce();
				// The decode wait happens BEFORE startViewTransition, so the update
				// callback is synchronous: the browser captures old -> runs the
				// callback -> captures new in one uninterrupted rendering update, with
				// no intermediate paint (which otherwise flashes an empty frame).
				const callback = startViewTransition.mock.calls[0][0];
				expect(callback.constructor.name).not.toBe('AsyncFunction');
			});

			it('both open and close VT callbacks are synchronous (decode waited before open)', async () => {
				const { startViewTransition, resolveOpen, resolveClose } = mockOpenCloseVT();

				render(TestLightbox, { viewTransition: true });
				fireEvent.click(screen.getByTestId('trigger-0'));
				await act(async () => resolveOpen());

				fireEvent.click(screen.getByTestId('close'));

				const callbacks = startViewTransition.mock.calls.map(([cb]) => cb);
				expect(callbacks).toHaveLength(2);
				expect(callbacks[0].constructor.name).not.toBe('AsyncFunction');
				expect(callbacks[1].constructor.name).not.toBe('AsyncFunction');

				await act(async () => resolveClose());
			});
		});

		describe('awaitImageDecode', () => {
			let originalDecode: PropertyDescriptor | undefined;
			let originalComplete: PropertyDescriptor | undefined;

			// Force a real <img> to look "not yet loaded" and route decode() through
			// a controllable mock, so the open morph's decode wait is deterministic
			// regardless of jsdom's image loading behavior.
			function setImageEnv(decodeImpl: () => Promise<void>) {
				originalDecode = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'decode');
				originalComplete = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'complete');
				Object.defineProperty(HTMLImageElement.prototype, 'decode', {
					value: vi.fn(decodeImpl),
					writable: true,
					configurable: true
				});
				Object.defineProperty(HTMLImageElement.prototype, 'complete', {
					get: () => false,
					configurable: true
				});
				return HTMLImageElement.prototype.decode as unknown as ReturnType<typeof vi.fn>;
			}

			afterEach(() => {
				if (originalDecode) {
					Object.defineProperty(HTMLImageElement.prototype, 'decode', originalDecode);
				} else {
					delete (HTMLImageElement.prototype as unknown as Record<string, unknown>).decode;
				}
				if (originalComplete) {
					Object.defineProperty(HTMLImageElement.prototype, 'complete', originalComplete);
				}
				originalDecode = undefined;
				originalComplete = undefined;
				vi.useRealTimers();
			});

			function renderImageLightbox(awaitImageDecode?: boolean | number) {
				return render(MorphLightbox, {
					root: { viewTransition: true, awaitImageDecode },
					trigger: 'text',
					contentProps: { 'data-testid': 'content', 'aria-label': 'decode test' },
					item: 'plain-image',
					itemProps: { 'data-testid': 'item-0' }
				});
			}

			it('skips the decode wait entirely when awaitImageDecode={false}', () => {
				mockViewTransitionAPI();
				const decode = setImageEnv(() => new Promise<void>(() => {}));

				renderImageLightbox(false);
				fireEvent.click(screen.getByTestId('trigger-0'));

				// Opt-out: decode() is never invoked and the item is marked ready
				// synchronously, so the morph starts without waiting.
				expect(decode).not.toHaveBeenCalled();
				expect(screen.getByTestId('item-0')).toHaveAttribute('data-skip-fade');
			});

			it('awaits the destination image decode by default', () => {
				vi.useFakeTimers();
				mockViewTransitionAPI();
				const decode = setImageEnv(() => new Promise<void>(() => {}));

				renderImageLightbox();
				fireEvent.click(screen.getByTestId('trigger-0'));

				// The wait is in flight: decode was attempted and the item is not yet
				// marked ready (still awaiting decode or the timeout).
				expect(decode).toHaveBeenCalledTimes(1);
				expect(screen.getByTestId('item-0')).not.toHaveAttribute('data-skip-fade');
			});

			it('bounds the wait by the numeric timeout', async () => {
				vi.useFakeTimers();
				mockViewTransitionAPI();
				setImageEnv(() => new Promise<void>(() => {})); // decode never resolves

				renderImageLightbox(50);
				fireEvent.click(screen.getByTestId('trigger-0'));

				// Still waiting before the cap elapses.
				expect(screen.getByTestId('item-0')).not.toHaveAttribute('data-skip-fade');

				await act(async () => {
					vi.advanceTimersByTime(50);
				});

				// The timeout bounded the wait; the morph proceeds.
				expect(screen.getByTestId('item-0')).toHaveAttribute('data-skip-fade');
			});
		});

		describe('onBeforeOpen', () => {
			it('runs after prepare and delays the View Transition until the promise settles', async () => {
				const { startViewTransition } = mockViewTransitionAPI();
				let resolveReady!: () => void;
				const ready = new Promise<void>((r) => {
					resolveReady = r;
				});
				const onBeforeOpen = vi.fn(() => ready);

				render(MorphLightbox, {
					root: { viewTransition: true, awaitImageDecode: false, onBeforeOpen },
					trigger: 'text',
					contentProps: { 'data-testid': 'content', 'aria-label': 'before-open test' },
					item: 'text',
					itemProps: { 'data-testid': 'item-0' }
				});

				fireEvent.click(screen.getByTestId('trigger-0'));

				// Prepared (item in DOM) but VT not started until onBeforeOpen resolves.
				expect(onBeforeOpen).toHaveBeenCalledOnce();
				expect(onBeforeOpen).toHaveBeenCalledWith(
					expect.objectContaining({
						destination: expect.any(Element),
						signal: expect.any(AbortSignal)
					})
				);
				expect(startViewTransition).not.toHaveBeenCalled();
				expect(screen.getByTestId('item-0')).not.toHaveAttribute('data-skip-fade');

				await act(async () => {
					resolveReady();
					await ready;
				});

				expect(startViewTransition).toHaveBeenCalledOnce();
				expect(screen.getByTestId('item-0')).toHaveAttribute('data-skip-fade');
			});

			it('aborts the signal when a close supersedes the pending open', async () => {
				mockViewTransitionAPI();
				let seenSignal: AbortSignal | undefined;
				const onBeforeOpen = vi.fn(({ signal }: { signal: AbortSignal }) => {
					seenSignal = signal;
					return new Promise<void>(() => {});
				});

				render(MorphLightbox, {
					root: { viewTransition: true, awaitImageDecode: false, onBeforeOpen },
					trigger: 'text',
					contentProps: { 'data-testid': 'content', 'aria-label': 'before-open abort test' },
					item: 'text',
					itemProps: { 'data-testid': 'item-0' },
					close: 'root'
				});

				fireEvent.click(screen.getByTestId('trigger-0'));
				expect(onBeforeOpen).toHaveBeenCalledOnce();
				expect(seenSignal?.aborted).toBe(false);

				await act(async () => {
					fireEvent.click(screen.getByTestId('close'));
				});

				expect(seenSignal?.aborted).toBe(true);
			});
		});

		describe('onBeforeClose', () => {
			it('runs before the close View Transition starts', async () => {
				const { startViewTransition } = mockViewTransitionAPI();
				const onBeforeClose = vi.fn();

				render(MorphLightbox, {
					root: { viewTransition: true, awaitImageDecode: false, onBeforeClose },
					trigger: 'text',
					contentProps: { 'data-testid': 'content', 'aria-label': 'before-close test' },
					item: 'text',
					itemProps: { 'data-testid': 'item-0' },
					close: 'content-end'
				});

				fireEvent.click(screen.getByTestId('trigger-0'));
				await act(async () => {});

				expect(onBeforeClose).not.toHaveBeenCalled();
				const callsAfterOpen = startViewTransition.mock.calls.length;
				expect(callsAfterOpen).toBeGreaterThan(0);

				fireEvent.click(screen.getByTestId('close'));

				expect(onBeforeClose).toHaveBeenCalledOnce();
				expect(onBeforeClose).toHaveBeenCalledWith(
					expect.objectContaining({
						destination: expect.any(Element)
					})
				);
				expect(startViewTransition.mock.calls.length).toBeGreaterThan(callsAfterOpen);
			});
		});

		describe('morph fallback when destination target has no resolvable size', () => {
			let originalRect: PropertyDescriptor | undefined;

			// jsdom has no layout, so every getBoundingClientRect is 0×0. Force the
			// morph target's rendered box to a fixed size to model whether the layout
			// is reserved (loaded image, or explicit width/height / CSS dimensions
			// like a Next.js <Image>) vs. a collapsed 0×0 unsized-and-unloaded image.
			function mockTargetBox(sized: boolean) {
				originalRect = Object.getOwnPropertyDescriptor(
					HTMLImageElement.prototype,
					'getBoundingClientRect'
				);
				const w = sized ? 800 : 0;
				const h = sized ? 600 : 0;
				Object.defineProperty(HTMLImageElement.prototype, 'getBoundingClientRect', {
					value: () => ({
						width: w,
						height: h,
						top: 0,
						left: 0,
						right: w,
						bottom: h,
						x: 0,
						y: 0,
						toJSON() {}
					}),
					writable: true,
					configurable: true
				});
			}

			afterEach(() => {
				if (originalRect) {
					Object.defineProperty(HTMLImageElement.prototype, 'getBoundingClientRect', originalRect);
				}
				originalRect = undefined;
			});

			function renderImageLightbox() {
				// awaitImageDecode={false} keeps the open path synchronous so the VT
				// callback (which assigns the item morph name) runs during the click.
				return render(MorphLightbox, {
					root: { viewTransition: true, awaitImageDecode: false },
					trigger: 'text',
					contentProps: { 'data-testid': 'content', 'aria-label': 'morph fallback test' },
					item: 'image',
					itemProps: { 'data-testid': 'item-0' },
					itemImageSrc: 'a.jpg',
					itemImageAlt: 'a'
				});
			}

			it('morphs when the target box is reserved even if the image has not loaded (e.g. Next.js <Image>)', () => {
				mockViewTransitionAPI();
				// Box reserved by layout, but the image itself is unloaded (jsdom never
				// loads it): the morph should still proceed off the resolved box.
				mockTargetBox(true);
				renderImageLightbox();
				fireEvent.click(screen.getByTestId('trigger-0'));

				// Morph path: the destination image gets the morph view-transition-name
				// and hard-cut is applied (crossfade defaults to unset; no data-ramka-crossfade).
				const img = screen.getByTestId('item-0').querySelector('img')!;
				expect(img.style.getPropertyValue('view-transition-name')).toBe('lightbox-morph');
				expect(document.documentElement).not.toHaveAttribute('data-ramka-crossfade');
			});

			it('falls back to a plain crossfade when the target box is 0×0 (unsized image that never loaded)', () => {
				mockViewTransitionAPI();
				mockTargetBox(false);
				renderImageLightbox();
				fireEvent.click(screen.getByTestId('trigger-0'));

				// Fallback path: no morph name (which would shrink the trigger into a
				// 0×0 box) with data-ramka-crossfade — a clean root crossfade instead.
				const img = screen.getByTestId('item-0').querySelector('img')!;
				expect(img.style.getPropertyValue('view-transition-name')).toBe('');
				expect(document.documentElement).toHaveAttribute('data-ramka-crossfade');
				// Still a real View Transition, and the item is still marked ready.
				expect(document.documentElement).toHaveAttribute('data-ramka-view-transition');
				expect(screen.getByTestId('item-0')).toHaveAttribute('data-skip-fade');
			});
		});

		describe('data-morph-target', () => {
			it('sets data-morph-target on the trigger when morphRef is unset', () => {
				render(MorphLightbox, {
					trigger: 'plain-image',
					contentProps: { 'aria-label': 'morph attr test' }
				});

				const trigger = screen.getByTestId('trigger-0');
				expect(trigger).not.toHaveAttribute('data-morph-target');
				fireEvent.click(trigger);
				expect(trigger).toHaveAttribute('data-morph-target');
				// The state key must not also be serialized as `data-morphtarget`.
				expect(trigger).not.toHaveAttribute('data-morphtarget');
			});

			it('hides the active trigger with viewTransition={false} — contractual, not accidental', () => {
				// The hide rule used to live in the VT structural sheet (injected only
				// when a morph started), so non-VT consumers never had CSS matching
				// the attribute. It now ships eagerly from Trigger, which makes
				// "the trigger is visually hidden while its item is active" the
				// contract on EVERY path — viewTransition={false}, unsupported
				// browsers, low-end devices. This test pins that decision: the
				// attribute lands and the hide CSS exists with no morph in sight.
				render(MorphLightbox, {
					root: { viewTransition: false },
					trigger: 'plain-image',
					contentProps: { 'aria-label': 'morph attr test' }
				});

				const trigger = screen.getByTestId('trigger-0');
				fireEvent.click(trigger);
				expect(trigger).toHaveAttribute('data-morph-target');
				// jsdom lacks constructed sheets, so the CSSOM path falls back to a
				// marker <style> in <head> — assert the rule is actually deliverable.
				const hideCss = Array.from(
					document.head.querySelectorAll('style[data-ramka-morph-target-hide], style')
				)
					.map((el) => el.textContent ?? '')
					.join('');
				expect(hideCss).toContain('data-morph-target');
				expect(hideCss).toContain('opacity:0');
			});

			it('sets data-morph-target on the morphRef node, not the trigger', () => {
				render(MorphLightbox, {
					trigger: 'morph-card',
					contentProps: { 'aria-label': 'morph attr test' }
				});

				fireEvent.click(screen.getByTestId('trigger-0'));
				expect(screen.getByTestId('trigger-0')).not.toHaveAttribute('data-morph-target');
				expect(screen.getByTestId('morph-el')).toHaveAttribute('data-morph-target');
				expect(screen.getByTestId('card')).not.toHaveAttribute('data-morph-target');
			});

			it('tolerates an inline combined imageRef+morphRef callback without looping', () => {
				// Svelte: one inline attachment that applies both `image` and `morph`.
				render(MorphLightbox, {
					trigger: 'combined',
					contentProps: { 'aria-label': 'morph attr test' }
				});

				fireEvent.click(screen.getByTestId('trigger-0'));
				expect(screen.getByTestId('morph-el')).toHaveAttribute('data-morph-target');
			});
		});

		describe('crossfade direction', () => {
			let originalRect: PropertyDescriptor | undefined;

			function mockTargetBox() {
				originalRect = Object.getOwnPropertyDescriptor(
					HTMLImageElement.prototype,
					'getBoundingClientRect'
				);
				Object.defineProperty(HTMLImageElement.prototype, 'getBoundingClientRect', {
					value: () => ({
						width: 800,
						height: 600,
						top: 0,
						left: 0,
						right: 800,
						bottom: 600,
						x: 0,
						y: 0,
						toJSON() {}
					}),
					writable: true,
					configurable: true
				});
			}

			afterEach(() => {
				if (originalRect) {
					Object.defineProperty(HTMLImageElement.prototype, 'getBoundingClientRect', originalRect);
				}
				originalRect = undefined;
			});

			function renderCrossfadeLightbox(crossfade?: 'open' | 'close' | 'both') {
				return render(MorphLightbox, {
					root: { viewTransition: true, awaitImageDecode: false },
					trigger: 'image',
					triggerProps: { crossfade },
					contentProps: { 'data-testid': 'content', 'aria-label': 'crossfade test' },
					close: 'content-start',
					item: 'image',
					itemProps: { 'data-testid': 'item-0' }
				});
			}

			it('writes data-crossfade on the trigger for the chosen mode', () => {
				renderCrossfadeLightbox('close');
				expect(screen.getByTestId('trigger-0')).toHaveAttribute('data-crossfade', 'close');
			});

			it('omits data-crossfade when unset', () => {
				renderCrossfadeLightbox();
				expect(screen.getByTestId('trigger-0')).not.toHaveAttribute('data-crossfade');
			});

			it('hard-cuts open when crossfade="close"', () => {
				mockViewTransitionAPI();
				mockTargetBox();
				renderCrossfadeLightbox('close');
				fireEvent.click(screen.getByTestId('trigger-0'));
				expect(document.documentElement).not.toHaveAttribute('data-ramka-crossfade');
			});

			it('crossfades open when crossfade="open"', () => {
				mockViewTransitionAPI();
				mockTargetBox();
				renderCrossfadeLightbox('open');
				fireEvent.click(screen.getByTestId('trigger-0'));
				expect(document.documentElement).toHaveAttribute('data-ramka-crossfade');
			});

			it('crossfades open when crossfade="both"', () => {
				mockViewTransitionAPI();
				mockTargetBox();
				renderCrossfadeLightbox('both');
				fireEvent.click(screen.getByTestId('trigger-0'));
				expect(document.documentElement).toHaveAttribute('data-ramka-crossfade');
			});

			function mockOpenThenCloseTransition() {
				const { resolveOpen, resolveClose } = mockOpenCloseVT();
				return { resolveOpen, resolveClose };
			}

			it('crossfades close when crossfade="close"', async () => {
				const { resolveOpen } = mockOpenThenCloseTransition();
				mockTargetBox();
				renderCrossfadeLightbox('close');
				fireEvent.click(screen.getByTestId('trigger-0'));
				// Open was hard-cut.
				expect(document.documentElement).not.toHaveAttribute('data-ramka-crossfade');
				await act(async () => resolveOpen());

				fireEvent.click(screen.getByTestId('close'));
				expect(document.documentElement).toHaveAttribute('data-ramka-view-transition', 'closing');
				expect(document.documentElement).toHaveAttribute('data-ramka-crossfade');
			});

			it('hard-cuts close when crossfade="open"', async () => {
				const { resolveOpen } = mockOpenThenCloseTransition();
				mockTargetBox();
				renderCrossfadeLightbox('open');
				fireEvent.click(screen.getByTestId('trigger-0'));
				expect(document.documentElement).toHaveAttribute('data-ramka-crossfade');
				await act(async () => resolveOpen());

				fireEvent.click(screen.getByTestId('close'));
				expect(document.documentElement).toHaveAttribute('data-ramka-view-transition', 'closing');
				expect(document.documentElement).not.toHaveAttribute('data-ramka-crossfade');
			});
		});

		describe('border-radius CSS vars', () => {
			let originalRect: PropertyDescriptor | undefined;

			// `getBoundingClientRect` lives on Element.prototype. Without a non-zero
			// box, resolveMorphBorderRadius returns "0px" (jsdom layout is always 0).
			function mockTargetBox() {
				originalRect = Object.getOwnPropertyDescriptor(Element.prototype, 'getBoundingClientRect');
				Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
					value: () => ({
						width: 800,
						height: 600,
						top: 0,
						left: 0,
						right: 800,
						bottom: 600,
						x: 0,
						y: 0,
						toJSON() {}
					}),
					writable: true,
					configurable: true
				});
			}

			afterEach(() => {
				if (originalRect) {
					Object.defineProperty(Element.prototype, 'getBoundingClientRect', originalRect);
				}
				originalRect = undefined;
			});

			it('writes direction-independent radius vars for the VT group CSS without mutating live radii', () => {
				mockViewTransitionAPI();
				mockTargetBox();
				render(MorphLightbox, {
					root: { viewTransition: true, awaitImageDecode: false },
					trigger: 'image',
					triggerProps: { crossfade: 'both', style: 'border-radius: 32px' },
					triggerImageStyle: 'border-radius: 32px',
					contentProps: { 'data-testid': 'content', 'aria-label': 'radius vars test' },
					item: 'image',
					itemProps: { 'data-testid': 'item-0' },
					itemImageStyle: 'border-radius: 8px'
				});

				fireEvent.click(screen.getByTestId('trigger-0'));

				// Stored per SIDE (trigger/item), not per direction (from/to): the
				// same values then serve open and close, so re-morphing skips the
				// writes entirely (root custom-property writes are full-document
				// restyles in WebKit). Static phase-keyed rules in the structural
				// sheet derive --lightbox-morph-border-radius-from/to from this pair.
				expect(
					document.documentElement.style.getPropertyValue('--lightbox-morph-radius-trigger')
				).toBe('32px');
				expect(
					document.documentElement.style.getPropertyValue('--lightbox-morph-radius-item')
				).toBe('8px');
				// Live elements keep their radii — shape morph is CSS on the VT group.
				expect(screen.getByTestId('trigger-0').style.borderRadius).toBe('32px');
				expect(screen.getByTestId('item-0').querySelector('img')!.style.borderRadius).toBe('8px');
			});
		});

		describe('dev warning: item morphs into its own element (no ref wired)', () => {
			let originalRect: PropertyDescriptor | undefined;

			// Give the item's own <div> a resolvable box so `canMorph` is true and the
			// warn path (morph target === item element) is actually reached. Mock on
			// HTMLElement.prototype so it applies to the container div (and any img).
			function mockResolvableBox() {
				originalRect = Object.getOwnPropertyDescriptor(
					HTMLElement.prototype,
					'getBoundingClientRect'
				);
				Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
					value: () => ({
						width: 800,
						height: 600,
						top: 0,
						left: 0,
						right: 800,
						bottom: 600,
						x: 0,
						y: 0,
						toJSON() {}
					}),
					writable: true,
					configurable: true
				});
			}

			afterEach(() => {
				if (originalRect) {
					Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', originalRect);
				}
				originalRect = undefined;
			});

			const MORPH_WARN = 'morphing into its own element';

			it('warns when a morphing item has no imageRef / morphRef wired', () => {
				mockViewTransitionAPI();
				mockResolvableBox();
				const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

				// awaitImageDecode={false} keeps the open path synchronous so the VT
				// callback (and the warn check) runs during the click.
				render(MorphLightbox, {
					root: { viewTransition: true, awaitImageDecode: false },
					trigger: 'text',
					contentProps: { 'data-testid': 'content', 'aria-label': 'unwired warn' },
					// No image / morph attached → target resolves to the item element.
					item: 'div',
					itemProps: { 'data-testid': 'item-0' }
				});
				fireEvent.click(screen.getByTestId('trigger-0'));

				expect(warn).toHaveBeenCalledWith(
					expect.stringContaining(MORPH_WARN),
					screen.getByTestId('item-0')
				);
				warn.mockRestore();
			});

			it('does NOT warn when imageRef designates the destination image', () => {
				mockViewTransitionAPI();
				mockResolvableBox();
				const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

				render(MorphLightbox, {
					root: { viewTransition: true, awaitImageDecode: false },
					trigger: 'text',
					contentProps: { 'data-testid': 'content', 'aria-label': 'wired ok' },
					item: 'image',
					itemProps: { 'data-testid': 'item-0' },
					itemImageSrc: 'a.jpg',
					itemImageAlt: 'a'
				});
				fireEvent.click(screen.getByTestId('trigger-0'));

				expect(warn).not.toHaveBeenCalledWith(
					expect.stringContaining(MORPH_WARN),
					expect.anything()
				);
				warn.mockRestore();
			});

			it('does NOT warn when Lightbox.Media wraps the destination image', () => {
				mockViewTransitionAPI();
				mockResolvableBox();
				const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

				render(MorphLightbox, {
					root: { viewTransition: true, awaitImageDecode: false },
					trigger: 'text',
					contentProps: { 'data-testid': 'content', 'aria-label': 'media wired' },
					item: 'zoom-media',
					itemProps: { 'data-testid': 'item-0' }
				});
				fireEvent.click(screen.getByTestId('trigger-0'));

				expect(warn).not.toHaveBeenCalledWith(
					expect.stringContaining(MORPH_WARN),
					expect.anything()
				);
				// Morph targets Media (sized host), not the Item root.
				expect(screen.getByTestId('media').style.getPropertyValue('view-transition-name')).toBe(
					'lightbox-morph'
				);
				warn.mockRestore();
			});

			it('warns when Lightbox.Media collapses to 0×0 (no resolvable fit-box)', () => {
				mockViewTransitionAPI();
				const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
				// Trigger has a box (so open proceeds); Media stays 0×0.
				originalRect = Object.getOwnPropertyDescriptor(
					HTMLElement.prototype,
					'getBoundingClientRect'
				);
				Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
					value: function (this: HTMLElement) {
						if (this.getAttribute('data-testid') === 'media') {
							return {
								width: 0,
								height: 0,
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								x: 0,
								y: 0,
								toJSON() {}
							};
						}
						return {
							width: 80,
							height: 80,
							top: 0,
							left: 0,
							right: 80,
							bottom: 80,
							x: 0,
							y: 0,
							toJSON() {}
						};
					},
					writable: true,
					configurable: true
				});

				render(MorphLightbox, {
					root: { viewTransition: true, awaitImageDecode: false },
					trigger: 'text',
					contentProps: { 'aria-label': 'collapsed media' },
					item: 'media'
				});
				fireEvent.click(screen.getByTestId('trigger-0'));

				expect(warn).toHaveBeenCalledWith(
					expect.stringContaining('no resolvable size'),
					screen.getByTestId('media')
				);
				warn.mockRestore();
			});
		});

		describe('Stage morphRef (shared capture destination)', () => {
			let originalRect: PropertyDescriptor | undefined;

			function mockResolvableBox() {
				originalRect = Object.getOwnPropertyDescriptor(
					HTMLElement.prototype,
					'getBoundingClientRect'
				);
				Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
					value: () => ({
						width: 360,
						height: 640,
						top: 0,
						left: 0,
						right: 360,
						bottom: 640,
						x: 0,
						y: 0,
						toJSON() {}
					}),
					writable: true,
					configurable: true
				});
			}

			afterEach(() => {
				if (originalRect) {
					Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', originalRect);
				}
				originalRect = undefined;
			});

			it('names the Stage morphRef node, not the item Media', () => {
				mockViewTransitionAPI();
				mockResolvableBox();

				render(MorphLightbox, {
					root: { viewTransition: true, awaitImageDecode: false },
					trigger: 'text',
					contentProps: { 'aria-label': 'stage morph' },
					stage: 'snippet',
					item: 'media',
					itemProps: { 'data-testid': 'item-0' }
				});

				fireEvent.click(screen.getByTestId('trigger-0'));

				expect(screen.getByTestId('frame').style.getPropertyValue('view-transition-name')).toBe(
					'lightbox-morph'
				);
				expect(screen.getByTestId('media').style.getPropertyValue('view-transition-name')).toBe('');
				expect(screen.getByTestId('item-0').style.getPropertyValue('view-transition-name')).toBe(
					''
				);
			});

			it('passes the Stage morphRef node as onBeforeClose destination', () => {
				mockViewTransitionAPI();
				mockResolvableBox();
				const onBeforeClose = vi.fn();

				render(MorphLightbox, {
					root: { viewTransition: true, awaitImageDecode: false, onBeforeClose },
					trigger: 'text',
					contentProps: { 'aria-label': 'stage close dest' },
					stage: 'snippet',
					item: 'text',
					itemProps: { 'data-testid': 'item-0' },
					close: 'content-end'
				});

				fireEvent.click(screen.getByTestId('trigger-0'));
				const frame = screen.getByTestId('frame');
				fireEvent.click(screen.getByTestId('close'));

				expect(onBeforeClose).toHaveBeenCalledWith(expect.objectContaining({ destination: frame }));
			});

			it('does NOT warn about an unwired item when Stage morphRef is attached', () => {
				mockViewTransitionAPI();
				mockResolvableBox();
				const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

				render(MorphLightbox, {
					root: { viewTransition: true, awaitImageDecode: false },
					trigger: 'text',
					contentProps: { 'aria-label': 'stage morph no warn' },
					stage: 'snippet',
					item: 'div',
					itemDivText: 'no item morphRef',
					itemProps: { 'data-testid': 'item-0' }
				});

				fireEvent.click(screen.getByTestId('trigger-0'));

				expect(warn).not.toHaveBeenCalledWith(
					expect.stringContaining('morphing into its own element'),
					expect.anything()
				);
				warn.mockRestore();
			});

			it('lets a nested wrapper attach morphRef via Stage context', () => {
				mockViewTransitionAPI();
				mockResolvableBox();

				// Svelte: React's `Frame` (useOptionalLightboxStageContext) is the
				// StageFrame fixture (getLightboxStageContext).
				render(MorphLightbox, {
					root: { viewTransition: true, awaitImageDecode: false },
					trigger: 'text',
					contentProps: { 'aria-label': 'stage context' },
					stage: 'context',
					item: 'text'
				});

				fireEvent.click(screen.getByTestId('trigger-0'));

				expect(screen.getByTestId('frame').style.getPropertyValue('view-transition-name')).toBe(
					'lightbox-morph'
				);
			});
		});

		it('does not use VT when prefers-reduced-motion is set', () => {
			mockViewTransitionAPI();
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

			const { startViewTransition } = {
				startViewTransition: document.startViewTransition as unknown as ReturnType<typeof vi.fn>
			};
			render(TestLightbox, { viewTransition: true });
			fireEvent.click(screen.getByTestId('trigger-0'));
			expect(startViewTransition).not.toHaveBeenCalled();
			expect(screen.getByTestId('content')).toBeInTheDocument();
		});
	});
});
