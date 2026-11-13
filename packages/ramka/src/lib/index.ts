// Parts ship from the `ramka-svelte/lightbox` subpath so consumers write the
// namespace themselves (`import * as Lightbox from 'ramka-svelte/lightbox'`).
// This entry carries the composition helpers for nested wrapper components.
export { getLightboxContext } from './lightbox/lightbox-state.svelte';
export type { LightboxState } from './lightbox/lightbox-state.svelte';
export { getLightboxTriggerContext } from './lightbox/LightboxTrigger.svelte';
export { getLightboxItemContext } from './lightbox/LightboxItem.svelte';
export { getLightboxStageContext } from './lightbox/LightboxStage.svelte';
export { getLightboxZoomContext } from './lightbox/LightboxZoom.svelte';
export type { LightboxTriggerRenderState } from './lightbox/LightboxTrigger.svelte';
export type { LightboxItemContext } from './lightbox/LightboxItem.svelte';
export type { LightboxStageRenderState } from './lightbox/LightboxStage.svelte';
