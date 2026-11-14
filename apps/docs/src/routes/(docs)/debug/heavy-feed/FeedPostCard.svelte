<!--
  One feed post. Every post with photos owns an independent Lightbox.Root,
  like a real feed. `morphTo="closest"` so closing from a "+N" extra (which
  has no visible tile) morphs back to the nearest visible one.

  Attachment grid, Facebook-style: 1 image fills the width, 2–4 tile into a
  grid, and 5+ collapse the extras behind a `+N` overlay tile. Every tile is a
  Lightbox.Trigger; the overlay tile crossfades (no single full-size image
  sits behind "+N", so a hard-cut morph would look wrong) while `image` keeps
  the destination placeholder sourced from the photo alone.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Heart from '@lucide/svelte/icons/heart';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import Repeat2 from '@lucide/svelte/icons/repeat-2';
	import X from '@lucide/svelte/icons/x';
	import { avatarHue, timestamp, type FeedPost } from './feed';

	let { post, contentVisibility }: { post: FeedPost; contentVisibility: boolean } = $props();

	const count = $derived(post.photos.length);
	const extra = $derived(count - 4);

	/**
	 * Per-cell rounded corners for the 1–4 cell grids. Inner edges stay sharp;
	 * outer corners match the parent grid. The radius stays on the Trigger —
	 * the morph reads it — and is repeated on the image so the photo clips
	 * without `overflow: hidden` on the trigger (that pair promotes a
	 * compositing layer per tile, which iOS Safari then flattens during the
	 * view-transition capture).
	 */
	function cornerClass(index: number, count: number): string {
		if (count === 2) return index === 0 ? 'rounded-l-xl' : 'rounded-r-xl';
		if (count === 3) {
			if (index === 0) return 'rounded-l-xl';
			return index === 1 ? 'rounded-tr-xl' : 'rounded-br-xl';
		}
		if (count === 4) {
			return ['rounded-tl-xl', 'rounded-tr-xl', 'rounded-bl-xl', 'rounded-br-xl'][index]!;
		}
		return 'rounded-xl';
	}

	const TILE_FOCUS =
		'block cursor-pointer p-0 outline-offset-2 focus-visible:outline-2 focus-visible:outline-sky-500';

	const VIEWER_BUTTON =
		'grid size-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white data-disabled:pointer-events-none data-disabled:opacity-30';
</script>

<article
	class="flex gap-3 py-4"
	style={contentVisibility
		? 'content-visibility: auto; contain-intrinsic-size: auto 480px;'
		: undefined}
>
	<div
		aria-hidden="true"
		class="grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
		style="background-color: hsl({avatarHue(post.id)} 55% 45%);"
	>
		{post.name
			.split(' ')
			.map((part) => part[0])
			.join('')}
	</div>
	<div class="min-w-0 flex-1">
		<div class="flex items-baseline gap-1.5 text-sm">
			<span class="truncate font-semibold text-neutral-900 dark:text-neutral-100">
				{post.name}
			</span>
			<span class="truncate text-neutral-500 dark:text-neutral-400">{post.handle}</span>
			<time class="ml-auto shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
				{timestamp(post.minutesAgo)}
			</time>
		</div>
		<p class="mt-1 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
			{post.text}
		</p>

		{#if count > 0}
			<Lightbox.Root morphTo="closest" loop>
				{#if count === 1}
					{@const only = post.photos[0]!}
					<Lightbox.Trigger
						index={0}
						aria-label="Open photo by {post.name}"
						class="mt-2 block w-full cursor-pointer rounded-xl border border-neutral-200 p-0 outline-offset-2 focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-neutral-800"
					>
						{#snippet children({ image })}
							<img
								{@attach image}
								src={only.thumb}
								alt="Photo by {post.name}"
								width={only.width}
								height={only.height}
								loading="lazy"
								class="aspect-3/2 w-full rounded-xl object-cover"
							/>
						{/snippet}
					</Lightbox.Trigger>
				{:else if count <= 3}
					<div
						class="mt-2 grid gap-0.5 overflow-hidden rounded-xl {count === 2
							? 'grid-cols-2'
							: 'aspect-3/2 grid-cols-2 grid-rows-2'}"
					>
						{#each post.photos as photo, i (i)}
							<Lightbox.Trigger
								index={i}
								aria-label="Open photo {i + 1} of {count} by {post.name}"
								class="{TILE_FOCUS} {count === 3 && i === 0 ? 'row-span-2' : ''} {cornerClass(
									i,
									count
								)}"
							>
								{#snippet children({ image })}
									<img
										{@attach image}
										src={photo.thumb}
										alt="Photo {i + 1} by {post.name}"
										width={photo.width}
										height={photo.height}
										loading="lazy"
										class="block w-full object-cover {cornerClass(i, count)} {count === 2
											? 'aspect-4/5'
											: 'size-full'}"
									/>
								{/snippet}
							</Lightbox.Trigger>
						{/each}
					</div>
				{:else}
					<!-- 4+ images: 2×2 grid, extras behind a "+N" overlay on the last tile. -->
					<div
						class="mt-2 grid aspect-3/2 grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-xl"
					>
						{#each post.photos.slice(0, 4) as photo, i (i)}
							{@const showOverlay = i === 3 && extra > 0}
							<Lightbox.Trigger
								index={i}
								crossfade={showOverlay ? 'both' : undefined}
								aria-label={showOverlay
									? `Open all ${count} photos by ${post.name}`
									: `Open photo ${i + 1} of ${count} by ${post.name}`}
								class="{TILE_FOCUS} {cornerClass(i, 4)}"
							>
								{#snippet children({ image })}
									<span class="relative block size-full {cornerClass(i, 4)}">
										<img
											{@attach image}
											src={photo.thumb}
											alt="Photo {i + 1} by {post.name}"
											width={photo.width}
											height={photo.height}
											loading="lazy"
											class="block size-full object-cover {cornerClass(i, 4)}"
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

				<Lightbox.Portal>
					<Lightbox.Content
						aria-label="Photos by {post.name}"
						class="fixed inset-0 flex flex-col bg-neutral-950/95 outline-none"
					>
						<Lightbox.Slides
							preload={1}
							aria-label="Photos"
							class="flex-1 scrollbar-none [&::-webkit-scrollbar]:hidden"
						>
							{#each post.photos as photo, i (i)}
								<Lightbox.Slide
									class="h-full min-w-full flex-[0_0_100%] px-4 pt-16 pb-24 sm:px-20 sm:pt-20"
								>
									<Lightbox.Item index={i}>
										<Lightbox.Zoom>
											<Lightbox.Media width={photo.width} height={photo.height}>
												<img
													src={photo.src}
													alt="Photo {i + 1} by {post.name}"
													width={photo.width}
													height={photo.height}
													loading="lazy"
													draggable="false"
												/>
											</Lightbox.Media>
										</Lightbox.Zoom>
									</Lightbox.Item>
								</Lightbox.Slide>
							{/each}
						</Lightbox.Slides>

						<Lightbox.Counter
							class="absolute top-4 left-4 z-10 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white tabular-nums"
						/>
						<Lightbox.Close aria-label="Close" class="{VIEWER_BUTTON} absolute top-4 right-4 z-10">
							<X class="size-5" aria-hidden="true" />
						</Lightbox.Close>
						{#if count > 1}
							<Lightbox.Previous
								aria-label="Previous"
								class="{VIEWER_BUTTON} absolute top-1/2 left-4 z-10 -translate-y-1/2"
							>
								<ChevronLeft class="size-6" aria-hidden="true" />
							</Lightbox.Previous>
							<Lightbox.Next
								aria-label="Next"
								class="{VIEWER_BUTTON} absolute top-1/2 right-4 z-10 -translate-y-1/2"
							>
								<ChevronRight class="size-6" aria-hidden="true" />
							</Lightbox.Next>
						{/if}

						<div class="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
							<Lightbox.ZoomOut aria-label="Zoom out" class={VIEWER_BUTTON}>
								<Minus class="size-5" aria-hidden="true" />
							</Lightbox.ZoomOut>
							<Lightbox.ZoomIn aria-label="Zoom in" class={VIEWER_BUTTON}>
								<Plus class="size-5" aria-hidden="true" />
							</Lightbox.ZoomIn>
						</div>
					</Lightbox.Content>
				</Lightbox.Portal>
			</Lightbox.Root>
		{/if}

		<div class="mt-2 flex items-center gap-6 text-xs text-neutral-500 dark:text-neutral-400">
			<button type="button" class="flex items-center gap-1.5 hover:text-rose-500">
				<Heart class="size-3.5" aria-hidden="true" />
				<span class="tabular-nums">{post.likes}</span>
			</button>
			<button type="button" class="flex items-center gap-1.5 hover:text-sky-500">
				<MessageCircle class="size-3.5" aria-hidden="true" />
				<span class="tabular-nums">{post.replies}</span>
			</button>
			<button type="button" class="flex items-center gap-1.5 hover:text-emerald-500">
				<Repeat2 class="size-3.5" aria-hidden="true" />
				<span class="tabular-nums">{post.reposts}</span>
			</button>
		</div>
	</div>
</article>
