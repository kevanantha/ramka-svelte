<script lang="ts" module>
	import { createContext, type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { LightboxHandle } from './lightbox-handle.svelte';

	/** Direction(s) in which the trigger↔item morph crossfades snapshots. */
	export type LightboxCrossfade = 'open' | 'close' | 'both';

	/**
	 * Values handed to a trigger's `children` snippet. Attaching them is how a
	 * consumer designates the trigger's image and morph element — no DOM guessing.
	 */
	export interface LightboxTriggerRenderState {
		/**
		 * `{@attach image}` on the trigger's `<img>`. Its decoded `currentSrc`
		 * bridges the open morph as the destination's placeholder.
		 */
		image: Attachment<HTMLImageElement>;
		/**
		 * Optional. `{@attach morph}` on the element that should morph, when it
		 * isn't the whole trigger (say, the image inside a captioned card).
		 */
		morph: Attachment<HTMLElement>;
		/** Whether the lightbox is open. */
		open: boolean;
		/** Whether this trigger's index is the active item. */
		active: boolean;
	}

	export interface LightboxTriggerProps extends Omit<HTMLButtonAttributes, 'children'> {
		/** Item index this trigger opens. */
		index: number;
		/**
		 * Stable id for this trigger, also applied as the DOM `id`. Needed for
		 * `handle.open(index, { triggerId })` to associate an open with it.
		 */
		id?: string;
		/**
		 * Handle from `Lightbox.createHandle()`. Pass the same handle as Root to
		 * use this Trigger outside the Root tree (detached triggers).
		 */
		handle?: LightboxHandle;
		/**
		 * Crossfade trigger and item snapshots during the morph. Omit for a
		 * hard-cut morph (trigger and item show the same image).
		 */
		crossfade?: LightboxCrossfade;
		/** Content; the snippet receives `image` / `morph` / `open` / `active`. */
		children?: Snippet<[LightboxTriggerRenderState]>;
		/** Bindable reference to the button element. */
		ref?: HTMLButtonElement | null;
	}

	const [getTriggerContext, setTriggerContext, hasTriggerContext] =
		createContext<LightboxTriggerRenderState>();

	/** The enclosing Trigger's render state, for nested wrappers, or `undefined`. */
	export function getLightboxTriggerContext(): LightboxTriggerRenderState | undefined {
		return hasTriggerContext() ? getTriggerContext() : undefined;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { BROWSER } from 'esm-env';
	import { getOptionalLightboxContext } from './lightbox-state.svelte';
	import {
		getLightboxHandleHost,
		registerHandleTrigger,
		touchHandleTrigger,
		type LightboxHandleTriggerRegistration
	} from './lightbox-handle.svelte';
	import { prefetchMorphRuntime } from './lightbox-morph-loader';
	import { prefetchZoomRuntime } from './lightbox-zoom-loader';
	import { prefetchPullRuntime } from './lightbox-pull-loader';
	import { ensureLibrarySheet } from './vt-style-sheets';
	import { MORPH_TARGET_HIDE_CSS, MORPH_TARGET_HIDE_MARKER } from './morph-target-hide';
	import { LightboxTriggerDataAttributes } from './lightbox-data-attributes';

	let {
		index,
		id,
		handle,
		crossfade,
		children,
		ref = $bindable(null),
		onclick,
		onpointerenter,
		onfocus,
		onpointerdown,
		...rest
	}: LightboxTriggerProps = $props();

	// Under a Root, the Root's state. Detached (outside any Root), the state of
	// the Root bound to `handle`, read through the handle.
	const lightbox = getOptionalLightboxContext();
	if (!lightbox && !untrack(() => handle)) {
		throw new Error(
			'Lightbox.Trigger must be used within a Lightbox.Root, or passed a handle from Lightbox.createHandle()'
		);
	}
	const host = $derived(!lightbox && handle ? getLightboxHandleHost(handle) : null);

	const element = $derived(ref);
	let imageNode = $state.raw<HTMLImageElement | null>(null);
	let morphNode = $state<HTMLElement | null>(null);

	const open = $derived(lightbox ? lightbox.open : (host?.isOpen ?? false));
	const active = $derived(
		open && (lightbox ? lightbox.activeIndex : (host?.activeIndex ?? 0)) === index
	);

	/** Whether this trigger is the morph source for the current state. */
	const morphTarget = $derived.by(() => {
		// A detached trigger can't resolve the Root's registries: its own
		// active state stands in.
		if (!lightbox) return active;
		if (!lightbox.open) return false;
		const activeIndex = lightbox.activeIndex;
		const morphTo = lightbox.morphTo;
		if (morphTo === 'origin') return index === lightbox.openingTriggerIndex;
		if (morphTo === 'closest') {
			const triggers = lightbox.triggerElements;
			if (triggers.has(activeIndex)) return activeIndex === index;
			let best = -1;
			let bestDist = Infinity;
			for (const idx of triggers.keys()) {
				const dist = Math.abs(idx - activeIndex);
				if (dist < bestDist) {
					bestDist = dist;
					best = idx;
				}
			}
			return index === best;
		}
		return activeIndex === index;
	});

	// Handle registration (detached or not), so `handle.open(i, { triggerId })`
	// and a detached trigger's morph resolve to this element.
	const uid = $props.id();
	const handleTriggerId = $derived(id ?? uid);
	let handleRegistration: LightboxHandleTriggerRegistration | null = null;
	$effect.pre(() => {
		const h = handle;
		if (!h) return;
		const reg: LightboxHandleTriggerRegistration = {
			id: handleTriggerId,
			index,
			element: null,
			image: null,
			morphElement: null
		};
		handleRegistration = reg;
		const unregister = registerHandleTrigger(h, reg);
		return () => {
			if (handleRegistration === reg) handleRegistration = null;
			unregister();
		};
	});
	$effect.pre(() => {
		const h = handle;
		const reg = handleRegistration;
		// Read every tracked field before bailing, so later changes re-sync.
		const nodes = { element, image: imageNode, morphElement: morphNode };
		void handleTriggerId;
		void index;
		if (!h || !reg) return;
		Object.assign(reg, nodes);
		touchHandleTrigger(h, reg);
	});

	// Under a Root, an `id` also registers here for `handle.open` lookups.
	$effect(() => {
		const triggerId = id;
		const ids = lightbox?.triggerIds;
		if (!triggerId || !ids) return;
		const entry = { id: triggerId, index, element, image: imageNode };
		ids.set(triggerId, entry);
		return () => {
			if (ids.get(triggerId) === entry) ids.delete(triggerId);
		};
	});

	// Register in the index-keyed trigger registry (last-registered wins).
	$effect(() => {
		const el = element;
		const i = index;
		if (!el || !lightbox) return;
		const registry = lightbox.triggerElements;
		registry.set(i, el);
		return () => {
			if (registry.get(i) === el) registry.delete(i);
			lightbox.triggerMorphElements.delete(el);
		};
	});

	// Register the designated morph descendant (element-keyed, so triggers
	// sharing an index stay correct). No entry → the trigger morphs itself.
	$effect(() => {
		const el = element;
		const node = morphNode;
		if (!el || !lightbox) return;
		const registry = lightbox.triggerMorphElements;
		if (node) registry.set(el, node);
		else registry.delete(el);
	});

	// `data-morph-target` on the resolved morph element hides the trigger
	// while the viewer covers it (the injected sheet below fades it).
	$effect(() => {
		const target = morphNode ?? element;
		if (!target || !morphTarget) return;
		target.setAttribute(LightboxTriggerDataAttributes.morphTarget, '');
		return () => target.removeAttribute(LightboxTriggerDataAttributes.morphTarget);
	});

	$effect(() => {
		ensureLibrarySheet(MORPH_TARGET_HIDE_MARKER, () => MORPH_TARGET_HIDE_CSS);
	});

	const image: Attachment<HTMLImageElement> = (node) => {
		imageNode = node;
		const i = index;
		const registry = lightbox?.triggerImageElements;
		registry?.set(i, node);
		return () => {
			if (imageNode === node) imageNode = null;
			if (registry?.get(i) === node) registry.delete(i);
		};
	};

	const morph: Attachment<HTMLElement> = (node) => {
		morphNode = node;
		return () => {
			if (morphNode === node) morphNode = null;
		};
	};

	// Intent warm-up: hover, focus and pointerdown all prefetch the morph chunk.
	function warmEngines() {
		if (lightbox?.viewTransition) prefetchMorphRuntime();
		prefetchZoomRuntime();
		prefetchPullRuntime();
	}

	const renderState: LightboxTriggerRenderState = {
		image,
		morph,
		get open() {
			return open;
		},
		get active() {
			return active;
		}
	};
	setTriggerContext(renderState);

	// `aria-expanded` only on the trigger that actually opened the dialog. A
	// detached trigger can't track the origin: it falls back to the open state.
	const openedByThisTrigger = $derived(
		lightbox ? open && element !== null && lightbox.openingTriggerElement === element : open
	);

	// SERVER PAINT ONLY: a server-rendered open lightbox would otherwise paint
	// its active trigger un-hidden until hydration. The trigger root is the
	// best stand-in the server knows about (a `morph` node only attaches on the
	// client); hydration removes it and the morph-target effect above puts the
	// attribute on the resolved element before the next paint. Stamped from
	// `active`, not `morphTarget`: the `closest` resolver walks a registry
	// that is empty on the server. `origin` stays unstamped (no opening
	// trigger on a server-rendered page).
	const serverMorphTarget = $derived(
		!BROWSER && active && lightbox?.morphTo !== 'origin' ? '' : undefined
	);
</script>

<button
	bind:this={ref}
	type="button"
	aria-haspopup="dialog"
	aria-expanded={openedByThisTrigger}
	aria-controls={open && lightbox ? `${lightbox.baseId}-content` : undefined}
	{id}
	data-ramka-trigger=""
	data-popup-open={open ? '' : undefined}
	data-active={active ? '' : undefined}
	data-crossfade={crossfade}
	data-morph-target={serverMorphTarget}
	{...rest}
	onclick={(event) => {
		onclick?.(event);
		if (lightbox) lightbox.openFromTrigger(index, element, imageNode);
		// Detached: open through the shared handle (associates this element).
		else handle?.open(index, { triggerId: handleTriggerId });
	}}
	onpointerenter={(event) => {
		onpointerenter?.(event);
		warmEngines();
	}}
	onfocus={(event) => {
		onfocus?.(event);
		warmEngines();
	}}
	onpointerdown={(event) => {
		onpointerdown?.(event);
		warmEngines();
	}}
>
	{@render children?.(renderState)}
</button>
