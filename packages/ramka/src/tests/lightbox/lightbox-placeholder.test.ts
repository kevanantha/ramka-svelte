import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ImageGallery from './fixtures/engines/ImageGallery.svelte';
import JumpHarness from './fixtures/engines/JumpHarness.svelte';
import MediaGallery from './fixtures/engines/MediaGallery.svelte';
import { stubConstructedSheets } from './style-sheets-test-utils';
import { tryPaintCanvasPlaceholder } from '../../lib/lightbox/lightbox-placeholder';
import { act, fireEvent, render } from './test-utils';

// ---------------------------------------------------------------------------
// jsdom doesn't load images. Stub complete/naturalWidth/currentSrc so tests can
// drive load state deterministically (mirrors lightbox-image.test.tsx).
// ---------------------------------------------------------------------------

let defaultComplete = false;
const savedDescriptors: Record<string, PropertyDescriptor | undefined> = {};

function installImageStubs() {
	for (const key of ['complete', 'naturalWidth', 'currentSrc'] as const) {
		savedDescriptors[key] = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, key);
	}
	Object.defineProperty(HTMLImageElement.prototype, 'complete', {
		configurable: true,
		get(this: HTMLImageElement & { __complete?: boolean }) {
			return this.__complete ?? defaultComplete;
		}
	});
	Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
		configurable: true,
		get(this: HTMLImageElement & { __naturalWidth?: number }) {
			return this.__naturalWidth ?? (defaultComplete ? 200 : 0);
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
	for (const key of ['complete', 'naturalWidth', 'currentSrc'] as const) {
		const desc = savedDescriptors[key];
		if (desc) Object.defineProperty(HTMLImageElement.prototype, key, desc);
	}
}

// Advance a few animation frames (flushing microtasks between each). Covers the
// placeholder's deferred restore, which waits on BOTH the image paint (decode()
// + two rAFs) and the open-transition settle (an rAF + a microtask).
async function flushFrames(count = 4) {
	for (let i = 0; i < count; i++) {
		await act(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
	}
}

// Fire `load`, then flush enough frames for the placeholder's gated restore to
// run: the destination image must be painted (decode + two rAFs) AND the open
// transition must have settled. Neither is synchronous with `load`.
async function simulateLoad(img: HTMLImageElement) {
	const withState = img as HTMLImageElement & { __complete?: boolean; __naturalWidth?: number };
	withState.__complete = true;
	withState.__naturalWidth = 200;
	act(() => {
		fireEvent.load(img);
	});
	await flushFrames();
}

beforeEach(() => {
	defaultComplete = false;
	installImageStubs();

	if (!window.matchMedia) {
		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			configurable: true,
			value: vi.fn().mockImplementation((query: string) => ({
				matches: false,
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn()
			}))
		});
	}
	if (!Element.prototype.getAnimations) {
		Element.prototype.getAnimations = vi.fn(() => []);
	} else {
		vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([]);
	}
});

// Controllable View Transition: the open morph stays pending until
// `resolveFinished()` is called, so we can assert the placeholder gate.
function mockViewTransitionAPI() {
	let resolveFinished!: () => void;
	const finishedPromise = new Promise<void>((r) => {
		resolveFinished = r;
	});
	const startViewTransition = vi.fn((callback: () => void | Promise<void>) => {
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
}

afterEach(() => {
	restoreImageStubs();
	cleanupViewTransitionAPI();
	vi.restoreAllMocks();
});

function itemImg(): HTMLImageElement {
	const el = document.querySelector<HTMLImageElement>('[data-ramka-item] img');
	if (!el) throw new Error('item image not found');
	return el;
}

function clickTrigger(testid: string) {
	fireEvent.click(document.querySelector(`[data-testid="${testid}"]`)!);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('render-fn placeholder wiring (Trigger imageRef -> Item imageRef)', () => {
	it('paints the trigger image as the destination background and clears it on load', async () => {
		render(ImageGallery, { itemClass: 'object-contain' });

		clickTrigger('trigger');

		const img = itemImg();
		expect(img.style.backgroundImage).toContain('/thumb.jpg');

		await simulateLoad(img);
		expect(img.style.backgroundImage).toBe('');
	});

	it('defers clearing the placeholder until after the image paints (Safari flash fix)', async () => {
		render(ImageGallery);

		clickTrigger('trigger');
		const img = itemImg();
		expect(img.style.backgroundImage).toContain('/thumb.jpg');

		// Fire `load` WITHOUT flushing the deferred frames. The placeholder must
		// still be painted — clearing it here (before the full-res <img> composites)
		// is exactly the mobile-Safari blank-flash regression this guards against.
		const withState = img as HTMLImageElement & { __complete?: boolean; __naturalWidth?: number };
		withState.__complete = true;
		withState.__naturalWidth = 200;
		act(() => {
			fireEvent.load(img);
		});
		expect(img.style.backgroundImage).toContain('/thumb.jpg');

		// Once the deferred decode + animation frames run, the placeholder clears.
		await simulateLoad(img);
		expect(img.style.backgroundImage).toBe('');
	});

	it('holds the placeholder until the open transition finishes, even after the image paints', async () => {
		const { loadMorphRuntime } = await import('../../lib/lightbox/lightbox-morph-loader');
		await loadMorphRuntime();
		const { resolveFinished } = mockViewTransitionAPI();

		render(ImageGallery, { viewTransition: true });

		clickTrigger('trigger');
		const img = itemImg();
		expect(img.style.backgroundImage).toContain('/thumb.jpg');

		// The full-res image loads AND paints while the open morph is still running.
		// The placeholder must stay — pulling it mid-transition flashes on Safari.
		const withState = img as HTMLImageElement & { __complete?: boolean; __naturalWidth?: number };
		withState.__complete = true;
		withState.__naturalWidth = 200;
		act(() => {
			fireEvent.load(img);
		});
		await flushFrames();
		expect(img.style.backgroundImage).toContain('/thumb.jpg');

		// Only once the open transition finishes does the placeholder clear.
		await act(async () => resolveFinished());
		expect(img.style.backgroundImage).toBe('');
	});

	it('paints the matching trigger when navigating past the preload window', () => {
		render(JumpHarness);
		clickTrigger('trigger-0');
		expect(itemImg().style.backgroundImage).toContain('/thumb-0.jpg');

		fireEvent.click(document.querySelector('[data-testid="jump"]')!);

		const jumped = itemImg();
		expect(jumped.getAttribute('src')).toBe('/full-2.jpg');
		expect(jumped.style.backgroundImage).toContain('/thumb-2.jpg');
		expect(jumped.style.backgroundImage).not.toContain('/thumb-0.jpg');
	});

	it('does nothing when the destination image is already loaded (cache hit)', () => {
		defaultComplete = true;

		render(ImageGallery);

		clickTrigger('trigger');
		expect(itemImg().style.backgroundImage).toBe('');
	});

	it('sources the placeholder only from Trigger imageRef, excluding a +N overlay', () => {
		render(ImageGallery, {
			triggers: [{ testid: 'trigger', src: '/thumb.jpg', alt: 'thumb', kind: 'overlay' }]
		});

		clickTrigger('trigger');
		expect(itemImg().style.backgroundImage).toContain('/thumb.jpg');
	});

	it('uses the CLICKED trigger image when two triggers share an index', () => {
		render(ImageGallery, {
			triggers: [
				{ testid: 'trigger-a', src: '/a.jpg', alt: 'a' },
				{ testid: 'trigger-b', src: '/b.jpg', alt: 'b' }
			]
		});

		// Click the FIRST trigger even though the index-keyed map holds the second.
		clickTrigger('trigger-a');

		const bg = itemImg().style.backgroundImage;
		expect(bg).toContain('/a.jpg');
		expect(bg).not.toContain('/b.jpg');
	});

	it('morphRef: both the trigger and the item register without touching consumer DOM', () => {
		render(ImageGallery, {
			triggers: [{ testid: 'trigger', src: '/thumb.jpg', alt: 'thumb', kind: 'morph' }],
			item: 'morph'
		});

		clickTrigger('trigger');

		// Both sides are registry-based now — neither pollutes consumer DOM with a
		// marker attribute.
		expect(document.querySelector('[data-testid="trigger-morph"]')).not.toHaveAttribute(
			'data-ramka-morph'
		);
		expect(document.querySelector('[data-testid="item-morph"]')).not.toHaveAttribute(
			'data-ramka-morph'
		);
	});

	it('warns in dev when a Trigger has no imageRef and the item image is unloaded', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		// plain children: no `image` attached
		render(ImageGallery, {
			triggers: [{ testid: 'trigger', src: '/thumb.jpg', alt: 'thumb', kind: 'plain' }]
		});

		clickTrigger('trigger');

		expect(warn).toHaveBeenCalledWith(expect.stringContaining('index=0'));
	});
});

describe('Lightbox.Media (morph + placeholder host)', () => {
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

	it('auto-discovers img and paints placeholder without Item imageRef', () => {
		render(MediaGallery, {
			trigger: true,
			media: { 'data-testid': 'media', style: 'width: 400px; height: 300px;' }
		});

		clickTrigger('trigger');
		expect(itemImg().style.backgroundImage).toContain('/thumb.jpg');
	});

	it('places canvas placeholder inside Media when canvas path is available', async () => {
		const restoreBox = stubBox(400);
		Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', {
			configurable: true,
			get(this: HTMLImageElement & { __naturalHeight?: number }) {
				return this.__naturalHeight ?? (this.complete ? 200 : 0);
			}
		});
		// jsdom has no 2D canvas — stub enough for tryPaintCanvasPlaceholder.
		const origGetContext = HTMLCanvasElement.prototype.getContext;
		HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
			scale: vi.fn(),
			drawImage: vi.fn()
		})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

		render(MediaGallery, {
			trigger: true,
			zoom: { 'data-testid': 'zoom' },
			media: { 'data-testid': 'media' }
		});

		const triggerImg = document.querySelector('[data-testid="trigger"] img') as HTMLImageElement & {
			__complete?: boolean;
			__naturalWidth?: number;
			__naturalHeight?: number;
		};
		triggerImg.__complete = true;
		triggerImg.__naturalWidth = 200;
		triggerImg.__naturalHeight = 200;

		clickTrigger('trigger');

		const media = document.querySelector('[data-testid="media"]')!;
		const canvas = media.querySelector('[data-ramka-placeholder]');
		expect(canvas).toBeTruthy();
		// Canvas must not live on Zoom's transform wrapper (Media's parent under Zoom).
		expect(canvas!.parentElement).toBe(media);

		// data-placeholder flips when Item notifies Media after inserting the canvas.
		await act(async () => undefined);
		expect(media).toHaveAttribute('data-placeholder');
		// Notify re-renders Media; isolation must survive that style reconcile or
		// the z-index:-1 canvas vanishes before the destination image paints.
		expect(media).toHaveStyle({ isolation: 'isolate' });

		HTMLCanvasElement.prototype.getContext = origGetContext;
		restoreBox();
	});

	it('imageRef without Media/morphRef falls back to CSS background (no parent-retarget canvas)', () => {
		render(ImageGallery, { item: 'diy' });

		clickTrigger('trigger');
		// No canvas mounted into a mystery parent — only CSS background on the img.
		expect(document.querySelector('[data-ramka-placeholder]')).toBeNull();
		expect(document.querySelector('[data-testid="diy-host"]')!.children).toHaveLength(1);
		expect(itemImg().style.backgroundImage).toContain('/thumb.jpg');
	});

	it('width/height apply a structural fit-box', () => {
		render(MediaGallery, {
			open: true,
			media: { 'data-testid': 'media', width: 1600, height: 900 },
			child: { tag: 'img', width: 1600, height: 900, src: '/full.jpg', alt: 'full' }
		});

		const media = document.querySelector('[data-testid="media"]') as HTMLElement;
		expect(media).toHaveAttribute('data-width', '1600');
		expect(media).toHaveAttribute('data-height', '900');
		expect(media.style.aspectRatio).toBe('1600 / 900');
		expect(media.style.width).toContain('100cqw');
		expect(media.style.display).toBe('grid');
		expect(media.id).toBeTruthy();
	});

	it.each([
		{
			name: 'img',
			child: { tag: 'img', width: 800, height: 600, src: '/full.jpg', alt: 'full' }
		},
		{
			name: 'video',
			child: { tag: 'video', width: 800, height: 600, src: '/clip.mp4' }
		},
		{
			name: 'canvas',
			child: { tag: 'canvas', width: 800, height: 600 }
		}
	] as const)(
		'scoped style stretches a direct $name child to fill the Media host',
		({ name, child }) => {
			render(MediaGallery, {
				open: true,
				media: { 'data-testid': 'media', width: 800, height: 600 },
				child
			});

			const media = document.querySelector('[data-testid="media"]') as HTMLElement;
			expect(media.style.display).toBe('grid');
			expect(media.id).toBeTruthy();

			// The CSSOM copy is delivered as a sheet rather than a <style> child, so a
			// strict `style-src` cannot refuse it (the hoistable <style> in <head> is
			// the server-paint path — see lightbox-media.test.tsx). jsdom has no CSSOM
			// sheets, so the marker fallback lands in <head>.
			expect(media.querySelector('style')).toBeNull();
			const fillStyle = document.head.querySelector('style[data-ramka-media-fill]');
			expect(fillStyle).toBeTruthy();
			const css = fillStyle!.textContent ?? '';

			// One author rule stretches every direct media child (img / video / canvas).
			// `:not(#_)` buys id-level specificity with constant rule text (constant so
			// the hoistable copy can dedupe by href across instances and remounts).
			const host = '[data-ramka-media]:not(#_)';
			expect(css).toBe(
				`${host} > img:not([data-ramka-media-poster]),${host} > video,${host} > canvas{width:100%;height:100%;min-width:0;min-height:0;}`
			);

			// Child is a direct Media descendant so the `> ${tag}` rule applies.
			// Walked rather than queried: React 18 ids contain `:`, which jsdom's
			// selector engine mangles when it expands `:scope`.
			const el = Array.from(media.children).find((node) => node.tagName.toLowerCase() === name);
			expect(el).toBeTruthy();
			expect(el!.parentElement).toBe(media);
		}
	);

	it('adopts the fill rules in a browser once per document, kept after unmount', () => {
		// Earlier tests in this file mounted Media without constructed-sheet
		// support, leaving the once-per-document <style> fallback behind (it is
		// never removed by design). Clear that state so this test observes a
		// fresh adoption through the stubbed CSSOM path.
		for (const el of Array.from(document.querySelectorAll('style[data-ramka-media-fill]'))) {
			el.remove();
		}
		(document as Document & { [key: symbol]: Set<string> | undefined })[
			Symbol.for('ramka.vt.adoptedMarkers')
		]?.delete('data-ramka-media-fill');
		const stub = stubConstructedSheets();
		try {
			const view = render(MediaGallery, {
				open: true,
				zoom: false,
				media: { 'data-testid': 'media', width: 800, height: 600 },
				child: { tag: 'img', width: 800, height: 600, src: '/full.jpg', alt: 'full' }
			});

			const media = document.querySelector('[data-testid="media"]') as HTMLElement;
			expect(media.querySelector('style')).toBeNull();
			expect(document.querySelectorAll('style[data-ramka-media-fill]')).toHaveLength(0);
			expect(stub.adoptedCss().join('')).toContain('[data-ramka-media]:not(#_) > img');

			view.unmount();

			// Once per document, NEVER released: every adoptedStyleSheets array
			// change is a full-document restyle in WebKit, and the old per-instance
			// adopt/release cycle put several of those inside open/close morphs.
			// The rule is constant text and inert without lightbox media mounted.
			expect(stub.adoptedCss().join('')).toContain('[data-ramka-media]:not(#_) > img');
		} finally {
			stub.restore();
		}
	});

	it('derives fit-box from child img width/height when Media props are omitted', () => {
		render(MediaGallery, {
			open: true,
			zoom: false,
			media: { 'data-testid': 'media' },
			child: { tag: 'img', width: 800, height: 400, src: '/full.jpg', alt: 'full' }
		});

		const media = document.querySelector('[data-testid="media"]') as HTMLElement;
		expect(media).toHaveAttribute('data-width', '800');
		expect(media).toHaveAttribute('data-height', '400');
		expect(media.style.aspectRatio).toBe('800 / 400');
	});

	it('video + poster: Media synthesizes a poster img for the placeholder bridge', () => {
		render(MediaGallery, {
			trigger: true,
			zoom: false,
			media: { 'data-testid': 'media' },
			child: { tag: 'video', src: '/clip.mp4', poster: '/poster.jpg' }
		});

		clickTrigger('trigger');

		const poster = document.querySelector('[data-ramka-media-poster]') as HTMLImageElement | null;
		expect(poster).toBeTruthy();
		expect(poster!.getAttribute('src')).toBe('/poster.jpg');
		expect(poster!.style.backgroundImage).toContain('/thumb.jpg');
	});
});

describe('tryPaintCanvasPlaceholder canvas resolution', () => {
	// Pixel 7: DPR 2.625, a 412×915 CSS-px lightbox box.
	function paint(
		natW: number,
		natH: number,
		fit: 'contain' | 'cover',
		srcset?: { srcset: string; currentSrc: string }
	) {
		vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(2.625);
		const ctx = { scale: vi.fn(), drawImage: vi.fn() };
		vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
			ctx as unknown as CanvasRenderingContext2D
		);
		const source = document.createElement('img');
		Object.defineProperties(source, {
			complete: { value: true },
			naturalWidth: { value: natW },
			naturalHeight: { value: natH }
		});
		if (srcset) {
			source.srcset = srcset.srcset;
			Object.defineProperty(source, 'currentSrc', {
				value: new URL(srcset.currentSrc, document.baseURI).href
			});
		}
		const img = document.createElement('img');
		Object.defineProperties(img, { clientWidth: { value: 412 }, clientHeight: { value: 915 } });
		const host = document.createElement('div');
		host.append(img);
		const restore = tryPaintCanvasPlaceholder({
			img,
			source,
			fit,
			objectPosition: '50% 50%',
			host
		});
		const canvas = host.querySelector('canvas')!;
		restore?.();
		return { canvas, ctx };
	}

	it('caps the canvas at the thumbnail resolution, not the screen', () => {
		// A 600×800 tile contained in 412×915 draws at 412×549.33 CSS px, so the
		// tile has 600/412 px per CSS px. The screen's 2.625 would make 1082×2402.
		const { canvas, ctx } = paint(600, 800, 'contain');
		expect([canvas.width, canvas.height]).toEqual([600, 1333]);
		expect(ctx.scale).toHaveBeenCalledWith(600 / 412, 600 / 412);
		const [, x, y, w, h] = ctx.drawImage.mock.calls[0];
		expect([x, y, w, h].map((n: number) => +n.toFixed(2))).toEqual([0, 182.83, 412, 549.33]);
	});

	it('uses the cropped thumbnail pixels for cover', () => {
		// Cover scales 800 px of height to 915 CSS px: 0.874 px per CSS px.
		const { canvas } = paint(600, 800, 'cover');
		expect([canvas.width, canvas.height]).toEqual([360, 800]);
	});

	it('still caps at the screen DPR when the thumbnail is larger', () => {
		const { canvas } = paint(2400, 3200, 'contain');
		expect([canvas.width, canvas.height]).toEqual([1082, 2402]);
	});

	it("counts the srcset candidate's real pixels, not its density-corrected size", () => {
		// The 900w candidate reports naturalWidth 600 (sizes made it 1.5x dense).
		const { canvas } = paint(600, 800, 'contain', {
			srcset: '/t.jpg 300w, /m.jpg 900w, /l.jpg 2400w',
			currentSrc: '/m.jpg'
		});
		expect([canvas.width, canvas.height]).toEqual([900, 1999]);
	});

	it('reads x descriptors and URLs that contain commas', () => {
		const { canvas } = paint(600, 800, 'contain', {
			srcset: '/a.jpg 1x, /b,c.jpg 1.25x',
			currentSrc: '/b,c.jpg'
		});
		expect([canvas.width, canvas.height]).toEqual([750, 1666]);
	});

	it('keeps the screen resolution when the chosen candidate is unknown', () => {
		const { canvas } = paint(600, 800, 'contain', {
			srcset: '/t.jpg 300w',
			currentSrc: '/elsewhere.jpg'
		});
		expect([canvas.width, canvas.height]).toEqual([1082, 2402]);
	});
});
