/**
 * Port of ramka's `lightbox-slides-test-utils.tsx` (the `SlidesHost` component
 * lives in `fixtures/SlidesHost.svelte`).
 *
 * jsdom has no layout engine, no ResizeObserver callbacks, and no scroll
 * animation. Slides reads offsetLeft/offsetWidth/clientWidth, observes
 * resizes, and uses rAF — tests stub all three. Scroll settling is driven
 * by an explicit `scrollend`.
 */
import { vi } from 'vitest';

import type { TextDirection } from '../../lib/lightbox/lightbox-direction';
import { act, fireEvent } from './test-utils';

export const SLIDE_TEST_WIDTH = 100;

const roInstances = new Set<{ cb: ResizeObserverCallback }>();

let rafSeq = 0;
const rafCallbacks = new Map<number, FrameRequestCallback>();

/** Run one round of currently-scheduled animation frames. */
export function flushRaf() {
	const callbacks = [...rafCallbacks.entries()];
	rafCallbacks.clear();
	callbacks.forEach(([, cb]) => cb(0));
}

/**
 * Fire every live ResizeObserver, then drain the frames it schedules.
 * A real geometry change pins `activeIndex` via a double-rAF settle (and may
 * schedule `scrollToIndex` restore frames) — leave those pending and the
 * resize flag stays up, which would suppress later swipe→index updates.
 */
export function flushResizeObservers() {
	act(() => {
		roInstances.forEach((o) => o.cb([], o as unknown as ResizeObserver));
	});
	act(() => flushRaf());
	act(() => flushRaf());
	act(() => flushRaf());
}

/**
 * Install uniform full-viewport geometry and a writable `scrollLeft` on the
 * viewport, then trigger a re-measure so the scroller adopts it (mount measured
 * jsdom's zeroed layout).
 *
 * `offsetLeft` is measured from the scroller's padding-box left edge. An RTL
 * flex row packs slide 0 against the right edge of the client box and overflows
 * *leftward*, so with full-bleed slides slide 0 sits at 0 and slide `i` at
 * `-i * WIDTH`, with `scrollLeft` running `[-(count − 1) * WIDTH, 0]`. LTR is
 * slide `i` at `i * WIDTH` with `scrollLeft` in `[0, …]`.
 */
export function applySlideGeometry(
	viewport: HTMLElement,
	count: number,
	width = SLIDE_TEST_WIDTH,
	dir: TextDirection = 'ltr'
) {
	let scrollLeft = 0;
	Object.defineProperty(viewport, 'clientWidth', { configurable: true, get: () => width });
	Object.defineProperty(viewport, 'scrollWidth', {
		configurable: true,
		get: () => width * count
	});
	Object.defineProperty(viewport, 'scrollLeft', {
		configurable: true,
		get: () => scrollLeft,
		set: (v: number) => {
			scrollLeft = v;
		}
	});
	const slides = viewport.querySelectorAll<HTMLElement>('[data-ramka-slide]');
	slides.forEach((slide, i) => {
		const offsetLeft = (dir === 'rtl' ? -i : i) * width;
		Object.defineProperty(slide, 'offsetLeft', { configurable: true, get: () => offsetLeft });
		Object.defineProperty(slide, 'offsetWidth', { configurable: true, get: () => width });
	});
}

export function fireResizeObservers() {
	roInstances.forEach((o) => o.cb([], o as unknown as ResizeObserver));
}

export function setupGeometry(
	viewport: HTMLElement,
	count: number,
	width = SLIDE_TEST_WIDTH,
	dir: TextDirection = 'ltr'
) {
	applySlideGeometry(viewport, count, width, dir);
	flushResizeObservers();
}

/** Move the viewport and dispatch a scroll (as a physical swipe would). */
export function swipeTo(
	viewport: HTMLElement,
	index: number,
	width = SLIDE_TEST_WIDTH,
	dir: TextDirection = 'ltr'
) {
	act(() => {
		viewport.scrollLeft = inlineToPhysicalScroll(index * width, dir);
		fireEvent.scroll(viewport);
		flushRaf();
	});
}

/** Physical `scrollLeft` for an inline position, matching the browser's sign. */
export function inlineToPhysicalScroll(inline: number, dir: TextDirection = 'ltr'): number {
	return dir === 'rtl' ? -inline || 0 : inline;
}

/** Signal that scrolling has fully stopped (unlocks discrete navigation). */
export function endScroll(viewport: HTMLElement) {
	act(() => {
		fireEvent(viewport, new Event('scrollend'));
	});
}

export function installSlidesLayoutMocks({ raf = true }: { raf?: boolean } = {}) {
	roInstances.clear();
	rafCallbacks.clear();
	rafSeq = 0;

	vi.stubGlobal(
		'ResizeObserver',
		class {
			cb: ResizeObserverCallback;
			constructor(cb: ResizeObserverCallback) {
				this.cb = cb;
				roInstances.add(this);
			}
			observe() {}
			unobserve() {}
			disconnect() {
				roInstances.delete(this);
			}
		}
	);

	if (!raf) return;

	vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
		const id = ++rafSeq;
		rafCallbacks.set(id, cb);
		return id;
	});
	vi.stubGlobal('cancelAnimationFrame', (id: number) => {
		rafCallbacks.delete(id);
	});
}

export function resetSlidesLayoutMocks() {
	vi.unstubAllGlobals();
}
