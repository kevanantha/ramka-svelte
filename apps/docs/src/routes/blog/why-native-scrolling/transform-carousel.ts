import type { Attachment } from 'svelte/attachments';

/**
 * The article's stand-in for a typical transform-emulated carousel, as an
 * attachment on the viewport (its first child is the track): pointer drag
 * with velocity tracking, an exponential-decay momentum loop on release (the
 * reverse-engineered iOS constant, 0.95 per 60fps frame), rubber-banding past
 * the edges, and a non-passive wheel handler for trackpads.
 *
 * This is deliberately a GOOD implementation of the pattern. The article's
 * argument is not that this code is badly written; it is that every frame of
 * it runs on the main thread.
 *
 * `decel` is read every frame, so a slider can retune a live fling.
 */
export function transformCarousel(decel: () => number = () => 0.95): Attachment<HTMLElement> {
	return (viewport) => {
		const track = viewport.firstElementChild as HTMLElement;

		let offset = 0;
		let velocity = 0; // px per 60fps frame
		let raf = 0;
		let dragging = false;
		let lastX = 0;
		let lastT = 0;

		const minOffset = () => Math.min(0, viewport.clientWidth - track.scrollWidth);

		/** Apple's Designing Fluid Interfaces rubber band, coefficient 0.55. */
		const rubber = (overshoot: number) => {
			const dim = viewport.clientWidth;
			return (overshoot * dim * 0.55) / (dim + 0.55 * Math.abs(overshoot));
		};

		const render = () => {
			let visual = offset;
			if (offset > 0) visual = rubber(offset);
			else if (offset < minOffset()) visual = minOffset() + rubber(offset - minOffset());
			track.style.transform = `translate3d(${visual}px, 0, 0)`;
		};

		const stop = () => cancelAnimationFrame(raf);

		const momentum = () => {
			let prev = performance.now();
			const tick = (now: number) => {
				const frames = Math.min((now - prev) / 16.7, 3);
				prev = now;
				velocity *= Math.pow(decel(), frames);
				offset += velocity * frames;

				// Past an edge: drop the fling and spring back to the bound.
				const min = minOffset();
				if (offset > 0) {
					velocity = 0;
					offset += (0 - offset) * 0.18;
					if (Math.abs(offset) < 0.5) offset = 0;
				} else if (offset < min) {
					velocity = 0;
					offset += (min - offset) * 0.18;
					if (Math.abs(offset - min) < 0.5) offset = min;
				}

				render();
				if (
					Math.abs(velocity) > 0.05 ||
					(offset > 0 && offset !== 0) ||
					(offset < min && offset !== min)
				) {
					raf = requestAnimationFrame(tick);
				}
			};
			raf = requestAnimationFrame(tick);
		};

		const onPointerDown = (e: PointerEvent) => {
			dragging = true;
			stop();
			velocity = 0;
			lastX = e.clientX;
			lastT = e.timeStamp;
			viewport.setPointerCapture(e.pointerId);
		};

		const onPointerMove = (e: PointerEvent) => {
			if (!dragging) return;
			const dx = e.clientX - lastX;
			const dt = Math.max(e.timeStamp - lastT, 1);
			lastX = e.clientX;
			lastT = e.timeStamp;
			offset += dx;
			velocity = (dx / dt) * 16.7;
			render();
		};

		const onPointerUp = () => {
			if (!dragging) return;
			dragging = false;
			momentum();
		};

		// Trackpad support the way transform carousels do it: a wheel listener
		// that must be non-passive to call preventDefault. Horizontal intent only,
		// so vertical page scrolling stays untouched.
		const onWheel = (e: WheelEvent) => {
			if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
			e.preventDefault();
			stop();
			velocity = 0;
			offset = Math.max(minOffset(), Math.min(0, offset - e.deltaX));
			render();
		};

		viewport.addEventListener('pointerdown', onPointerDown);
		viewport.addEventListener('pointermove', onPointerMove);
		viewport.addEventListener('pointerup', onPointerUp);
		viewport.addEventListener('pointercancel', onPointerUp);
		viewport.addEventListener('wheel', onWheel, { passive: false });
		render();

		return () => {
			stop();
			viewport.removeEventListener('pointerdown', onPointerDown);
			viewport.removeEventListener('pointermove', onPointerMove);
			viewport.removeEventListener('pointerup', onPointerUp);
			viewport.removeEventListener('pointercancel', onPointerUp);
			viewport.removeEventListener('wheel', onWheel);
		};
	};
}
