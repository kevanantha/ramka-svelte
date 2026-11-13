<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export interface LightboxContentProps extends HTMLAttributes<HTMLDivElement> {
		ref?: HTMLDivElement | null;
		/**
		 * Drag the image vertically (touch, or a two-finger trackpad swipe) to
		 * close. Its engine is a separate chunk; `false` skips the download.
		 * @default true
		 */
		pullToClose?: boolean;
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
	import { getPullRuntimeSync, loadPullRuntime } from './lightbox-pull-loader';
	import type { PullToDismissHost } from './pull-to-dismiss.svelte';
	import { containTouchScroll } from './touch-scroll-containment';

	let {
		ref = $bindable(null),
		pullToClose = true,
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

	// Block native pinch-zoom (touch and trackpad) on the whole document while
	// mounted. Per-Zoom guards aren't enough: while the viewer is still hidden
	// mid-open, a pinch lands on the page, zooms it natively, and the viewer's
	// guards then trap it zoomed. Our own Zoom handlers still run —
	// preventDefault only cancels the browser's default.
	$effect(() => {
		if (!lightbox.mounted || parked) return;
		let pinching = false;
		const onTouchMove = (event: TouchEvent) => {
			// Two fingers: page pinch. A leftover finger after a pinch: native
			// gallery scroll, which would lock Slides with no `scrollend`.
			if (event.touches.length > 1 || pinching) event.preventDefault();
		};
		const onTouchStart = (event: TouchEvent) => {
			if (event.touches.length > 1) pinching = true;
		};
		const onTouchEnd = (event: TouchEvent) => {
			if (event.touches.length === 0) pinching = false;
		};
		// Safari pinches with GestureEvent; preventing it needs no wheel
		// listener (a non-passive ancestor wheel listener kills Safari's
		// momentum scrolling). Elsewhere trackpad pinch is ctrl+wheel.
		const safari = 'GestureEvent' in window;
		const onGesture = (event: Event) => event.preventDefault();
		const onWheel = (event: WheelEvent) => {
			if (event.ctrlKey) event.preventDefault();
		};
		document.addEventListener('touchmove', onTouchMove, { passive: false });
		document.addEventListener('touchstart', onTouchStart, { passive: true });
		document.addEventListener('touchend', onTouchEnd, { passive: true });
		document.addEventListener('touchcancel', onTouchEnd, { passive: true });
		if (safari) {
			document.addEventListener('gesturestart', onGesture);
			document.addEventListener('gesturechange', onGesture);
		} else {
			document.addEventListener('wheel', onWheel, { passive: false });
		}
		return () => {
			document.removeEventListener('touchmove', onTouchMove);
			document.removeEventListener('touchstart', onTouchStart);
			document.removeEventListener('touchend', onTouchEnd);
			document.removeEventListener('touchcancel', onTouchEnd);
			document.removeEventListener('gesturestart', onGesture);
			document.removeEventListener('gesturechange', onGesture);
			document.removeEventListener('wheel', onWheel);
		};
	});

	// Pull-to-dismiss. The engine loads with the first open (Trigger intent
	// usually has it cached by then); Close, Escape and the scrim still work if
	// it never arrives.
	let pullRuntime = $state.raw(getPullRuntimeSync());
	$effect(() => {
		if (!pullToClose || pullRuntime || !lightbox.mounted) return;
		let cancelled = false;
		loadPullRuntime().then(
			(runtime) => {
				if (!cancelled) pullRuntime = runtime;
			},
			(error: unknown) => {
				if (DEV) console.warn('[ramka] The pull-to-dismiss runtime failed to load.', error);
			}
		);
		return () => {
			cancelled = true;
		};
	});
	const pullHost: PullToDismissHost = {
		get open() {
			return lightbox.open;
		},
		get backdrop() {
			return lightbox.backdropElement;
		},
		// The shared morph destination pulls as one unit, so carousels can keep
		// clipping neighbours; otherwise the active slide moves.
		get dragTarget() {
			return lightbox.destinationMorphElement ?? lightbox.activeItemElement;
		},
		// Stage scopes touch and wheel pull to the media pane; else Content.
		get stage() {
			return lightbox.stageElement;
		},
		get navigationLocked() {
			return lightbox.navigationLocked;
		},
		getZoom: () => lightbox.activeZoom?.getZoom() ?? 1,
		// A touch gesture: return focus to the trigger without a focus ring.
		close: () => lightbox.setOpen(false, { focusVisible: false })
	};
	const pullAttachment = $derived(pullRuntime?.pullToDismiss(pullHost));
	const live = $derived(lightbox.mounted && !parked);

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
		// Modified keys belong to the browser: ⌘/Ctrl + `+` `-` `0` is page zoom
		// (WCAG 1.4.4 text resize), Alt/⌘ + arrows are history and caret moves.
		if (event.metaKey || event.ctrlKey || event.altKey) return;

		// With a Stage, media keys (zoom, pan, arrows / Home / End) act while
		// focus is inside it or on Content itself; Escape stays dialog-wide.
		const stage = lightbox.stageElement;
		const focusOutsideStage = !!stage && !!target && target !== el && !stage.contains(target);

		// Image zoom rides the bare keys: `+`/`=` in, `-`/`_` out, `0` resets.
		const zoom = lightbox.activeZoom;
		const zoomInKey = event.key === '+' || event.key === '=';
		const zoomOutKey = event.key === '-' || event.key === '_';
		if (zoomInKey || zoomOutKey || event.key === '0') {
			event.preventDefault();
			if (lightbox.navigationLocked || !zoom || focusOutsideStage) return;
			if (zoomInKey) zoom.zoomIn();
			else if (zoomOutKey) zoom.zoomOut();
			else zoom.reset();
			return;
		}

		const navKey = event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End';
		if (navKey && focusOutsideStage) return;

		// While zoomed, arrows pan (physically, in both reading directions)
		// instead of navigating.
		if (zoom && event.key.startsWith('Arrow') && zoom.getZoom() > 1) {
			const d = zoom.keyboardPanDistance;
			const [dx, dy] =
				event.key === 'ArrowRight'
					? [d, 0]
					: event.key === 'ArrowLeft'
						? [-d, 0]
						: event.key === 'ArrowDown'
							? [0, d]
							: [0, -d];
			event.preventDefault();
			zoom.panBy(dx, dy);
			return;
		}

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
		{@attach live && pullToClose ? pullAttachment : null}
		{@attach live ? containTouchScroll : null}
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
