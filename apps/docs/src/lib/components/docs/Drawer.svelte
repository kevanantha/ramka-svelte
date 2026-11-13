<!--
  Bottom sheet for the mobile nav, after the original docs' Base UI drawer
  (swipeDirection="down", showSwipeHandle): modal, a dimmed + blurred
  overlay, slides up on open, follows a downward drag and dismisses past a
  threshold or on a flick. Escape, an overlay tap and `open = false` close it;
  focus is trapped inside and returned to the opener.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import type { Attachment } from 'svelte/attachments';

	let {
		open = $bindable(false),
		title,
		description,
		children
	}: { open?: boolean; title: string; description?: string; children: Snippet } = $props();

	const EASE = 'cubic-bezier(0.22,1,0.36,1)';
	const id = $props.id();

	let popup = $state.raw<HTMLElement | null>(null);
	/** Drag offset (px, ≥ 0) while the user pulls the sheet down. */
	let dragY = $state(0);
	let dragging = $state(false);

	/** Mount on document.body so the sheet escapes the sticky header's stacking context. */
	const portal: Attachment<HTMLElement> = (node) => {
		document.body.appendChild(node);
		return () => node.remove();
	};

	// Focus in, scroll lock, focus back to the opener on close.
	const modal: Attachment<HTMLElement> = (node) => {
		const opener = document.activeElement as HTMLElement | null;
		const html = document.documentElement;
		const overflow = html.style.overflow;
		html.style.overflow = 'hidden';
		// After the outer `portal` attachment has moved the sheet to <body>;
		// moving a focused node drops its focus.
		queueMicrotask(() => node.focus({ preventScroll: true }));
		return () => {
			html.style.overflow = overflow;
			opener?.focus({ preventScroll: true });
		};
	};

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			open = false;
			return;
		}
		if (event.key !== 'Tab' || !popup) return;
		const focusables = [
			...popup.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]')
		];
		if (focusables.length === 0) return;
		const first = focusables[0]!;
		const last = focusables[focusables.length - 1]!;
		const current = document.activeElement;
		if (event.shiftKey && (current === first || current === popup)) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && current === last) {
			event.preventDefault();
			first.focus();
		}
	}

	// Swipe to dismiss, after Base UI's drawer: drag down from anywhere on the
	// sheet while its list is scrolled to the top. On release it closes when
	// the drag passes half the sheet's height, or when the whole gesture
	// averaged at least 0.5px/ms (timed from the first move, at least 50ms).
	let downY = 0;
	let startY = 0;
	let startT = 0;
	let moved = false;
	let fromScroller = false;
	let pointerId: number | null = null;

	function onpointerdown(event: PointerEvent) {
		if (event.button !== 0) return;
		const scroller = (event.target as Element).closest('[data-drawer-scroll]');
		if (scroller && scroller.scrollTop > 0) return;
		pointerId = event.pointerId;
		downY = event.clientY;
		moved = false;
		fromScroller = !!scroller && scroller.scrollHeight > scroller.clientHeight;
	}

	function onpointermove(event: PointerEvent) {
		if (event.pointerId !== pointerId) return;
		// Like Base UI, measure from the first move, absorbing the gap a touch
		// travels before its first touchmove; from the scrolling list, keep the
		// press position so quick flicks still dismiss.
		if (!moved) {
			moved = true;
			startY = fromScroller ? downY : event.clientY;
			startT = event.timeStamp;
		}
		const dy = event.clientY - startY;
		if (!dragging) {
			if (dy < 6) return;
			dragging = true;
			popup?.setPointerCapture(event.pointerId);
		}
		dragY = Math.max(0, dy);
	}

	function onpointerup(event: PointerEvent) {
		if (event.pointerId !== pointerId) return;
		pointerId = null;
		if (!dragging) return;
		dragging = false;
		const dy = event.clientY - startY;
		const velocity = dy / Math.max(event.timeStamp - startT, 50);
		const threshold = Math.max((popup?.offsetHeight ?? 0) * 0.5, 10);
		if (dy > 0 && (velocity >= 0.5 || dy > threshold)) open = false;
		else dragY = 0;
	}

	/** Keep the browser from scrolling (and cancelling the pointer) once a touch pulls the sheet down. */
	const holdTouch: Attachment<HTMLElement> = (node) => {
		const ontouchmove = (event: TouchEvent) => {
			if (pointerId === null || !event.cancelable) return;
			if (dragging || event.touches[0]!.clientY > downY) event.preventDefault();
		};
		node.addEventListener('touchmove', ontouchmove, { passive: false });
		return () => node.removeEventListener('touchmove', ontouchmove);
	};

	/** Slide the sheet in/out from its current drag offset. */
	function sheet(_node: Element) {
		const from = dragY;
		return {
			duration: 450,
			easing: cubicOut,
			css: (t: number) => {
				const y = `calc(${(1 - t) * 100}% + ${from * t}px + ${(1 - t) * 2}px)`;
				return `transform: translate3d(0, ${y}, 0)`;
			}
		};
	}

	function fade(_node: Element) {
		return { duration: 450, css: (t: number) => `opacity: ${t}` };
	}

	$effect(() => {
		if (!open) dragY = 0;
	});
</script>

{#if open}
	<div {@attach portal} class="relative z-50">
		<div
			transition:fade
			class="fixed inset-0 z-50 min-h-dvh bg-black/10 select-none supports-backdrop-filter:backdrop-blur-xs"
			style:opacity={popup && dragY > 0 ? 1 - dragY / popup.offsetHeight : undefined}
			onclick={() => (open = false)}
			aria-hidden="true"
		></div>
		<div
			bind:this={popup}
			{@attach modal}
			{@attach holdTouch}
			transition:sheet
			role="dialog"
			aria-modal="true"
			aria-labelledby="{id}-title"
			aria-describedby={description ? `${id}-description` : undefined}
			tabindex="-1"
			{onkeydown}
			{onpointerdown}
			{onpointermove}
			{onpointerup}
			onpointercancel={onpointerup}
			data-swiping={dragging ? '' : undefined}
			class="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] min-h-0 flex-col rounded-t-xl border-t bg-popover text-sm text-popover-foreground outline-none select-none after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-12 after:bg-popover"
			style:transform="translate3d(0, {dragY}px, 0)"
			style:transition={dragging ? 'none' : `transform 450ms ${EASE}`}
		>
			<div
				aria-hidden="true"
				class="relative z-10 flex h-3 w-full shrink-0 cursor-grab items-end justify-center after:block after:h-1 after:w-24 after:shrink-0 after:rounded-full after:bg-muted active:cursor-grabbing"
			></div>
			<div
				class="flex min-h-0 flex-1 flex-col overflow-hidden overscroll-contain rounded-[inherit] select-text"
			>
				<div class="flex shrink-0 flex-col gap-0.5 p-4 pb-0 text-left">
					<h2 id="{id}-title" class="text-base font-medium text-foreground">{title}</h2>
					{#if description}
						<p id="{id}-description" class="text-sm text-balance text-muted-foreground">
							{description}
						</p>
					{/if}
				</div>
				{@render children()}
			</div>
		</div>
	</div>
{/if}
