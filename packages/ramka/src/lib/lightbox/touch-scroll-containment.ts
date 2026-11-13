/**
 * Touch scroll containment for the open lightbox.
 *
 * iOS Safari expands its collapsed address bar when a vertical pan finds
 * nothing scrollable (the page scroll is locked), and `overscroll-behavior:
 * contain` doesn't stop it. Pull-to-dismiss cancels the vertical moves of
 * drags on the media, but deliberately ignores controls (Close, links,
 * `[data-ramka-no-pull]`), so a drag starting there would still reach the
 * browser chrome.
 *
 * This attachment cancels exactly those drags: once a single-finger drag
 * locks vertical and nothing between its target and the host can scroll that
 * way. Inner scroll containers and horizontal drags (Slides, thumbnails) stay
 * native, and taps under the lock distance are never touched.
 */
import type { Attachment } from 'svelte/attachments';

/** Same lock distance as pull-to-dismiss, so both layers agree on a "real" drag. */
const DIRECTION_LOCK_DISTANCE = 6;

/**
 * Whether `el` can consume a vertical pan of finger displacement `deltaY`
 * (positive = finger moving down = content scrolling up).
 */
function canScrollVertically(el: HTMLElement, deltaY: number): boolean {
	if (el.scrollHeight <= el.clientHeight) return false;
	const overflowY = getComputedStyle(el).overflowY;
	if (overflowY !== 'auto' && overflowY !== 'scroll') return false;
	if (deltaY > 0) return el.scrollTop > 0;
	return el.scrollTop < el.scrollHeight - el.clientHeight - 1;
}

/**
 * Whether anything from `target` up to (not including) `host` can consume the
 * pan. Checked once at the lock: iOS picks a gesture's scroller at its start.
 */
function chainCanScrollVertically(target: EventTarget | null, host: HTMLElement, deltaY: number) {
	let node = target instanceof Element ? target : null;
	while (node && node !== host) {
		if (node instanceof HTMLElement && canScrollVertically(node, deltaY)) return true;
		node = node.parentElement;
	}
	return false;
}

export const containTouchScroll: Attachment<HTMLElement> = (host) => {
	let tracking = false;
	let startX = 0;
	let startY = 0;
	/** `pending` until the lock, then latched for the whole gesture. */
	let decision: 'pending' | 'prevent' | 'allow' = 'pending';

	const handleTouchStart = (event: TouchEvent) => {
		// Multi-finger belongs to pinch-zoom; Content's pinch guard cancels it.
		tracking = event.touches.length === 1;
		decision = 'pending';
		if (!tracking) return;
		startX = event.touches[0]!.clientX;
		startY = event.touches[0]!.clientY;
	};

	const handleTouchMove = (event: TouchEvent) => {
		if (!tracking) return;
		if (event.touches.length !== 1) {
			decision = 'allow';
			return;
		}
		const touch = event.touches[0]!;
		if (decision === 'pending') {
			const deltaX = touch.clientX - startX;
			const deltaY = touch.clientY - startY;
			if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < DIRECTION_LOCK_DISTANCE) return;
			// Horizontal pans never move the address bar. Touch events keep the
			// touchstart target, so `event.target` is the chain iOS scrolls.
			decision =
				Math.abs(deltaX) > Math.abs(deltaY) || chainCanScrollVertically(event.target, host, deltaY)
					? 'allow'
					: 'prevent';
		}
		if (decision === 'prevent' && event.cancelable) event.preventDefault();
	};

	const handleTouchSettled = (event: TouchEvent) => {
		if (event.touches.length > 0) return;
		tracking = false;
		decision = 'pending';
	};

	host.addEventListener('touchstart', handleTouchStart, { passive: true });
	host.addEventListener('touchmove', handleTouchMove, { passive: false });
	host.addEventListener('touchend', handleTouchSettled, { passive: true });
	host.addEventListener('touchcancel', handleTouchSettled, { passive: true });
	return () => {
		host.removeEventListener('touchstart', handleTouchStart);
		host.removeEventListener('touchmove', handleTouchMove);
		host.removeEventListener('touchend', handleTouchSettled);
		host.removeEventListener('touchcancel', handleTouchSettled);
	};
};
