/**
 * Async chunk entry for the view-transition morph engine.
 * Loaded only when a morph will actually run (`viewTransition !== false`
 * and the browser supports View Transitions).
 */

export { createViewTransitionMorph } from './view-transition-morph';
export type { MorphHost, ViewTransitionMorph } from './view-transition-morph';
export { ensureVtStructuralStyles } from './vt-structural-styles';
