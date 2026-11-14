<!--
  Debug: a real-world stress page — a social feed with hundreds of posts, for
  profiling open/close morphs against a huge live DOM (shaped like an app
  feed rather than docs). Port of the original docs' app/(docs)/debug/heavy-feed.

  Every post is its own independent Lightbox.Root carrying 1–10 images in a
  Facebook-style grid. Everything is driven from the URL so a profiling setup
  survives reloads:

    /debug/heavy-feed?elements=16000&load=medium&live=1

  - `elements` — target DOM size (the bar shows the actual measured count)
  - `load` — synthetic main-thread load: an interval that blocks the thread
    for a slice of every period, approximating a busy app. This simulates
    contention; for slow-device simulation stack DevTools CPU throttling.
  - `live` — a "live activity" widget updating every 300ms, so morphs run
    against ongoing DOM updates.
  - `cv` — `content-visibility: auto` on each post.
-->
<script lang="ts">
	import { replaceState } from '$app/navigation';
	import FeedPostCard from './FeedPostCard.svelte';
	import LiveActivityWidget from './LiveActivityWidget.svelte';
	import {
		DEFAULT_CONFIG,
		ELEMENTS_PER_POST,
		LOAD_LEVELS,
		TARGET_SIZES,
		buildPosts,
		configUrl,
		parseConfig,
		type FeedConfig,
		type LoadLevel
	} from './feed';

	// The feed renders only after the URL has been read (`ready`), so a reload
	// lands directly on the configured size instead of hydrating a
	// default-sized feed first (the page is prerendered without a query).
	let config = $state<FeedConfig>(DEFAULT_CONFIG);
	let ready = $state(false);
	let measured = $state<number | null>(null);

	$effect(() => {
		config = parseConfig(window.location.search);
		ready = true;
	});

	function applyConfig(partial: Partial<FeedConfig>) {
		config = { ...config, ...partial };
		replaceState(configUrl(config), {});
	}

	// Periodically block the main thread. The sink is published on `window` so
	// the busy loop cannot be optimized away.
	$effect(() => {
		const load: LoadLevel = ready ? config.load : 'off';
		if (load === 'off') return;
		const { blockMs, periodMs } = LOAD_LEVELS[load];
		const id = window.setInterval(() => {
			const end = performance.now() + blockMs;
			let sink = 0;
			while (performance.now() < end) sink += Math.sqrt(sink + 1);
			(window as unknown as Record<string, unknown>).__feedLoadSink = sink;
		}, periodMs);
		return () => window.clearInterval(id);
	});

	const postCount = $derived(Math.max(1, Math.round(config.elements / ELEMENTS_PER_POST)));
	const posts = $derived(ready ? buildPosts(postCount) : []);
	const totalImages = $derived(posts.reduce((sum, p) => sum + p.photos.length, 0));

	// Measure the real element count once the feed is in the DOM.
	$effect(() => {
		if (!ready) return;
		void posts;
		const frame = requestAnimationFrame(() => {
			measured = document.getElementsByTagName('*').length;
		});
		return () => cancelAnimationFrame(frame);
	});

	const CONTROL_BUTTON =
		'rounded-full px-3 py-1 text-xs font-medium tabular-nums transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500';
	const CONTROL_ACTIVE = 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900';
	const CONTROL_IDLE =
		'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700';

	const LEVELS = ['off', 'light', 'medium', 'heavy'] as const;

	const status = $derived.by(() => {
		if (!ready) return 'reading URL config…';
		let line = `${posts.length.toLocaleString()} posts · ${totalImages.toLocaleString()} images · ${
			measured == null ? 'measuring…' : `${measured.toLocaleString()} DOM elements`
		}`;
		if (config.contentVisibility) line += ' · content-visibility: auto';
		if (config.load !== 'off') {
			const { blockMs, periodMs } = LOAD_LEVELS[config.load];
			line += ` · blocking ${blockMs}ms every ${periodMs}ms`;
		}
		return line;
	});
</script>

<svelte:head>
	<title>Heavy feed — ramka-svelte</title>
</svelte:head>

<div class="mx-auto w-full max-w-xl px-4 py-6">
	<header class="mb-4">
		<p
			class="text-[11px] font-semibold tracking-widest text-amber-700 uppercase dark:text-amber-400"
		>
			Debug · development only
		</p>
		<h1 class="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
			Heavy feed
		</h1>
		<p class="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
			A feed-shaped stress page for the open/close morph: every post owns an independent lightbox
			with 1–10 images (Facebook-style grid, +N overlay). Pick a DOM size, add synthetic main-thread
			load, and keep a live widget committing during the transition. Settings persist in the URL.
			For true slow-device runs, stack DevTools CPU throttling on top.
		</p>
	</header>

	<div
		class="sticky top-0 z-30 -mx-4 mb-6 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950"
	>
		<div class="flex flex-wrap items-center gap-x-4 gap-y-2">
			<div class="flex items-center gap-1.5" role="group" aria-label="Target DOM size">
				<span class="text-xs font-medium text-neutral-500 dark:text-neutral-400">Elements</span>
				{#each TARGET_SIZES as size (size)}
					<button
						type="button"
						onclick={() => applyConfig({ elements: size })}
						aria-pressed={config.elements === size}
						class="{CONTROL_BUTTON} {config.elements === size ? CONTROL_ACTIVE : CONTROL_IDLE}"
					>
						{size >= 1000 ? `${size / 1000}k` : size}
					</button>
				{/each}
			</div>

			<div class="flex items-center gap-1.5" role="group" aria-label="Main-thread load">
				<span class="text-xs font-medium text-neutral-500 dark:text-neutral-400">Load</span>
				{#each LEVELS as level (level)}
					<button
						type="button"
						onclick={() => applyConfig({ load: level })}
						aria-pressed={config.load === level}
						class="{CONTROL_BUTTON} {config.load === level ? CONTROL_ACTIVE : CONTROL_IDLE}"
					>
						{level}
					</button>
				{/each}
			</div>

			<label
				class="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400"
			>
				<input
					type="checkbox"
					checked={config.live}
					onchange={(event) => applyConfig({ live: event.currentTarget.checked })}
					class="accent-sky-600"
				/>
				Live updates
			</label>

			<label
				class="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400"
			>
				<input
					type="checkbox"
					checked={config.contentVisibility}
					onchange={(event) => applyConfig({ contentVisibility: event.currentTarget.checked })}
					class="accent-sky-600"
				/>
				content-visibility
			</label>
		</div>
		<p class="mt-1.5 text-[11px] text-neutral-400 tabular-nums dark:text-neutral-500">
			{status}
		</p>
	</div>

	<main class="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
		{#each posts as post (post.id)}
			<FeedPostCard {post} contentVisibility={config.contentVisibility} />
		{/each}
	</main>

	{#if ready && config.live}
		<LiveActivityWidget />
	{/if}
</div>
