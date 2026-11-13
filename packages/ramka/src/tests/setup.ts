// Port of ramka's `src/test-setup.ts`: the same jsdom gaps, filled the same way.
import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement matchMedia. A plain (non-vi.fn) stub here in global
// setup survives vi.restoreAllMocks() calls in afterEach hooks across the suite.
if (typeof window !== 'undefined' && !window.matchMedia) {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		configurable: true,
		value: (query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false
		})
	});
}

// jsdom derives `navigator.hardwareConcurrency` from the host's CPU count. A
// 2-core CI runner trips `isLowEndDevice()`, so every View Transition test would
// take the fallback path. Pin a high core count and device memory.
if (typeof navigator !== 'undefined') {
	Object.defineProperty(navigator, 'hardwareConcurrency', {
		writable: true,
		configurable: true,
		value: 8
	});
	Object.defineProperty(navigator, 'deviceMemory', {
		writable: true,
		configurable: true,
		value: 8
	});
}

// jsdom doesn't implement ResizeObserver. Tests that drive resize callbacks
// stub it themselves.
if (typeof globalThis !== 'undefined' && !globalThis.ResizeObserver) {
	globalThis.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}

// Zoom and pull-to-close are lazy-loaded in production. Tests drive those
// engines on the first render, so warm the caches here.
const { loadZoomRuntime } = await import('../lib/lightbox/lightbox-zoom-loader');
const { loadPullRuntime } = await import('../lib/lightbox/lightbox-pull-loader');
await Promise.all([loadZoomRuntime(), loadPullRuntime()]);
