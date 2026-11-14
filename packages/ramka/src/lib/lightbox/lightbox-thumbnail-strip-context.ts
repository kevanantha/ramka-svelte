import { createContext } from 'svelte';

import type { NavigationSource } from './lightbox-state.svelte';

export interface LightboxThumbnailStripSelectOptions {
	/** Reported to `onValueChange`. @default 'thumbnail' */
	source?: NavigationSource;
	/**
	 * Whether this selection may run the element-scoped Slides view transition
	 * (still gated by the strip's `selectViewTransition` prop). Pointer thumb
	 * selection passes `true` (default); keyboard / button navigation passes
	 * `false` so the stage commit stays instant while the strip scrubs.
	 * @default true
	 */
	stageViewTransition?: boolean;
}

export interface LightboxThumbnailStripContextValue {
	/** Register the transform target (tablist track element). */
	registerTrack: (node: HTMLElement | null) => void;
	/**
	 * Register a thumbnail element for midline / travel measurement. Returns
	 * the unregister, which clears the slot only while it still holds `node`:
	 * when items shift, a moved thumb's cleanup can run after the thumb now at
	 * its old index registered.
	 */
	registerThumb: (index: number, node: HTMLElement) => () => void;
	/**
	 * Discrete selection into this ThumbnailStrip (pointer thumb, keyboard,
	 * Previous/Next). Owns optional scrub motion; always respects
	 * `navigationLocked`.
	 */
	selectIndex: (index: number, options?: LightboxThumbnailStripSelectOptions) => void;
}

const [getContext, setContext, hasContext] = createContext<LightboxThumbnailStripContextValue>();

export { setContext as setLightboxThumbnailStripContext };

/** The enclosing ThumbnailStrip. Throws outside one. */
export function getLightboxThumbnailStripContext(): LightboxThumbnailStripContextValue {
	if (!hasContext()) {
		throw new Error('Lightbox.ThumbnailStripTrack must be used within Lightbox.ThumbnailStrip');
	}
	return getContext();
}

/** `undefined` outside a ThumbnailStrip — `Thumbnail` uses it to optionally defer selection. */
export function getLightboxThumbnailStripContextOptional():
	LightboxThumbnailStripContextValue | undefined {
	return hasContext() ? getContext() : undefined;
}
