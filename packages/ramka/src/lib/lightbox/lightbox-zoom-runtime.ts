/**
 * Async chunk entry for the zoom engine. Loaded when `Lightbox.Zoom` first
 * mounts, or earlier on trigger intent / open.
 */
import { ZoomEngine, type ZoomEngineHost } from './zoom-engine.svelte';

export function createZoomEngine(host: ZoomEngineHost): ZoomEngine {
	return new ZoomEngine(host);
}
