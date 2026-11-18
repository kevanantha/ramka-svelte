/**
 * Imperative handle for Lightbox.
 *
 * `createHandle()` returns a stable object you pass to `Lightbox.Root` (and
 * optionally to detached `Lightbox.Trigger`s) for programmatic control.
 *
 * The original keeps a version counter and a listener set so detached
 * Triggers can `useSyncExternalStore` the Root's state. Here the bound host is
 * `$state`, and its `open` / `activeIndex` are live reads of the Root's
 * reactive state, so a detached Trigger (or any markup reading
 * `handle.isOpen`) just re-renders when they change.
 */
import { DEV } from 'esm-env';

export interface LightboxHandleOpenOptions {
	/**
	 * ID of a `Lightbox.Trigger` registered with this handle (Trigger `id` +
	 * `handle`). Associates the open with that trigger for morph, placeholder,
	 * and focus return — including when several triggers share one index.
	 */
	triggerId?: string;
}

export interface LightboxHandle {
	/**
	 * Open the lightbox. Optional `index` sets the active item. Pass
	 * `options.triggerId` to associate the open with a registered Trigger so
	 * view-transition morph / placeholders can use that element.
	 *
	 * Call from an event handler or effect, not while rendering.
	 */
	open: (index?: number, options?: LightboxHandleOpenOptions) => void;
	/** Close the lightbox. */
	close: () => void;
	/** Navigate to an index (source: `imperative`). Does not open. */
	goTo: (index: number) => void;
	/** Whether the bound Root is currently open. Reactive. */
	readonly isOpen: boolean;
}

/** Trigger snapshot registered with a handle (may live outside Root). */
export interface LightboxHandleTriggerRegistration {
	id: string;
	index: number;
	element: HTMLElement | null;
	image: HTMLImageElement | null;
	morphElement: HTMLElement | null;
}

/** Bound Root host — set while a Root with this handle is mounted. */
export interface LightboxHandleHost {
	open: (index?: number, options?: LightboxHandleOpenOptions) => void;
	close: () => void;
	goTo: (index: number) => void;
	/** Live reads of the Root's reactive state. */
	readonly isOpen: boolean;
	readonly activeIndex: number;
	syncTrigger: (reg: LightboxHandleTriggerRegistration) => void;
	unsyncTrigger: (reg: LightboxHandleTriggerRegistration) => void;
}

class HandleState {
	host = $state.raw<LightboxHandleHost | null>(null);
	readonly triggers = new Map<string, LightboxHandleTriggerRegistration>();
}

const handleStates = new WeakMap<LightboxHandle, HandleState>();

function getHandleState(handle: LightboxHandle): HandleState {
	const state = handleStates.get(handle);
	if (!state) throw new Error('Invalid Lightbox handle');
	return state;
}

function warnUnbound(method: string) {
	if (DEV) {
		console.warn(
			`LightboxHandle.${method}() was called before a Lightbox.Root with this handle was mounted.`
		);
	}
}

/**
 * Creates a new handle to control a Lightbox imperatively and to associate
 * detached Triggers with a Root.
 *
 * @example
 * const lightbox = Lightbox.createHandle();
 *
 * <Lightbox.Trigger handle={lightbox} id="hero" index={0}>…</Lightbox.Trigger>
 * <Lightbox.Root handle={lightbox}>…</Lightbox.Root>
 *
 * lightbox.open(0, { triggerId: 'hero' });
 */
export function createHandle(): LightboxHandle {
	const state = new HandleState();
	const handle: LightboxHandle = {
		open(index, options) {
			if (!state.host) return warnUnbound('open');
			state.host.open(index, options);
		},
		close() {
			if (!state.host) return warnUnbound('close');
			state.host.close();
		},
		goTo(index) {
			if (!state.host) return warnUnbound('goTo');
			state.host.goTo(index);
		},
		get isOpen() {
			return state.host?.isOpen ?? false;
		}
	};
	handleStates.set(handle, state);
	return handle;
}

/** @internal Bind a mounted Root as the host for this handle. Returns the unbind. */
export function bindLightboxHandle(handle: LightboxHandle, host: LightboxHandleHost): () => void {
	const state = getHandleState(handle);
	if (DEV && state.host && state.host !== host) {
		console.warn('Lightbox handle is already bound to another Root.');
	}
	state.host = host;
	for (const reg of state.triggers.values()) host.syncTrigger(reg);
	return () => {
		if (state.host === host) state.host = null;
	};
}

/** @internal The bound Root host (reactive), or `null` while none is mounted. */
export function getLightboxHandleHost(handle: LightboxHandle): LightboxHandleHost | null {
	return getHandleState(handle).host;
}

/**
 * @internal Register a trigger on the handle. Returns cleanup. The
 * registration object is mutated in place by Trigger; call
 * `touchHandleTrigger` after mutating its element/image/morph fields.
 */
export function registerHandleTrigger(
	handle: LightboxHandle,
	reg: LightboxHandleTriggerRegistration
): () => void {
	const state = getHandleState(handle);
	const prev = state.triggers.get(reg.id);
	if (prev && prev !== reg) state.host?.unsyncTrigger(prev);
	state.triggers.set(reg.id, reg);
	state.host?.syncTrigger(reg);
	return () => {
		if (state.triggers.get(reg.id) !== reg) return;
		state.triggers.delete(reg.id);
		state.host?.unsyncTrigger(reg);
	};
}

/** @internal Re-sync a mutated registration object to the bound Root. */
export function touchHandleTrigger(
	handle: LightboxHandle,
	reg: LightboxHandleTriggerRegistration
): void {
	const state = getHandleState(handle);
	if (state.triggers.get(reg.id) !== reg) return;
	state.host?.syncTrigger(reg);
}

/** @internal */
export function getHandleTrigger(
	handle: LightboxHandle,
	id: string
): LightboxHandleTriggerRegistration | undefined {
	return getHandleState(handle).triggers.get(id);
}
