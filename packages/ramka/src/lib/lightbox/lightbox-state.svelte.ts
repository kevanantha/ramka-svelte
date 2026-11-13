/**
 * Root state for one lightbox, shared with every part through context.
 *
 * Svelte's fine-grained reactivity does the work the React original needed a
 * hot-state store for: a Trigger reading `state.activeIndex === index` only
 * re-runs that expression on navigation. So this is one class with:
 *
 * - reactive fields (`$state` / `$derived`) for what parts render from;
 * - plain fields and Maps for what the engines read at event time (DOM
 *   registries, scroll geometry) — nothing renders from those;
 * - the open/close orchestration (scroll lock, focus return, morph hand-off),
 *   with the same ordering as the original Root.
 *
 * Layer map:
 *   Root (state + registries)
 *     ├─ Trigger
 *     └─ Portal
 *          ├─ Backdrop
 *          └─ Content          dialog: focus, Escape, accessible name
 *               ├─ Slides → Slide → Item → Media
 *               └─ chrome      Close, Prev/Next, Counter, Caption, thumbs
 */
import { createContext, untrack, type Snippet } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import { DEV } from 'esm-env';

import {
	getMorphRuntimeSync,
	loadMorphRuntime,
	prefetchMorphRuntime
} from './lightbox-morph-loader';
import { findDestinationMorphTarget } from './morph-target';
import { prefetchZoomRuntime } from './lightbox-zoom-loader';
import { isAndroidBlinkSnapshotRoot } from './is-android-blink';
import { shouldYieldBeforeCapture } from './vt-capture-yield';
import { scheduleWarmUp } from './schedule-warm-up';
import { DEFAULT_DECODE_MAX_WAIT, isLowEndDevice, supportsViewTransitions } from './vt-constants';
import {
	resolveScrollTriggerOption,
	resolveTriggerIndex,
	scrollTriggerEl,
	type ScrollTriggerIntoView
} from './scroll-trigger';
import type { SlidesGeometry } from './lightbox-slides-geometry';
import type { TextDirection } from './lightbox-direction';
import type { LightboxViewTransitionPreset } from './vt-timing';
import type { MorphHost, ViewTransitionMorph } from './view-transition-morph';

export type NavigationSource =
	'trigger' | 'keyboard' | 'thumbnail' | 'button' | 'scroll' | 'imperative';

/** Options for a close (`setOpen(false, …)`) that tune return-focus behavior. */
export interface LightboxCloseOptions {
	/**
	 * `true` — keyboard close (Escape): show the trigger's focus ring.
	 * `false` — pointer/touch close: no ring. Omitted — browser heuristic.
	 */
	focusVisible?: boolean;
}

/** Context passed to `onBeforeOpen`. */
export interface LightboxBeforeOpenContext {
	/** Capture destination (item `morph` target / Media / item), if any. */
	destination: Element | null;
	/** Aborts when a newer open/close wins. */
	signal: AbortSignal;
}
export type LightboxBeforeOpen = (ctx: LightboxBeforeOpenContext) => void | Promise<void>;

/** Context passed to `onBeforeClose`. */
export interface LightboxBeforeCloseContext {
	destination: Element | null;
}
export type LightboxBeforeClose = (ctx: LightboxBeforeCloseContext) => void;

/** A caption registered by `Lightbox.Item`: plain text or a snippet. */
export type LightboxCaptionContent = string | Snippet;

/**
 * The active slide's zoom, published by its `Lightbox.Zoom` so controls that
 * live above every slide (ZoomIn / ZoomOut in the chrome, Content's keys,
 * Slides' swipe lock, the close morph) can drive it. Reads are live.
 */
export interface ActiveZoomControls {
	readonly canZoomIn: boolean;
	readonly canZoomOut: boolean;
	zoomIn(): void;
	zoomOut(): void;
	/**
	 * Reset to the minimum zoom. `true` replaces the pose synchronously (no
	 * animation) — the Firefox zoomed-close workaround before capture.
	 */
	reset(rapid?: boolean): void;
	/** Glide the pan by content-space px (instant under reduced motion). */
	panBy(dx: number, dy: number): void;
	/** The slide's keyboard pan step, in content px. */
	readonly keyboardPanDistance: number;
	/** Live zoom level, including mid-animation (1 = not zoomed). */
	getZoom(): number;
}

/**
 * The Root's props, as an object of getters (and setters for the bindable
 * `open` / `value`), so every read is current.
 */
export interface LightboxStateProps {
	open: boolean;
	value: number;
	readonly onOpenChange?: (open: boolean) => void;
	readonly onOpenChangeComplete?: (open: boolean) => void;
	readonly onValueChange?: (value: number, metadata: { source: NavigationSource }) => void;
	readonly onBeforeOpen?: LightboxBeforeOpen;
	readonly onBeforeClose?: LightboxBeforeClose;
	readonly count?: number;
	readonly loop: boolean;
	readonly dir?: TextDirection;
	readonly viewTransition: boolean | LightboxViewTransitionPreset;
	readonly morphTo: 'active' | 'origin' | 'closest';
	readonly scrollTriggerIntoView: ScrollTriggerIntoView;
	readonly awaitImageDecode: boolean | number;
}

let instanceCounter = 0;

/**
 * Waits for the running animations on `el` to finish, then calls `onSettled`
 * if `isCurrent()` still holds, so a superseding open/close aborts it.
 */
function runAfterAnimations(
	el: HTMLElement | null,
	isCurrent: () => boolean,
	onSettled: () => void
): void {
	if (!el) {
		onSettled();
		return;
	}
	Promise.allSettled(el.getAnimations().map((a) => a.finished)).then(() => {
		if (isCurrent()) onSettled();
	});
}

export class LightboxState {
	readonly #props: LightboxStateProps;

	/** Stable id prefix (tab ↔ tabpanel ids, dialog id). */
	readonly baseId = `ramka-${++instanceCounter}`;

	// ── Reactive state ──────────────────────────────────────────────────────
	/** Whether the portal is in the DOM (stays true during exit animations). */
	mounted = $state(false);
	/**
	 * Mounted but must not paint: VT open pre-mount, and the Android Chrome VT
	 * close hold. Content/Backdrop render `visibility: hidden` meanwhile.
	 */
	preparing = $state(false);
	#registeredItems = $state(0);
	#tablists = $state(0);
	/** Caption registry, keyed by item index. */
	readonly captions = new SvelteMap<number, LightboxCaptionContent>();

	open = $derived.by(() => this.#props.open);
	activeIndex = $derived.by(() => this.#props.value);
	loop = $derived.by(() => this.#props.loop);
	/** Resolved reading direction (behavior); `'ltr'` when omitted. */
	dir = $derived.by<TextDirection>(() => this.#props.dir ?? 'ltr');
	/** The `dir` prop as given — written to the portal host only when set. */
	dirAttribute = $derived.by(() => this.#props.dir);
	viewTransition = $derived.by(() => this.#props.viewTransition !== false);
	transitionPreset = $derived.by(() => this.#props.viewTransition);
	morphTo = $derived.by(() => this.#props.morphTo);
	/** Registered item count, or the `count` prop until items register. */
	itemCount = $derived.by(() =>
		this.#registeredItems > 0 ? this.#registeredItems : (this.#props.count ?? 0)
	);
	hasTablist = $derived(this.#tablists > 0);

	#prevIndex: number;
	#direction: 'forward' | 'backward' = 'forward';
	/**
	 * Last navigation direction (navigation order, not reading direction),
	 * derived alongside `activeIndex` so controlled `value` updates get it too.
	 */
	direction = $derived.by(() => {
		const index = this.activeIndex;
		if (index !== this.#prevIndex) {
			this.#direction = index > this.#prevIndex ? 'forward' : 'backward';
			this.#prevIndex = index;
		}
		return this.#direction;
	});

	/** The trigger that opened the viewer (`morphTo="origin"`, `aria-expanded`). */
	openingTriggerIndex = $state(0);
	openingTriggerElement = $state.raw<HTMLElement | null>(null);
	/**
	 * True from the start of an open until it settles. `Lightbox.Item` holds
	 * its morph placeholder until then (clearing it mid-morph flashes on iOS).
	 */
	openTransitionPending = $state(false);
	/** The active slide's zoom (see `ActiveZoomControls`), when it has one. */
	activeZoom = $state.raw<ActiveZoomControls | null>(null);
	/** The `Lightbox.Content` element. Reactive: the zoom engine binds to it. */
	dialogElement = $state.raw<HTMLElement | null>(null);
	/** The `Lightbox.Stage` element, when one is mounted (zoom binds to it too). */
	stageElement = $state.raw<HTMLElement | null>(null);

	// ── Engine registries (read at event time; nothing renders from them) ──
	/** Set by Slides while a user scroll/fling is in flight. */
	navigationLocked = false;
	/** Index → trigger element (last-registered wins). */
	readonly triggerElements = new Map<number, HTMLElement>();
	/** Trigger → its designated morph descendant. */
	readonly triggerMorphElements = new WeakMap<HTMLElement, HTMLElement>();
	/** Index → trigger `<img>`, the placeholder source for that item. */
	readonly triggerImageElements = new Map<number, HTMLImageElement>();
	openingTriggerImage: HTMLImageElement | null = null;
	activeItemElement: HTMLElement | null = null;
	/** Item → its designated morph descendant (`morph` → Media → image). */
	readonly itemMorphElements = new WeakMap<HTMLElement, HTMLElement>();
	/** Shared capture destination (Stage `morph`). */
	destinationMorphElement: HTMLElement | null = null;
	backdropElement: HTMLElement | null = null;
	slidesViewport: HTMLElement | null = null;
	slidesGeometry: SlidesGeometry = { offsets: [], base: 0, step: 1, count: 0 };

	/** Bumped by every open/close; async steps of a superseded one bail. */
	#closeGen = 0;
	#closeFocusVisible: boolean | undefined;
	#beforeOpenAbort: AbortController | null = null;
	#scrollLockCleanup: (() => void) | null = null;
	#selectionGuardCleanup: (() => void) | null = null;
	/** Last open value setOpen took responsibility for (external-sync guard). */
	#lastInternalOpen: boolean;
	#morph: ViewTransitionMorph | null = null;

	constructor(props: LightboxStateProps) {
		this.#props = props;
		this.#prevIndex = props.value;
		this.#lastInternalOpen = props.open;
		this.mounted = props.open;
	}

	// ── Lifecycle wiring (called once by Root) ──────────────────────────────

	/** Effects that live for the Root's lifetime. Call from Root's script. */
	connect(): void {
		// Initially-open lightbox: acquire the lock; release on unmount. Mount
		// and unmount only (untracked): rerunning on `mounted` would release the
		// lock as a close morph unmounts the portal, letting the page scroll
		// behind the in-flight close. Later opens and closes lock themselves.
		$effect(() => {
			if (untrack(() => this.mounted && !this.preparing)) this.#lockScroll();
			return () => this.#unlockScroll();
		});

		// Sync `mounted` to externally-driven `open` changes (a bound value set
		// by something other than Trigger / Close). Plain mount swap, no morph.
		$effect(() => {
			const open = this.open;
			if (open === this.#lastInternalOpen) return;
			this.#lastInternalOpen = open;
			if (open) {
				this.openingTriggerElement = null;
				this.openingTriggerImage = null;
				this.mounted = true;
				this.#lockScroll();
				return;
			}
			const gen = ++this.#closeGen;
			this.#notifyBeforeClose();
			runAfterAnimations(
				this.dialogElement,
				() => this.#closeGen === gen,
				() => {
					this.mounted = false;
					this.#unlockScroll();
				}
			);
		});

		// Scroll the close-morph trigger into view when the index changes while
		// open (idle-debounced; never on the open edge).
		let prev = { open: this.open, activeIndex: this.activeIndex };
		let timer = 0;
		$effect(() => {
			const open = this.open;
			const activeIndex = this.activeIndex;
			const before = prev;
			prev = { open, activeIndex };
			if (!resolveScrollTriggerOption(this.#props.scrollTriggerIntoView, 'onChange')) return;
			if (!open || !before.open || before.activeIndex === activeIndex) return;
			window.clearTimeout(timer);
			timer = window.setTimeout(() => {
				if (!prev.open || prev.activeIndex !== activeIndex) return;
				const scroll = resolveScrollTriggerOption(this.#props.scrollTriggerIntoView, 'onChange');
				if (!scroll) return;
				const idx = this.#closeTriggerIndex();
				scrollTriggerEl(this.triggerElements.get(idx), scroll);
			}, 120);
			return () => window.clearTimeout(timer);
		});

		// Warm the morph engine once the page is idle (never during hydration).
		$effect(() => {
			if (!this.viewTransition || !supportsViewTransitions() || isLowEndDevice()) return;
			return scheduleWarmUp(prefetchMorphRuntime);
		});
	}

	// ── Registries ───────────────────────────────────────────────────────────

	// Registration runs inside the parts' effects. `untrack` keeps those
	// effects from depending on the counters they write (an update loop).

	registerItem(): () => void {
		untrack(() => (this.#registeredItems += 1));
		return () => untrack(() => (this.#registeredItems -= 1));
	}

	registerTablist(): () => void {
		untrack(() => (this.#tablists += 1));
		return () => untrack(() => (this.#tablists = Math.max(0, this.#tablists - 1)));
	}

	registerCaption(index: number, caption: LightboxCaptionContent): () => void {
		untrack(() => this.captions.set(index, caption));
		return () =>
			untrack(() => {
				if (this.captions.get(index) === caption) this.captions.delete(index);
			});
	}

	// ── Navigation ───────────────────────────────────────────────────────────

	setActiveIndex(index: number, source: NavigationSource): void {
		// A user swipe owns the position while in flight: drop discrete nav.
		if (
			this.navigationLocked &&
			(source === 'keyboard' || source === 'thumbnail' || source === 'button')
		) {
			return;
		}
		this.#props.value = index;
		this.#props.onValueChange?.(index, { source });
	}

	/** Discrete navigation entry point for keyboard / Previous / Next. */
	navigate(index: number, source: NavigationSource): void {
		this.setActiveIndex(index, source);
	}

	/** Open from a trigger element (records the morph origin first). */
	openFromTrigger(index: number, element: HTMLElement | null, image: HTMLImageElement | null) {
		this.openingTriggerIndex = index;
		this.openingTriggerElement = element;
		this.openingTriggerImage = image;
		this.setActiveIndex(index, 'trigger');
		this.setOpen(true);
	}

	// ── Open / close ─────────────────────────────────────────────────────────

	setOpen(nextOpen: boolean, options?: LightboxCloseOptions): void {
		this.#closeGen += 1;
		this.#closeFocusVisible = nextOpen ? undefined : options?.focusVisible;
		this.#beforeOpenAbort?.abort();
		this.#beforeOpenAbort = null;
		this.#lastInternalOpen = nextOpen;

		if (nextOpen) {
			this.openTransitionPending = true;
			// Request Zoom with the open rather than waiting for Zoom to mount,
			// so gestures are live as early as the network allows.
			prefetchZoomRuntime();
		} else {
			this.#settleOpenTransition();
			this.#notifyBeforeClose();
		}

		const useVT = this.viewTransition && supportsViewTransitions() && !isLowEndDevice();
		if (!useVT) {
			this.#runWithoutViewTransition(nextOpen);
			return;
		}

		const gen = this.#closeGen;
		const startMorph = (runtime: NonNullable<ReturnType<typeof getMorphRuntimeSync>>) => {
			if (this.#closeGen !== gen) return;
			runtime.ensureVtStructuralStyles();
			this.#morph ??= runtime.createViewTransitionMorph(this.#morphHost());
			if (nextOpen) this.#morph.open();
			else this.#morph.close();
		};
		const runtime = getMorphRuntimeSync();
		if (runtime) {
			startMorph(runtime);
		} else {
			void loadMorphRuntime().then(startMorph, (error: unknown) => {
				// Chunk never arrived — degrade so the click still opens.
				if (this.#closeGen !== gen) return;
				if (DEV) {
					console.warn(
						'Lightbox: the view-transition runtime failed to load; opening without the morph.',
						error
					);
				}
				this.#runWithoutViewTransition(nextOpen);
			});
		}
	}

	#setOpenValue(open: boolean) {
		this.#props.open = open;
		this.#props.onOpenChange?.(open);
	}

	#closeTriggerIndex(): number {
		return resolveTriggerIndex(
			this.activeIndex,
			this.morphTo,
			this.openingTriggerIndex,
			this.triggerElements
		);
	}

	#runWithoutViewTransition(nextOpen: boolean) {
		const gen = this.#closeGen;
		if (nextOpen) {
			this.mounted = true;
			this.#lockScroll();
			this.#setOpenValue(true);
			// Wait a frame for the enter animation to register, then settle.
			requestAnimationFrame(() => {
				if (this.#closeGen !== gen) return;
				runAfterAnimations(
					this.dialogElement,
					() => this.#closeGen === gen,
					() => {
						const scroll = resolveScrollTriggerOption(
							this.#props.scrollTriggerIntoView,
							'onOpenComplete'
						);
						if (scroll) {
							scrollTriggerEl(this.triggerElements.get(this.#closeTriggerIndex()), scroll);
						}
						this.#settleOpenTransition();
						this.#props.onOpenChangeComplete?.(true);
					}
				);
			});
			return;
		}
		const closeIdx = this.#closeTriggerIndex();
		const closeScroll = resolveScrollTriggerOption(this.#props.scrollTriggerIntoView, 'onClose');
		const focusTarget = this.triggerElements.get(closeIdx);
		if (closeScroll) scrollTriggerEl(focusTarget, closeScroll);
		this.#setOpenValue(false);
		// Keep the tree mounted until the consumer's exit transition finishes.
		runAfterAnimations(
			this.dialogElement,
			() => this.#closeGen === gen,
			() => {
				this.mounted = false;
				this.#unlockScroll();
				requestAnimationFrame(() => this.#focusReturnTarget(focusTarget));
				this.#props.onOpenChangeComplete?.(false);
			}
		);
	}

	/** The morph engine's live view of this lightbox (see `MorphHost`). */
	#morphHost(): MorphHost {
		// Getters close over `state`, so the engine always reads current values.
		const state = this;
		return {
			get morphTo() {
				return state.morphTo;
			},
			get scrollTriggerIntoView() {
				return state.#props.scrollTriggerIntoView;
			},
			get decodeMaxWait() {
				const wait = state.#props.awaitImageDecode;
				if (wait === false) return 0;
				return wait === true ? DEFAULT_DECODE_MAX_WAIT : Math.max(0, wait);
			},
			get onBeforeOpen() {
				return state.#props.onBeforeOpen;
			},
			get beforeOpenAbort() {
				return state.#beforeOpenAbort;
			},
			set beforeOpenAbort(controller) {
				state.#beforeOpenAbort = controller;
			},
			triggerElements: state.triggerElements,
			triggerMorphElements: state.triggerMorphElements,
			itemMorphElements: state.itemMorphElements,
			get activeItemElement() {
				return state.activeItemElement;
			},
			get destinationMorphElement() {
				return state.destinationMorphElement;
			},
			get openingTriggerIndex() {
				return state.openingTriggerIndex;
			},
			get openingTriggerElement() {
				return state.openingTriggerElement;
			},
			get activeIndex() {
				return state.activeIndex;
			},
			get transitionPreset() {
				return state.transitionPreset;
			},
			get closeGen() {
				return state.#closeGen;
			},
			// VT open is split: mount hidden before startViewTransition (heavy
			// work off the render-suppressed path), reveal inside the callback.
			commitPrepare: () => {
				state.mounted = true;
				state.preparing = true;
			},
			commitReveal: () => {
				state.preparing = false;
				state.mounted = true;
				// Lock at reveal so the scrollbar reflow is masked by the morph;
				// the selection guard waits for onOpenComplete.
				state.#lockScroll({ deferSelectionGuard: true });
				state.#setOpenValue(true);
			},
			commitAbortPrepare: () => {
				state.preparing = false;
				state.mounted = false;
			},
			commitClose: () => {
				state.#setOpenValue(false);
				// Android Chrome: keep mounted (hidden) until `finished` — an
				// unmount inside the callback aborts the morph. Elsewhere unmount
				// now so fixed chrome only exists in the old root snapshot.
				if (isAndroidBlinkSnapshotRoot()) state.preparing = true;
				else state.mounted = false;
			},
			onOpenComplete: () => {
				state.#applySelectionGuard();
				state.#settleOpenTransition();
				state.#props.onOpenChangeComplete?.(true);
			},
			onCloseComplete: (triggerEl) => {
				state.#unlockScroll();
				state.preparing = false;
				state.mounted = false;
				if (shouldYieldBeforeCapture()) {
					requestAnimationFrame(() => state.#focusReturnTarget(triggerEl));
				} else {
					state.#focusReturnTarget(triggerEl);
				}
				state.#props.onOpenChangeComplete?.(false);
			},
			get activeZoom() {
				return state.activeZoom;
			}
		};
	}

	#settleOpenTransition() {
		this.openTransitionPending = false;
	}

	#notifyBeforeClose() {
		this.#props.onBeforeClose?.({
			destination: findDestinationMorphTarget(
				this.activeItemElement,
				this.itemMorphElements,
				this.destinationMorphElement
			)
		});
	}

	#focusReturnTarget(el: HTMLElement | null | undefined) {
		const focusVisible = this.#closeFocusVisible;
		this.#closeFocusVisible = undefined;
		if (!el) return;
		const options: FocusOptions & { focusVisible?: boolean } = { preventScroll: true };
		if (focusVisible !== undefined) options.focusVisible = focusVisible;
		el.focus(options);
	}

	// ── Scroll lock + selection guard ────────────────────────────────────────

	/**
	 * iOS Safari can select the page behind an open lightbox during touch
	 * gestures. Touch devices only: `user-select` is inherited, so writing it
	 * on <html> restyles the whole document.
	 */
	#applySelectionGuard() {
		if (this.#selectionGuardCleanup || !this.#scrollLockCleanup) return;
		if (typeof navigator === 'undefined' || navigator.maxTouchPoints <= 0) return;
		const html = document.documentElement;
		const originalUserSelect = html.style.userSelect;
		const originalWebkit = html.style.getPropertyValue('-webkit-user-select');
		html.style.userSelect = 'none';
		html.style.setProperty('-webkit-user-select', 'none');
		this.#selectionGuardCleanup = () => {
			html.style.userSelect = originalUserSelect;
			if (originalWebkit) html.style.setProperty('-webkit-user-select', originalWebkit);
			else html.style.removeProperty('-webkit-user-select');
		};
	}

	#lockScroll(options?: { deferSelectionGuard?: boolean }) {
		if (this.#scrollLockCleanup || typeof document === 'undefined') return;
		const html = document.documentElement;
		const body = document.body;
		// Compensate the classic scrollbar's width (inline-end in LTR and RTL)
		// so locking doesn't shift the page sideways.
		const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);
		const originalOverflow = html.style.overflow;
		const originalPadding = body.style.paddingInlineEnd;
		html.style.overflow = 'hidden';
		if (scrollbarWidth > 0) {
			const current = parseFloat(window.getComputedStyle(body).paddingInlineEnd) || 0;
			body.style.paddingInlineEnd = `${current + scrollbarWidth}px`;
		}
		this.#scrollLockCleanup = () => {
			html.style.overflow = originalOverflow;
			body.style.paddingInlineEnd = originalPadding;
		};
		if (!options?.deferSelectionGuard) this.#applySelectionGuard();
	}

	#unlockScroll() {
		this.#selectionGuardCleanup?.();
		this.#selectionGuardCleanup = null;
		this.#scrollLockCleanup?.();
		this.#scrollLockCleanup = null;
	}
}

const [getContext, setContext, hasContext] = createContext<LightboxState>();

export { setContext as setLightboxContext };

/** The enclosing `Lightbox.Root`'s state. Throws outside a Root. */
export function getLightboxContext(): LightboxState {
	if (!hasContext()) {
		throw new Error('Lightbox compound components must be used within a Lightbox.Root');
	}
	return getContext();
}
