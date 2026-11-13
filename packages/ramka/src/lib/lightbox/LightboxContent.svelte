<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export interface LightboxContentProps extends HTMLAttributes<HTMLDivElement> {
		ref?: HTMLDivElement | null;
	}

	const TABBABLE_SELECTOR = [
		'a[href]',
		'area[href]',
		'input:not([disabled]):not([type="hidden"])',
		'select:not([disabled])',
		'textarea:not([disabled])',
		'button:not([disabled])',
		'[tabindex]:not([tabindex="-1"])'
	].join(',');

	function getTabbableElements(container: HTMLElement): HTMLElement[] {
		return Array.from(container.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR)).filter(
			(el) => !el.hasAttribute('data-focus-guard')
		);
	}

	/** Focus that fell to nowhere (removed node, click on a non-focusable). */
	function isStrandedFocus(node: Element | null | undefined): boolean {
		return !node || node === document.body || node === document.documentElement;
	}

	const FOCUS_GUARD_STYLE =
		'position: fixed; overflow: hidden; width: 1px; height: 1px; top: 0; inset-inline-start: 0;' +
		'padding: 0; border: 0; clip: rect(0, 0, 0, 0); white-space: nowrap;';
</script>

<script lang="ts">
	import { DEV } from 'esm-env';
	import { getLightboxContext } from './lightbox-state.svelte';
	import { getLightboxPortalContext } from './LightboxPortal.svelte';
	import { arrowKeyIndexDelta } from './lightbox-direction';

	let {
		ref = $bindable(null),
		children,
		style,
		onkeydown,
		onpointerdown,
		onclick,
		...rest
	}: LightboxContentProps = $props();

	const lightbox = getLightboxContext();
	const portal = getLightboxPortalContext();

	const present = $derived(lightbox.mounted || portal.keepMounted);
	const parked = $derived(portal.keepMounted && !lightbox.mounted);

	$effect(() => {
		const el = ref;
		if (!el) return;
		lightbox.dialogElement = el;
		return () => {
			if (lightbox.dialogElement === el) lightbox.dialogElement = null;
		};
	});

	// Move focus into the dialog once it is visible (not while preparing).
	$effect(() => {
		if (lightbox.mounted && !lightbox.preparing) ref?.focus({ preventScroll: true });
	});

	if (DEV) {
		$effect(() => {
			if (!lightbox.mounted || parked || !ref) return;
			const hasName =
				!!ref.getAttribute('aria-label')?.trim() || !!ref.getAttribute('aria-labelledby')?.trim();
			if (!hasName) {
				console.warn(
					'[ramka] Lightbox.Content (role="dialog") has no accessible name. ' +
						'Pass `aria-label` (e.g. aria-label="Image viewer") or `aria-labelledby` ' +
						'so screen readers announce the dialog.'
				);
			}
		});
	}

	// Keep focus inside while open: when it leaves for nowhere (a focused
	// slide unmounted, a click on a non-focusable), pull it back.
	$effect(() => {
		const el = ref;
		if (!lightbox.mounted || !el) return;
		const handleFocusOut = (event: FocusEvent) => {
			if (!lightbox.open) return;
			const next = event.relatedTarget as Element | null;
			if (next && el.contains(next)) return;
			if (next && !isStrandedFocus(next)) return;
			queueMicrotask(() => {
				if (!lightbox.open) return;
				const active = document.activeElement;
				if (active && el.contains(active)) return;
				if (active && !isStrandedFocus(active)) return;
				el.focus({ preventScroll: true });
			});
		};
		el.addEventListener('focusout', handleFocusOut);
		return () => el.removeEventListener('focusout', handleFocusOut);
	});

	function handleKeyDown(event: KeyboardEvent) {
		if (!lightbox.mounted) return;
		const el = ref;
		const target = event.target as Node | null;
		if (el && target && !el.contains(target)) return;
		if (event.defaultPrevented) return;

		if (event.key === 'Escape') {
			event.preventDefault();
			lightbox.setOpen(false, { focusVisible: true });
			return;
		}

		// Let text inputs inside the viewer keep their keys.
		const targetEl = target instanceof HTMLElement ? target : null;
		if (
			targetEl &&
			(targetEl.isContentEditable ||
				targetEl.closest(
					'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
				))
		) {
			return;
		}
		if (event.metaKey || event.ctrlKey || event.altKey) return;

		const itemCount = lightbox.itemCount;
		if (itemCount === 0) return;
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
		if (nextIndex !== activeIndex) {
			event.preventDefault();
			lightbox.navigate(nextIndex, 'keyboard');
		}
	}

	// Scrim click: only when the press both started and ended on Content
	// itself, so a drag that ends over the scrim doesn't dismiss.
	let pressStartedOnScrim = false;

	function focusEdge(edge: 'first' | 'last') {
		const el = ref;
		if (!el) return;
		const tabbables = getTabbableElements(el);
		const target = (edge === 'first' ? tabbables[0] : tabbables[tabbables.length - 1]) ?? el;
		target.focus();
	}
</script>

{#if present}
	{#if !parked}
		<!-- Focus guards carry no aria-hidden (a focusable aria-hidden node is
		     invalid ARIA); focus never rests here — onfocus redirects. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<span
			tabindex="0"
			data-focus-guard=""
			style={FOCUS_GUARD_STYLE}
			onfocus={() => focusEdge('last')}
		></span>
	{/if}
	<div
		bind:this={ref}
		role="dialog"
		id="{lightbox.baseId}-content"
		aria-modal={parked ? undefined : 'true'}
		aria-hidden={parked ? 'true' : undefined}
		inert={parked}
		tabindex={parked ? undefined : -1}
		{...rest}
		style="overflow: hidden; overscroll-behavior: contain; user-select: none; -webkit-user-select: none;{style ??
			''};{lightbox.preparing || parked ? 'visibility: hidden;' : ''}{parked
			? 'pointer-events: none;'
			: ''}"
		data-ramka-content=""
		data-open={lightbox.open ? '' : undefined}
		data-closed={lightbox.open ? undefined : ''}
		onkeydown={(event) => {
			onkeydown?.(event);
			handleKeyDown(event);
		}}
		onpointerdown={(event) => {
			onpointerdown?.(event);
			pressStartedOnScrim = event.target === event.currentTarget;
		}}
		onclick={(event) => {
			onclick?.(event);
			if (!lightbox.mounted) return;
			const startedOnScrim = pressStartedOnScrim;
			pressStartedOnScrim = false;
			if (startedOnScrim && event.target === event.currentTarget) {
				lightbox.setOpen(false, { focusVisible: false });
			}
		}}
	>
		{@render children?.()}
	</div>
	{#if !parked}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<span
			tabindex="0"
			data-focus-guard=""
			style={FOCUS_GUARD_STYLE}
			onfocus={() => focusEdge('first')}
		></span>
	{/if}
{/if}
