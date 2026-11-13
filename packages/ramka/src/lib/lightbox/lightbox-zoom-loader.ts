import type { ZoomEngine, ZoomEngineHost } from './zoom-engine.svelte';

export interface ZoomRuntime {
	/** Behaviour only — attaches to nodes `Lightbox.Zoom` already rendered. */
	createZoomEngine: (host: ZoomEngineHost) => ZoomEngine;
}

let cached: ZoomRuntime | null = null;
let pending: Promise<ZoomRuntime> | null = null;

function loadZoomRuntime(): Promise<ZoomRuntime> {
	if (cached) return Promise.resolve(cached);
	pending ??= import('./lightbox-zoom-runtime').then(
		(mod) => {
			cached = mod;
			return mod;
		},
		(error: unknown) => {
			// See lightbox-morph-loader: a remembered rejection would disable zoom
			// for the rest of the page, so let the next open try again.
			pending = null;
			throw error;
		}
	);
	return pending;
}

function getZoomRuntimeSync(): ZoomRuntime | null {
	return cached;
}

function prefetchZoomRuntime(): void {
	// Best-effort warm-up — see lightbox-morph-loader.
	loadZoomRuntime().catch(() => {});
}

export { loadZoomRuntime, getZoomRuntimeSync, prefetchZoomRuntime };
