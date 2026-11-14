<!--
  Demo 1: the same image strip twice. The top one is a real scroller, the
  bottom one a well-built transform carousel. The segmented control runs
  synthetic long tasks on the main thread (what image decode, hydration, or
  an analytics script do for free), and the difference stops being abstract.
-->
<script lang="ts">
	import Strip from './Strip.svelte';
	import StripLabel from './StripLabel.svelte';

	const LEVELS = [
		{ label: 'Idle', ms: 0 },
		{ label: 'Busy', ms: 50 },
		{ label: 'Slammed', ms: 140 }
	] as const;

	let level = $state(0);
	let inView = $state(false);
	let heartbeat = $state.raw<HTMLElement>();
	let worstReadout = $state.raw<HTMLElement>();

	// The synthetic load must not outlive the demo: leaving Slammed on and
	// scrolling away would jank the rest of the article, which stops being a
	// demo and starts being a bug. The selected level is kept, the interval is
	// paused, and it resumes when the reader scrolls back.
	function observeInView(node: HTMLElement) {
		const observer = new IntersectionObserver(
			([entry]) => (inView = entry?.isIntersecting ?? false)
		);
		observer.observe(node);
		return () => observer.disconnect();
	}

	// Synthetic long tasks: busy-wait `ms` every 180ms, like a page doing real
	// work in bursts. Zero means the interval is off entirely.
	$effect(() => {
		const ms = LEVELS[level]?.ms ?? 0;
		if (ms === 0 || !inView) return;
		const id = window.setInterval(() => {
			const end = performance.now() + ms;
			while (performance.now() < end) {
				// burn
			}
		}, 180);
		return () => window.clearInterval(id);
	});

	// The main-thread heartbeat: a dot moved from a 10ms timer chain, plus a
	// worst-stall readout (how late a tick fired beyond its 10ms cadence).
	//
	// Deliberately NOT requestAnimationFrame: rAF tracks main-thread frame
	// production, and during a composited native scroll Chrome skips main
	// frames it doesn't need, so an rAF meter reads "janky" while the scroll is
	// butter. Worse, the transform strip's own rAF loop forces the main thread
	// awake every frame, making the emulated scroll look artificially healthy.
	// Timers keep their cadence through composited scrolls and stall only when
	// the thread is genuinely blocked, which is the thing being demonstrated.
	//
	// Paused offscreen along with the load; the effect re-runs on re-entry, so
	// its clocks start fresh and the pause can't register as one giant stall.
	$effect(() => {
		if (!inView) return;
		const TICK_MS = 10;
		let last = performance.now();
		let worst = 0;
		let windowStart = last;

		const id = window.setInterval(() => {
			const now = performance.now();
			worst = Math.max(worst, now - last - TICK_MS);
			last = now;
			// Roll the window once a second: readout and color update together, so
			// the dot holds a steady verdict instead of strobing with each burst.
			if (now - windowStart > 1000) {
				// Near-zero when healthy, roughly the busy-wait length when loaded.
				const verdict = worst < 30 ? '#10b981' : worst < 110 ? '#f59e0b' : '#ef4444';
				if (worstReadout) {
					worstReadout.textContent = `${Math.max(0, Math.round(worst))} ms`;
					worstReadout.style.color = verdict;
				}
				if (heartbeat) heartbeat.style.backgroundColor = verdict;
				worst = 0;
				windowStart = now;
			}
			if (heartbeat) {
				// Triangle wave: ping-pong across the track every 1.2s. The browser
				// paints the latest write each vsync, so this is smooth at any hz.
				const t = (now / 1200) % 2;
				const x = (t < 1 ? t : 2 - t) * 100;
				heartbeat.style.transform = `translateX(${x}px)`;
			}
		}, TICK_MS);
		return () => window.clearInterval(id);
	});
</script>

<figure
	{@attach observeInView}
	class="my-8 rounded-2xl border border-neutral-200 p-4 md:p-5 dark:border-neutral-800"
>
	<div class="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
		<div class="flex items-center gap-2" role="group" aria-label="Main thread load">
			{#each LEVELS as option, i (option.label)}
				<button
					type="button"
					onclick={() => (level = i)}
					aria-pressed={level === i}
					class="h-8 rounded-full px-3.5 text-[13px] font-medium transition {level === i
						? 'bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900'
						: 'border border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900'}"
				>
					{option.label}{#if option.ms > 0}<span class="ml-1 opacity-60">{option.ms}ms</span>{/if}
				</button>
			{/each}
		</div>

		<div class="flex items-center gap-3 text-[12px] text-neutral-500 dark:text-neutral-400">
			<span class="flex items-center gap-2">
				main thread
				<span
					class="relative inline-block h-2 w-28 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-900"
				>
					<div
						bind:this={heartbeat}
						class="absolute top-0 left-0 h-2 w-3 rounded-full bg-emerald-500 transition-colors duration-200"
					></div>
				</span>
			</span>
			<span class="tabular-nums">
				worst stall: <span bind:this={worstReadout}>0 ms</span>
			</span>
		</div>
	</div>

	<StripLabel>Native scroll — swipe or scroll it</StripLabel>
	<Strip kind="native" ariaLabel="Native scrolling image strip" />

	<div class="mt-5">
		<StripLabel>Transform carousel — drag or swipe it</StripLabel>
		<Strip kind="transform" ariaLabel="JavaScript transform image strip" />
	</div>

	<figcaption class="mt-4 text-[13px] leading-6 text-neutral-500 dark:text-neutral-400">
		Both strips are identical DOM. Set the load to Slammed, then flick each one. The native strip
		keeps scrolling because the browser scrolls it off the main thread. The transform carousel is
		driven by pointer events and requestAnimationFrame, so it freezes with everything else.
	</figcaption>
</figure>
