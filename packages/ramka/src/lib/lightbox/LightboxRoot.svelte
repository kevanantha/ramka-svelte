<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type {
		LightboxBeforeClose,
		LightboxBeforeOpen,
		NavigationSource
	} from './lightbox-state.svelte';
	import type { ScrollTriggerIntoView } from './scroll-trigger';
	import type { TextDirection } from './lightbox-direction';
	import type { LightboxViewTransitionPreset } from './vt-timing';
	import type { LightboxHandle } from './lightbox-handle.svelte';

	export interface LightboxRootProps {
		/** Lightbox parts and page content (triggers usually live inside Root). */
		children?: Snippet;
		/**
		 * Imperative handle from `Lightbox.createHandle()`. Pass the same handle
		 * to detached `Lightbox.Trigger`s outside this Root.
		 */
		handle?: LightboxHandle;
		/** Open state. Bindable: `bind:open`. @default false */
		open?: boolean;
		/** Called when open state changes, before enter/exit animations finish. */
		onOpenChange?: (open: boolean) => void;
		/** Called when the open/close transition settles. */
		onOpenChangeComplete?: (open: boolean) => void;
		/** Active index. Bindable: `bind:value`. @default 0 */
		value?: number;
		/** Called when the active index changes, with what caused it. */
		onValueChange?: (value: number, metadata: { source: NavigationSource }) => void;
		/** Item total, used until the mounted items have registered (SSR-open pages). */
		count?: number;
		/** Wrap navigation at boundaries. @default false */
		loop?: boolean;
		/**
		 * Reading direction. `'rtl'` mirrors slide navigation and arrow keys, and
		 * is written to the portal host as `dir`. @default 'ltr' (behavior)
		 */
		dir?: TextDirection;
		/**
		 * Morph between trigger and item with the View Transitions API. Pass a
		 * preset (`'default' | 'snappy' | 'relaxed' | 'spring'`) to pick the
		 * motion, or `false` to skip the morph engine. Falls back to a fade when
		 * unsupported, under reduced motion, or on low-end devices.
		 * @default true
		 */
		viewTransition?: boolean | LightboxViewTransitionPreset;
		/** Scroll the close-morph trigger into view (see the docs for moments). */
		scrollTriggerIntoView?: ScrollTriggerIntoView;
		/** Which trigger the close morph lands on. @default 'active' */
		morphTo?: 'active' | 'origin' | 'closest';
		/** How long the open morph waits for the destination image. @default true (~200ms) */
		awaitImageDecode?: boolean | number;
		/** Await custom media readiness before the open morph starts. */
		onBeforeOpen?: LightboxBeforeOpen;
		/** Freeze custom media just before the close snapshot. */
		onBeforeClose?: LightboxBeforeClose;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { LightboxState, setLightboxContext } from './lightbox-state.svelte';
	import { getLightboxStyleNonce } from './lightbox-csp';
	import { serverPaintStyleTags } from './server-paint-styles';

	let {
		children,
		handle,
		open = $bindable(false),
		onOpenChange,
		onOpenChangeComplete,
		value = $bindable(0),
		onValueChange,
		count,
		loop = false,
		dir,
		viewTransition = true,
		scrollTriggerIntoView = null,
		morphTo = 'active',
		awaitImageDecode = true,
		onBeforeOpen,
		onBeforeClose
	}: LightboxRootProps = $props();

	const uid = $props.id();
	const state = new LightboxState(
		{
			get open() {
				return open;
			},
			set open(next) {
				open = next;
			},
			get value() {
				return value;
			},
			set value(next) {
				value = next;
			},
			get onOpenChange() {
				return onOpenChange;
			},
			get onOpenChangeComplete() {
				return onOpenChangeComplete;
			},
			get onValueChange() {
				return onValueChange;
			},
			get onBeforeOpen() {
				return onBeforeOpen;
			},
			get onBeforeClose() {
				return onBeforeClose;
			},
			get count() {
				return count;
			},
			get loop() {
				return loop;
			},
			get dir() {
				return dir;
			},
			get viewTransition() {
				return viewTransition;
			},
			get morphTo() {
				return morphTo;
			},
			get scrollTriggerIntoView() {
				return scrollTriggerIntoView;
			},
			get awaitImageDecode() {
				return awaitImageDecode;
			}
		},
		uid
	);
	state.connect();
	setLightboxContext(state);

	// Bind a `createHandle()` handle for this Root's lifetime (before paint, so
	// a handle call from a sibling's mount effect already reaches the Root).
	$effect.pre(() => {
		const h = handle;
		if (!h) return;
		return untrack(() => state.bindHandle(h));
	});

	const styleNonce = getLightboxStyleNonce();
	// A Root open at creation may be server-painted open, so it renders the
	// first-paint rules into the head (see server-paint-styles.ts). Decided once
	// so the server and hydration renders agree.
	const serverPaintStyles = untrack(() => open) ? serverPaintStyleTags(styleNonce.nonce) : '';
</script>

<svelte:head>
	{#if serverPaintStyles}
		{@html serverPaintStyles}
	{/if}
</svelte:head>

{@render children?.()}
