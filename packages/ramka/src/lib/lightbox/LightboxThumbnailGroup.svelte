<script lang="ts" module>
	import { createContext } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export interface LightboxThumbnailGroupProps extends HTMLAttributes<HTMLDivElement> {
		ref?: HTMLDivElement | null;
	}

	/** Index → thumbnail button, for roving focus. */
	type ThumbnailRegistry = Map<number, HTMLElement>;

	const [getGroupContext, setGroupContext, hasGroupContext] = createContext<ThumbnailRegistry>();

	export function getLightboxThumbnailGroupContext(): ThumbnailRegistry | undefined {
		return hasGroupContext() ? getGroupContext() : undefined;
	}
</script>

<script lang="ts">
	import { getLightboxContext } from './lightbox-state.svelte';
	import { arrowKeyIndexDelta } from './lightbox-direction';
	import { getLightboxThumbnailStripContextOptional } from './lightbox-thumbnail-strip-context';

	let {
		ref = $bindable(null),
		children,
		onkeydown,
		onfocusin,
		onfocusout,
		...rest
	}: LightboxThumbnailGroupProps = $props();

	const lightbox = getLightboxContext();
	const thumbs = setGroupContext(new Map());
	const strip = getLightboxThumbnailStripContextOptional();
	let focusWithin = $state(false);

	// Items switch to tabpanel semantics while a tablist is mounted.
	$effect(() => lightbox.registerTablist());

	// Roving tabindex: arrows/Home/End select and focus (APG tabs, automatic activation).
	function handleKeyDown(event: KeyboardEvent) {
		const itemCount = lightbox.itemCount;
		const activeIndex = lightbox.activeIndex;
		const delta = arrowKeyIndexDelta(event.key, lightbox.dir);
		let nextIndex: number;
		if (delta !== 0) {
			nextIndex = lightbox.loop
				? (activeIndex + delta + itemCount) % itemCount
				: Math.min(Math.max(activeIndex + delta, 0), itemCount - 1);
		} else if (event.key === 'Home') {
			nextIndex = 0;
		} else if (event.key === 'End') {
			nextIndex = itemCount - 1;
		} else {
			return;
		}
		// Content would otherwise handle the same arrow as gallery navigation.
		event.preventDefault();
		if (lightbox.navigationLocked || itemCount === 0 || nextIndex === activeIndex) return;
		// Inside a ThumbnailStrip, reuse its scrub path so arrow keys match
		// pointer motion, but keep the stage commit instant (no Slides view
		// transition), like all other keyboard navigation.
		if (strip) strip.selectIndex(nextIndex, { source: 'thumbnail', stageViewTransition: false });
		else lightbox.setActiveIndex(nextIndex, 'thumbnail');
		thumbs.get(nextIndex)?.focus();
	}
</script>

<div
	bind:this={ref}
	role="tablist"
	data-focus-within={focusWithin ? '' : undefined}
	{...rest}
	data-ramka-thumbnail-group=""
	onkeydown={(event) => {
		onkeydown?.(event);
		handleKeyDown(event);
	}}
	onfocusin={(event) => {
		onfocusin?.(event);
		focusWithin = true;
	}}
	onfocusout={(event) => {
		onfocusout?.(event);
		if (!event.currentTarget.contains(event.relatedTarget as Node | null)) focusWithin = false;
	}}
>
	{@render children?.()}
</div>
