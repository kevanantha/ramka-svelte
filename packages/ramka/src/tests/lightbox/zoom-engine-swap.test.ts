import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { LightboxZoomContext } from '../../lib/lightbox';
import MediaGallery from './fixtures/engines/MediaGallery.svelte';
import { act, fireEvent, render } from './test-utils';

/**
 * What happens when the zoom engine chunk arrives while the lightbox is already
 * open.
 *
 * `Lightbox.Zoom` renders a placeholder until the chunk resolves and then swaps
 * in the engine. The two render an identical DOM shape, so the swap looks free —
 * but they are different component types, so React unmounts the subtree and
 * rebuilds it, taking the consumer's `<img>` and the `<canvas>` underlay that
 * `Lightbox.Item` imperatively inserts during the open with it. That underlay is
 * the whole reason the open doesn't flash empty space before the full-res image
 * paints, and Item's restore bookkeeping keeps pointing at the detached node.
 *
 * This is why zoom has to be warmed ahead of the open at all. Pin it, so the
 * warm-up policy is free to change once the swap is non-destructive.
 *
 * Isolated in its own file: it is the only place where the zoom engine is
 * deliberately cold, and test-setup.ts warms the real loader for everyone else.
 */

const zoomChunk = vi.hoisted(() => ({
	runtime: null as unknown,
	/** Non-null only while a test is simulating a chunk that hasn't landed yet. */
	deferred: null as null | { promise: Promise<unknown>; land: () => void }
}));

// Replaces the loader rather than the runtime module, because test-setup.ts has
// already warmed the real loader's cache — a warm cache means the placeholder
// never renders and there is no swap to observe. Calls made outside a test (the
// setup warm-up) resolve immediately, so nothing hangs.
// Svelte: the runtime exports `createZoomEngine` (behaviour only, attached to
// nodes Zoom already rendered) instead of a `ZoomEngine` component.
vi.mock('../../lib/lightbox/lightbox-zoom-loader', async () => {
	const runtime = await import('../../lib/lightbox/lightbox-zoom-runtime');
	zoomChunk.runtime = { createZoomEngine: runtime.createZoomEngine };
	return {
		loadZoomRuntime: () => zoomChunk.deferred?.promise ?? Promise.resolve(zoomChunk.runtime),
		getZoomRuntimeSync: () => (zoomChunk.deferred ? null : zoomChunk.runtime),
		prefetchZoomRuntime: () => {}
	};
});

/**
 * Hold the zoom chunk. Returns the function that lands it, mid-open, the way a
 * cold network would.
 */
function coldZoomChunk() {
	let land!: () => void;
	const promise = new Promise<unknown>((resolve) => {
		land = () => resolve(zoomChunk.runtime);
	});
	zoomChunk.deferred = { promise, land };
	return async () => {
		// Cleared first so the re-render after `setEngine` sees a warm cache.
		zoomChunk.deferred = null;
		land();
		await act(async () => undefined);
	};
}

/** The pose controller commits over rAF, so zoom changes settle across frames. */
async function flushFrames(count = 4) {
	for (let i = 0; i < count; i++) {
		await act(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
	}
}

const savedDescriptors: Record<string, PropertyDescriptor | undefined> = {};
const IMAGE_STUBS = ['complete', 'naturalWidth', 'naturalHeight', 'currentSrc'] as const;

// jsdom doesn't load images, and Item's placeholder path only runs for a trigger
// thumbnail it believes is decoded.
function installImageStubs() {
	for (const key of IMAGE_STUBS) {
		savedDescriptors[key] = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, key);
	}
	Object.defineProperty(HTMLImageElement.prototype, 'complete', {
		configurable: true,
		get(this: HTMLImageElement & { __complete?: boolean }) {
			return this.__complete ?? false;
		}
	});
	Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
		configurable: true,
		get(this: HTMLImageElement & { __naturalWidth?: number }) {
			return this.__naturalWidth ?? 0;
		}
	});
	Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', {
		configurable: true,
		get(this: HTMLImageElement & { __naturalHeight?: number }) {
			return this.__naturalHeight ?? 0;
		}
	});
	Object.defineProperty(HTMLImageElement.prototype, 'currentSrc', {
		configurable: true,
		get(this: HTMLImageElement & { __currentSrc?: string }) {
			return this.__currentSrc ?? this.getAttribute('src') ?? '';
		}
	});
}

function restoreImageStubs() {
	for (const key of IMAGE_STUBS) {
		const desc = savedDescriptors[key];
		if (desc) Object.defineProperty(HTMLImageElement.prototype, key, desc);
	}
}

// Zoom measures its stage, and the placeholder canvas is sized from the box.
function stubBox(size = 400) {
	const w = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
	const h = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
	Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
		configurable: true,
		get: () => size
	});
	Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
		configurable: true,
		get: () => size
	});
	return () => {
		if (w) Object.defineProperty(HTMLElement.prototype, 'clientWidth', w);
		if (h) Object.defineProperty(HTMLElement.prototype, 'clientHeight', h);
	};
}

let restoreBox: (() => void) | null = null;
let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

beforeEach(() => {
	installImageStubs();
	restoreBox = stubBox(400);
	// jsdom has no 2D context — stub enough for tryPaintCanvasPlaceholder.
	originalGetContext = HTMLCanvasElement.prototype.getContext;
	HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
		scale: vi.fn(),
		drawImage: vi.fn()
	})) as unknown as typeof HTMLCanvasElement.prototype.getContext;
	if (!Element.prototype.getAnimations) {
		Element.prototype.getAnimations = vi.fn(() => []);
	} else {
		vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([]);
	}
});

afterEach(() => {
	zoomChunk.deferred = null;
	HTMLCanvasElement.prototype.getContext = originalGetContext;
	restoreBox?.();
	restoreImageStubs();
	vi.restoreAllMocks();
});

/**
 * Open with a decoded thumbnail, so Item paints the canvas underlay.
 *
 * `TestGallery` is MediaGallery with a trigger and Zoom > Media > img. Explicit
 * maxZoom so zoomability doesn't depend on jsdom knowing the image's natural
 * size. Svelte: `onzoom` hands out Zoom's context, where React took a
 * `LightboxZoomRef`.
 */
function openWithDecodedThumbnail(onzoom?: (zoom: LightboxZoomContext | undefined) => void) {
	render(MediaGallery, {
		trigger: true,
		zoom: { maxZoom: 3, 'data-testid': 'zoom' },
		media: { 'data-testid': 'media' },
		child: { tag: 'img', src: '/full.jpg', alt: 'full', draggable: false },
		onzoom
	});
	const triggerImg = document.querySelector('[data-testid="trigger"] img') as HTMLImageElement & {
		__complete?: boolean;
		__naturalWidth?: number;
		__naturalHeight?: number;
	};
	triggerImg.__complete = true;
	triggerImg.__naturalWidth = 200;
	triggerImg.__naturalHeight = 200;
	fireEvent.click(document.querySelector('[data-testid="trigger"]')!);
}

const media = () => document.querySelector('[data-testid="media"]');
const zoomHost = () => document.querySelector('[data-testid="zoom"]');

describe('the zoom engine chunk landing while the lightbox is open', () => {
	it('keeps the Media host mounted', async () => {
		const landZoomChunk = coldZoomChunk();
		openWithDecodedThumbnail();

		const before = media();
		expect(before).toBeTruthy();

		await landZoomChunk();

		expect(media()).toBe(before);
	});

	it("keeps the consumer's image mounted", async () => {
		const landZoomChunk = coldZoomChunk();
		openWithDecodedThumbnail();

		const before = media()!.querySelector('img');
		expect(before).toBeTruthy();

		await landZoomChunk();

		// A fresh <img> re-enters the decode path mid-open, and drops whatever the
		// morph had attached to the old node.
		expect(media()!.querySelector('img')).toBe(before);
	});

	it("keeps Item's canvas underlay attached", async () => {
		const landZoomChunk = coldZoomChunk();
		openWithDecodedThumbnail();

		const canvas = media()!.querySelector('[data-ramka-placeholder]');
		expect(canvas).toBeTruthy();

		await landZoomChunk();

		// Item inserted this imperatively and holds a reference for the restore, so
		// a React remount both loses the paint and strands the bookkeeping.
		expect(canvas!.isConnected).toBe(true);
		expect(media()!.querySelector('[data-ramka-placeholder]')).toBe(canvas);
	});

	it('has the engine live afterwards', async () => {
		// Guards the tests above against passing because the swap never happened at
		// all: the placeholder's imperative API is a set of no-ops, the engine's is
		// not, and nothing else distinguishes the two at rest.
		let zoomRef: LightboxZoomContext | undefined;
		const landZoomChunk = coldZoomChunk();
		openWithDecodedThumbnail((zoom) => (zoomRef = zoom));

		await act(async () => {
			zoomRef!.zoomIn();
		});
		await flushFrames();
		expect(zoomHost()).not.toHaveAttribute('data-zoom');

		await landZoomChunk();

		await act(async () => {
			zoomRef!.zoomIn();
		});
		await flushFrames();
		expect(zoomHost()).toHaveAttribute('data-zoom');
	});
});
