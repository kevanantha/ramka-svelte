<!--
  App-level demo, not part of the copy-paste package.

  A small social feed: each post is an independent `Lightbox.Root` whose
  attachments render in a Facebook-style grid (single image, three-up, and a
  2×2 with a `+N` overlay tile). Tapping a tile morphs into the split viewer
  from `./Gallery.svelte`; the `+N` tile uses `crossfade="both"` (there is no
  single full-size image behind it, so a morph would look wrong) and
  `morphTo="closest"` so closing from a hidden extra lands on a visible tile.

  The reply action opens the viewer too (thread sidebar / comment sheet) via
  an imperative `Lightbox.createHandle()`: there is no trigger element to
  click, so the open is programmatic.
-->
<script lang="ts">
	import Heart from '@lucide/svelte/icons/heart';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Repeat2 from '@lucide/svelte/icons/repeat-2';
	import Share from '@lucide/svelte/icons/share';
	import * as Lightbox from 'ramka-svelte/lightbox';
	import Gallery, { type ThreadPost, type TwitterItem } from './Gallery.svelte';

	type FeedPost = {
		id: string;
		/** Short relative time on the feed card; `thread.time` is the full stamp. */
		time: string;
		thread: ThreadPost;
		images: TwitterItem[];
	};

	function photo(name: string, alt: string, width: number, height: number): TwitterItem {
		return { src: `/photos/${name}.jpg`, thumb: `/photos/${name}-thumb.jpg`, alt, width, height };
	}

	const feed: FeedPost[] = [
		{
			id: 'post-road-trip',
			time: '2d',
			thread: {
				author: {
					name: 'Tomás Rivera',
					handle: 'tomasrivera',
					avatar: 'https://i.pravatar.cc/96?u=tomas',
					verified: true
				},
				text: 'Week-long road trip along the coast is done. Seven stops, seven completely different landscapes.',
				time: 'Aug 9, 2026 · 6:41 PM',
				stats: { replies: 97, reposts: 514, likes: 3842, views: '212K' },
				replies: [
					{
						id: 'r1',
						author: {
							name: 'Sofia Lindgren',
							handle: 'sofialind',
							avatar: 'https://i.pravatar.cc/96?u=sofia'
						},
						text: 'The lighthouse shot is unreal. What time of day was that?',
						time: '1d'
					},
					{
						id: 'r2',
						author: {
							name: 'James Okafor',
							handle: 'jamesokafor',
							avatar: 'https://i.pravatar.cc/96?u=james'
						},
						text: 'Route details please — planning the same trip for October.',
						time: '20h'
					}
				]
			},
			images: [
				photo('rg-6a', 'Dramatic cliffside road at sunset', 1600, 1000),
				photo('rg-6b', 'Turquoise cove with fishing boats', 1600, 1000),
				photo('rg-6c', 'Terraced vineyards in morning mist', 1600, 1000),
				photo('rg-6d', 'Old lighthouse on a rocky headland', 900, 1400),
				photo('rg-6e', 'Wild horses grazing on a dune', 1600, 1000),
				photo('rg-6f', 'Street musicians in a coastal town square', 1200, 1200),
				photo('rg-6g', 'Milky Way over a deserted beach', 1600, 1000)
			]
		},
		{
			id: 'post-good-light',
			time: '8h',
			thread: {
				author: {
					name: 'Aisha Patel',
					handle: 'aishapatel',
					avatar: 'https://i.pravatar.cc/96?u=aisha'
				},
				text: 'Golden hour across the valley, the canopy from below, and still water at dusk. A good day for light.',
				time: 'Aug 11, 2026 · 4:05 AM',
				stats: { replies: 28, reposts: 67, likes: 892, views: '31K' },
				replies: [
					{
						id: 'r1',
						author: {
							name: 'Marcus Chen',
							handle: 'marcusc',
							avatar: 'https://i.pravatar.cc/96?u=marcus'
						},
						text: 'That canopy frame is a wallpaper. Straight out of camera?',
						time: '6h'
					}
				]
			},
			images: [
				photo('rg-3a', 'Rolling fields at golden hour', 1600, 900),
				photo('rg-3b', 'Dense forest canopy from below', 1000, 1400),
				photo('rg-3c', 'Quiet lake reflecting the hills', 1500, 1000)
			]
		},
		{
			id: 'post-first-light',
			time: '2h',
			thread: {
				author: {
					name: 'Elena Vasquez',
					handle: 'elenavsq',
					avatar: 'https://i.pravatar.cc/96?u=elena'
				},
				text: 'First light over the ridgeline this morning — worth every minute of the 4am alarm.',
				time: 'Aug 11, 2026 · 10:12 AM',
				stats: { replies: 12, reposts: 31, likes: 284, views: '9.4K' },
				replies: [
					{
						id: 'r1',
						author: {
							name: 'Priya Nair',
							handle: 'priyanair',
							avatar: 'https://i.pravatar.cc/96?u=priya'
						},
						text: 'The 4am alarm gang eats again. Gorgeous.',
						time: '1h'
					}
				]
			},
			images: [photo('rg-1', 'Mountain range under a wide morning sky', 1600, 1000)]
		}
	];

	// Imperative handles so each post's reply action (not a Trigger) can open its viewer.
	const handles = feed.map(() => Lightbox.createHandle());

	function formatCount(n: number): string {
		if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
		return String(n);
	}

	const actionClass =
		'flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100';

	/**
	 * Per-cell rounded corners for the 1–4 cell grids. Inner edges stay sharp;
	 * outer corners match the parent grid. The radius must live on the Trigger:
	 * the morph reads it to animate corner rounding.
	 */
	function cornerClass(index: number, count: number): string {
		if (count === 2) {
			return index === 0 ? 'rounded-l-xl' : 'rounded-r-xl';
		}
		if (count === 3) {
			if (index === 0) return 'rounded-l-xl';
			return index === 1 ? 'rounded-tr-xl' : 'rounded-br-xl';
		}
		if (count === 4) {
			return ['rounded-tl-xl', 'rounded-tr-xl', 'rounded-bl-xl', 'rounded-br-xl'][index]!;
		}
		return 'rounded-xl';
	}
</script>

<!--
  Facebook-style trigger grid: 1 image fills the width, 2–4 tile into a
  grid, and 5+ collapse the extras behind a `+N` overlay tile. Every tile is
  a `Lightbox.Trigger`, so tapping one morphs into the viewer at that index.
-->
{#snippet imageGrid(imgs: TwitterItem[])}
	{@const count = imgs.length}
	{#if count === 1}
		{@const only = imgs[0]!}
		<Lightbox.Trigger
			index={0}
			class="xlb-trigger block w-full overflow-hidden rounded-xl bg-transparent p-0"
		>
			{#snippet children({ image })}
				<img
					{@attach image}
					src={only.thumb}
					alt={only.alt}
					width={only.width}
					height={only.height}
					class="block w-full object-cover"
					draggable="false"
				/>
			{/snippet}
		</Lightbox.Trigger>
	{:else if count === 2}
		<div class="grid grid-cols-2 gap-0.5 overflow-hidden rounded-xl">
			{#each imgs as img, i (img.src)}
				<Lightbox.Trigger
					index={i}
					class={['xlb-trigger block overflow-hidden bg-transparent p-0', cornerClass(i, 2)]}
				>
					{#snippet children({ image })}
						<img
							{@attach image}
							src={img.thumb}
							alt={img.alt}
							width={img.width}
							height={img.height}
							class="block aspect-4/5 w-full object-cover"
							draggable="false"
						/>
					{/snippet}
				</Lightbox.Trigger>
			{/each}
		</div>
	{:else if count === 3}
		<div class="grid aspect-3/2 grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-xl">
			{#each imgs as img, i (img.src)}
				<Lightbox.Trigger
					index={i}
					class={[
						'xlb-trigger',
						i === 0 && 'row-span-2',
						'block overflow-hidden bg-transparent p-0',
						cornerClass(i, 3)
					]}
				>
					{#snippet children({ image })}
						<img
							{@attach image}
							src={img.thumb}
							alt={img.alt}
							width={img.width}
							height={img.height}
							class="block size-full object-cover"
							draggable="false"
						/>
					{/snippet}
				</Lightbox.Trigger>
			{/each}
		</div>
	{:else}
		{@const extra = count - 4}
		<div class="grid aspect-3/2 grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-xl">
			{#each imgs.slice(0, 4) as img, i (img.src)}
				{@const showOverlay = i === 3 && extra > 0}
				<Lightbox.Trigger
					index={i}
					crossfade={showOverlay ? 'both' : undefined}
					class={['xlb-trigger block overflow-hidden bg-transparent p-0', cornerClass(i, 4)]}
				>
					{#snippet children({ image })}
						<!-- The whole tile crossfades (overlay included), but the
						     destination placeholder is sourced from `image` only, so
						     the "+N" overlay never bleeds into the viewer image. -->
						<span class={['relative block size-full overflow-hidden', cornerClass(i, 4)]}>
							<img
								{@attach image}
								src={img.thumb}
								alt={img.alt}
								width={img.width}
								height={img.height}
								class="block size-full object-cover"
								draggable="false"
							/>
							{#if showOverlay}
								<span
									class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50"
								>
									<span class="text-2xl font-bold text-white">+{extra}</span>
								</span>
							{/if}
						</span>
					{/snippet}
				</Lightbox.Trigger>
			{/each}
		</div>
	{/if}
{/snippet}

<div
	class="w-full max-w-xl divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:divide-neutral-800 dark:border-neutral-700 dark:bg-neutral-900"
>
	{#each feed as post, p (post.id)}
		{@const author = post.thread.author}
		{@const stats = post.thread.stats}
		<!-- Extras hidden behind the `+N` tile have no trigger of their own:
		     close to the nearest visible one instead of flashing. Thumbs are the
		     same photos at lower res (same file + aspect), so the placeholder
		     bridge is seamless: skip the decode wait and start the morph
		     immediately. -->
		<Lightbox.Root
			handle={handles[p]}
			loop
			morphTo={post.images.length > 4 ? 'closest' : undefined}
			awaitImageDecode={false}
		>
			<article class="flex gap-3 px-4 py-3 text-start">
				<img
					src={author.avatar}
					alt=""
					class="size-10 shrink-0 rounded-full object-cover"
					draggable="false"
				/>
				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap items-baseline gap-x-1 text-sm">
						<span class="font-bold text-neutral-900 dark:text-neutral-50">{author.name}</span>
						<span class="text-neutral-500">@{author.handle}</span>
						<span class="text-neutral-500">· {post.time}</span>
					</div>

					<p
						class="mt-1 mb-3 text-[15px] leading-snug whitespace-pre-wrap text-neutral-900 dark:text-neutral-100"
					>
						{post.thread.text}
					</p>

					{@render imageGrid(post.images)}

					<!-- Reply / repost / like / share row. Reply opens the viewer (thread beside it). -->
					<div class="-ms-2 mt-1 -mb-1.5 flex items-center gap-1 text-neutral-500">
						<button
							type="button"
							class={actionClass}
							aria-label="View replies"
							onclick={() => handles[p]!.open(0)}
						>
							<MessageCircle class="size-4" aria-hidden="true" />
							<span>{formatCount(stats?.replies ?? 0)}</span>
						</button>
						<button type="button" class={actionClass} aria-label="Repost">
							<Repeat2 class="size-4" aria-hidden="true" />
							<span>{formatCount(stats?.reposts ?? 0)}</span>
						</button>
						<button type="button" class={actionClass} aria-label="Like">
							<Heart class="size-4" aria-hidden="true" />
							<span>{formatCount(stats?.likes ?? 0)}</span>
						</button>
						<button type="button" class={actionClass} aria-label="Share">
							<Share class="size-4" aria-hidden="true" />
						</button>
					</div>
				</div>
			</article>

			<Gallery items={post.images} thread={post.thread} ariaLabel="Photos by {author.name}" />
		</Lightbox.Root>
	{/each}
</div>
