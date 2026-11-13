/**
 * `ramka-svelte/lightbox` — headless, unstyled lightbox primitives.
 *
 *   import * as Lightbox from 'ramka-svelte/lightbox';
 *
 *   <Lightbox.Root>
 *     <Lightbox.Trigger index={0}>…</Lightbox.Trigger>
 *     <Lightbox.Portal>
 *       <Lightbox.Backdrop />
 *       <Lightbox.Content aria-label="Photo viewer">…</Lightbox.Content>
 *     </Lightbox.Portal>
 *   </Lightbox.Root>
 *
 * Every part is unstyled; state is exposed as data attributes
 * (`data-open`, `data-active`, `data-disabled`, …) for your CSS.
 */
export { createHandle } from './lightbox-handle.svelte';
export type { LightboxHandle, LightboxHandleOpenOptions } from './lightbox-handle.svelte';

export { default as Root } from './LightboxRoot.svelte';
export { default as Trigger } from './LightboxTrigger.svelte';
export { default as Portal } from './LightboxPortal.svelte';
export { default as Backdrop } from './LightboxBackdrop.svelte';
export { default as Content } from './LightboxContent.svelte';
export { default as Stage } from './LightboxStage.svelte';
export { default as Close } from './LightboxClose.svelte';
export { default as Slides } from './LightboxSlides.svelte';
export { default as Slide } from './LightboxSlide.svelte';
export { default as Item } from './LightboxItem.svelte';
export { default as Media } from './LightboxMedia.svelte';
export { default as Previous } from './LightboxPrevious.svelte';
export { default as Next } from './LightboxNext.svelte';
export { default as Counter } from './LightboxCounter.svelte';
export { default as Caption } from './LightboxCaption.svelte';
export { default as ThumbnailGroup } from './LightboxThumbnailGroup.svelte';
export { default as Thumbnail } from './LightboxThumbnail.svelte';
export { default as Zoom } from './LightboxZoom.svelte';
export { default as ZoomIn } from './LightboxZoomIn.svelte';
export { default as ZoomOut } from './LightboxZoomOut.svelte';

export type { LightboxRootProps } from './LightboxRoot.svelte';
export type {
	LightboxTriggerProps,
	LightboxTriggerRenderState,
	LightboxCrossfade
} from './LightboxTrigger.svelte';
export type { LightboxPortalProps } from './LightboxPortal.svelte';
export type { LightboxBackdropProps } from './LightboxBackdrop.svelte';
export type { LightboxContentProps } from './LightboxContent.svelte';
export type { LightboxStageProps, LightboxStageRenderState } from './LightboxStage.svelte';
export type { LightboxCloseProps } from './LightboxClose.svelte';
export type { LightboxSlidesProps } from './LightboxSlides.svelte';
export type { LightboxSlideProps } from './LightboxSlide.svelte';
export type { LightboxItemProps, LightboxItemRenderState } from './LightboxItem.svelte';
export type { LightboxMediaProps } from './LightboxMedia.svelte';
export type { LightboxPreviousProps } from './LightboxPrevious.svelte';
export type { LightboxNextProps } from './LightboxNext.svelte';
export type { LightboxCounterProps, LightboxCounterState } from './LightboxCounter.svelte';
export type { LightboxCaptionProps } from './LightboxCaption.svelte';
export type { LightboxThumbnailGroupProps } from './LightboxThumbnailGroup.svelte';
export type { LightboxThumbnailProps } from './LightboxThumbnail.svelte';
export type {
	LightboxZoomProps,
	LightboxZoomState,
	LightboxZoomContext
} from './LightboxZoom.svelte';
export type { LightboxZoomInProps } from './LightboxZoomIn.svelte';
export type { LightboxZoomOutProps } from './LightboxZoomOut.svelte';
export type {
	NavigationSource,
	LightboxBeforeOpen,
	LightboxBeforeOpenContext,
	LightboxBeforeClose,
	LightboxBeforeCloseContext,
	LightboxCaptionContent,
	ActiveZoomControls
} from './lightbox-state.svelte';
export type { LightboxViewTransitionPreset } from './vt-timing';
export type { TextDirection } from './lightbox-direction';
export type { ScrollTriggerIntoView } from './scroll-trigger';

export {
	LightboxTriggerDataAttributes,
	LightboxPortalDataAttributes,
	LightboxContentDataAttributes,
	LightboxStageDataAttributes,
	LightboxBackdropDataAttributes,
	LightboxCloseDataAttributes,
	LightboxItemDataAttributes,
	LightboxMediaDataAttributes,
	LightboxSlidesDataAttributes,
	LightboxSlideDataAttributes,
	LightboxPreviousDataAttributes,
	LightboxNextDataAttributes,
	LightboxCounterDataAttributes,
	LightboxCaptionDataAttributes,
	LightboxThumbnailGroupDataAttributes,
	LightboxThumbnailDataAttributes,
	LightboxZoomDataAttributes,
	LightboxZoomInDataAttributes,
	LightboxZoomOutDataAttributes,
	LightboxDocumentDataAttributes
} from './lightbox-data-attributes';
export { LightboxDocumentCssVars } from './lightbox-css-vars';
