<script lang="ts" module>
	import { createContext, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export interface LightboxPortalProps extends HTMLAttributes<HTMLDivElement> {
		/**
		 * Where to mount the viewer. Defaults to `document.body`. Pass an element
		 * or a selector to portal elsewhere, or `null` to render in place.
		 */
		container?: Element | string | null;
		/** Keep Backdrop + Content in the DOM while closed (hidden and inert). */
		keepMounted?: boolean;
		children?: Snippet;
		ref?: HTMLDivElement | null;
	}

	export interface LightboxPortalContext {
		readonly keepMounted: boolean;
	}

	const [getPortalContext, setPortalContext, hasPortalContext] =
		createContext<LightboxPortalContext>();

	export function getLightboxPortalContext(): LightboxPortalContext {
		return hasPortalContext() ? getPortalContext() : { keepMounted: false };
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { getLightboxContext } from './lightbox-state.svelte';
	import { resolveViewTransitionTiming } from './vt-timing';
	import { LightboxDocumentCssVars } from './lightbox-css-vars';

	let {
		container = undefined,
		keepMounted = false,
		children,
		ref = $bindable(null),
		style,
		...rest
	}: LightboxPortalProps = $props();

	const lightbox = getLightboxContext();

	setPortalContext({
		get keepMounted() {
			return keepMounted;
		}
	});

	// Publish the preset's motion vars on the host so skins can read them for
	// their own fades, with or without a running morph.
	const hostStyle = $derived.by(() => {
		const timing = resolveViewTransitionTiming(lightbox.transitionPreset);
		return (
			`${LightboxDocumentCssVars.vtDuration}: ${timing.duration}ms;` +
			`${LightboxDocumentCssVars.vtEasing}: ${timing.cssEasing};` +
			`${LightboxDocumentCssVars.vtRootEasing}: ${timing.cssRootEasing};` +
			(style ?? '')
		);
	});

	/**
	 * Children render only once the host sits in its target. Moving a node
	 * resets the scroll position of everything inside it, so moving after
	 * Slides had scrolled to the opening index snapped it back to 0 — and
	 * Slides then settled on 0, sending the open morph to the wrong item.
	 * Inside a `flushSync` (the morph's prepare) the extra pass still lands in
	 * the same flush.
	 */
	// In-place hosts (`container={null}`) render their children right away,
	// so a server-rendered open viewer is in the HTML — the deep-link pattern.
	// A real portal target only exists in the browser.
	let placed = $state(untrack(() => container) === null);

	/**
	 * Moves the host to the target. Safe with Svelte: the `{#if}` block below
	 * holds exactly this element, removed by reference on unmount, and
	 * delegated events are also listened for on `document` for moved nodes.
	 * `container` is read once per mount.
	 */
	const portal: Attachment<HTMLElement> = (node) => {
		const target = untrack(() => container);
		if (target !== null) {
			const resolved =
				target === undefined
					? document.body
					: typeof target === 'string'
						? document.querySelector(target)
						: target;
			resolved?.appendChild(node);
		}
		placed = true;
		return () => {
			placed = false;
		};
	};
</script>

{#if lightbox.mounted || keepMounted}
	<div
		bind:this={ref}
		{@attach portal}
		dir={lightbox.dirAttribute}
		{...rest}
		style={hostStyle}
		data-ramka-portal=""
	>
		{#if placed}
			{@render children?.()}
		{/if}
	</div>
{/if}
