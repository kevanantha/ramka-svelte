<!--
  One debug recipe: a card with a trigger grid and a fullscreen viewer whose
  bottom chrome holds the caption and the recipe's ThumbnailStrip.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Lightbox from 'ramka-svelte/lightbox';
	import X from '@lucide/svelte/icons/x';
	import { chromeButton, triggerFocusClass } from '#lib/components/chrome.js';
	import { stripPhotos as photos } from './photos';

	let {
		title,
		description,
		contentClassName,
		captionClassName,
		strip
	}: {
		title: string;
		description: string;
		/** Sets `--lightbox-inset-bottom` for this strip's chrome height. */
		contentClassName: string;
		captionClassName?: string;
		strip: Snippet;
	} = $props();

	/** Triggers on the page — the lightbox still contains the full photo set. */
	const TRIGGER_COUNT = 6;

	const chromePullHide =
		'transition-opacity duration-200 [[data-pulling]_&]:pointer-events-none [[data-pulling]_&]:opacity-0 [[data-pull-dismissing]_&]:pointer-events-none [[data-pull-dismissing]_&]:opacity-0';
</script>

<section
	class="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-[0_1px_0_rgb(0_0_0/0.03)] sm:p-6 dark:border-neutral-800 dark:bg-neutral-950/60 dark:shadow-none"
>
	<header class="mb-4 max-w-xl">
		<h2 class="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
			{title}
		</h2>
		<p class="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
			{description}
		</p>
	</header>

	<Lightbox.Root loop morphTo="closest">
		<div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
			{#each photos.slice(0, TRIGGER_COUNT) as photo, i (photo.id)}
				<Lightbox.Trigger
					index={i}
					crossfade={i === TRIGGER_COUNT - 1 ? 'both' : undefined}
					class="relative aspect-square overflow-hidden rounded-lg bg-neutral-100 {triggerFocusClass} dark:bg-neutral-900"
				>
					<img
						src={photo.thumb}
						alt={photo.alt}
						width={photo.width}
						height={photo.height}
						class="h-full w-full object-cover"
						draggable="false"
					/>
				</Lightbox.Trigger>
			{/each}
		</div>

		<Lightbox.Portal>
			<Lightbox.Backdrop
				class="lightbox-demo-backdrop lightbox-demo-backdrop-light fixed inset-0"
			/>
			<Lightbox.Content
				aria-label={title}
				pullToClose
				class="lightbox-demo-content {contentClassName} fixed inset-0 flex flex-col overscroll-contain outline-none"
			>
				<Lightbox.Slides
					aria-label="Full-size images"
					preload={1}
					class="lightbox-demo-slides flex-1 gap-5 md:gap-0 [&::-webkit-scrollbar]:hidden"
				>
					{#each photos as photo, i (photo.id)}
						<Lightbox.Slide class="lightbox-demo-slide-pad h-full">
							<Lightbox.Item index={i} caption={photo.caption}>
								<Lightbox.Zoom maxZoom={4}>
									<Lightbox.Media
										width={photo.width}
										height={photo.height}
										class="overflow-hidden rounded-none md:rounded-lg"
									>
										<img
											src={photo.src}
											alt={photo.alt}
											width={photo.width}
											height={photo.height}
											loading="eager"
											draggable="false"
											class="select-none"
										/>
									</Lightbox.Media>
								</Lightbox.Zoom>
							</Lightbox.Item>
						</Lightbox.Slide>
					{/each}
				</Lightbox.Slides>

				<div
					class="absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] right-3 z-30 {chromePullHide}"
				>
					<Lightbox.Close class={chromeButton} aria-label="Close">
						<X aria-hidden="true" class="h-[18px] w-[18px]" strokeWidth={2.25} />
					</Lightbox.Close>
				</div>

				<div
					class="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 px-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] [[data-zoomed]_&]:opacity-0 {chromePullHide}"
				>
					<Lightbox.Caption
						class="pointer-events-auto block min-h-[1.1rem] max-w-full truncate px-4 text-center text-sm font-medium text-neutral-800 drop-shadow-[0_1px_1px_rgb(255_255_255/0.7)] dark:text-neutral-100 dark:drop-shadow-[0_1px_2px_rgb(0_0_0/0.65)] {captionClassName ??
							''}"
					/>
					<div class="pointer-events-auto w-full min-w-0">{@render strip()}</div>
				</div>
			</Lightbox.Content>
		</Lightbox.Portal>
	</Lightbox.Root>
</section>
