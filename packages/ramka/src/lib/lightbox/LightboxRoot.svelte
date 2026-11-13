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

	export interface LightboxRootProps {
		/** Lightbox parts and page content (triggers usually live inside Root). */
		children?: Snippet;
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
	import { LightboxState, setLightboxContext } from './lightbox-state.svelte';

	let {
		children,
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

	const state = new LightboxState({
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
	});
	state.connect();
	setLightboxContext(state);
</script>

{@render children?.()}
