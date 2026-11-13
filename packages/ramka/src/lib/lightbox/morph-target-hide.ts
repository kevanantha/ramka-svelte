import {
	LightboxDocumentDataAttributes,
	LightboxTriggerDataAttributes
} from './lightbox-data-attributes';

// ---------------------------------------------------------------------------
// Morph-target hide — the rule that keeps the live trigger invisible while its
// item is active (and while the VT layer owns its pixels during a morph).
//
// Delivered by `Lightbox.Trigger` as a CSSOM sheet (see `ensureLibrarySheet`),
// independent of the lazily loaded morph engine, so the trigger is hidden even
// before the first morph of the session. `data-morph-target` itself is only
// written on the client, so server HTML never needs the rule.
//
// The fade-back transition covers the close handover; it is killed DURING a
// transition so it can't be captured mid-flight in the root snapshot.
// ---------------------------------------------------------------------------

/** Marker for the `<style>` fallback in environments without CSSOM sheets. */
const MORPH_TARGET_HIDE_MARKER = 'data-ramka-morph-target-hide';

const MORPH_TARGET_HIDE_CSS =
	`[${LightboxTriggerDataAttributes.morphTarget}]{` +
	`opacity:0;transition:opacity 200ms cubic-bezier(0.16, 1, 0.3, 1);` +
	`}` +
	`:root[${LightboxDocumentDataAttributes.viewTransition}] ` +
	`[${LightboxTriggerDataAttributes.morphTarget}]{transition:none;}`;

export { MORPH_TARGET_HIDE_CSS, MORPH_TARGET_HIDE_MARKER };
