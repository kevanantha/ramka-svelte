/**
 * The environment at the top of ramka's `lightbox.test.tsx`, shared by the
 * `lightbox.*.test.ts` files that port it section by section. Importing this
 * module registers the same `beforeEach` / `afterEach` hooks for the file.
 */
import { afterEach, beforeEach, vi } from 'vitest';

import { resetVtTouchGuardForTesting } from '../../lib/lightbox/vt-touch-guard';
import { installSlidesLayoutMocks, resetSlidesLayoutMocks } from './slides-test-utils';

export const noop = () => {
	/* controlled prop placeholder */
};

/**
 * Pretend the environment is a touch device (jsdom reports zero touch
 * points). The selection guard only arms on touch-capable devices — the
 * text-selection bug it prevents is touch-driven. Returns a restore fn.
 */
export function mockTouchDevice(points = 5) {
	const original = Object.getOwnPropertyDescriptor(navigator, 'maxTouchPoints');
	Object.defineProperty(navigator, 'maxTouchPoints', { value: points, configurable: true });
	return () => {
		if (original) Object.defineProperty(navigator, 'maxTouchPoints', original);
		else delete (navigator as { maxTouchPoints?: number }).maxTouchPoints;
	};
}

// jsdom lacks the Touch constructor
if (typeof globalThis.Touch === 'undefined') {
	(globalThis as unknown as { Touch: unknown }).Touch = class Touch {
		identifier: number;
		target: EventTarget;
		clientX: number;
		clientY: number;
		constructor(init: {
			identifier: number;
			target: EventTarget;
			clientX?: number;
			clientY?: number;
		}) {
			this.identifier = init.identifier;
			this.target = init.target;
			this.clientX = init.clientX ?? 0;
			this.clientY = init.clientY ?? 0;
		}
	};
}

beforeEach(() => {
	installSlidesLayoutMocks({ raf: false });

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

afterEach(() => {
	resetSlidesLayoutMocks();
	vi.restoreAllMocks();
	// VT tests mock startViewTransition with `finished` promises they never
	// resolve, which would leak the morph's document-level touch-pan guard
	// (held until `finished` settles) into subsequent tests.
	resetVtTouchGuardForTesting();
});
