<!--
  Infinite scroll: one paginated photo list feeding both surfaces.

  - The page feed loads the next page when a sentinel below the grid comes
    near the viewport (a hand-rolled IntersectionObserver, no library).
  - The open viewer loads the next page when the active slide gets within
    LOAD_AHEAD slides of the end, via Root's onValueChange, which fires for
    swipes, arrow keys and the Previous/Next buttons alike.

  No special lightbox API is involved: appending to `photos` renders more
  Lightbox.Slides at the end of the native scroll-snap track. Appending never
  moves existing snap offsets, so the slide the user is looking at stays put;
  the library re-measures, and Next, the arrow keys and the counter pick up
  the new count on their own. Slides' `preload` keeps appended items from
  fetching media until the user approaches them.

  The viewer is deliberately minimal: slides, Previous/Next, the zoom capsule
  and Close. Without a thumbnail group each Lightbox.Item takes the standalone
  carousel-slide semantics, so it carries aria-roledescription="slide" and a
  positional aria-label.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import X from '@lucide/svelte/icons/x';
	import ZoomIn from '@lucide/svelte/icons/zoom-in';
	import ZoomOut from '@lucide/svelte/icons/zoom-out';
	import type { Attachment } from 'svelte/attachments';
	import {
		chromeButton,
		chromeButtonGroup,
		chromeButtonMd,
		chromeButtonSegment,
		chromeSegmentDivider,
		triggerFocusClass
	} from '#lib/components/chrome.js';
	import { ramkaPhotos, type ExamplePhoto } from '#lib/example-photos.js';
	import { blurPlaceholderStyle, clearBlurPlaceholder } from '#lib/blur-placeholder.js';

	interface FeedPhoto extends ExamplePhoto {
		id: string;
		alt: string;
		caption: string;
	}

	/** Photos per simulated API page. */
	const PAGE_SIZE = 12;
	/**
	 * How close to the end (in slides) the viewer may get before the next page
	 * is requested. Keep it larger than Slides' `preload` so new slides exist
	 * before their media is needed: the user should never swipe into the edge
	 * rubber band while the network is still working.
	 */
	const LOAD_AHEAD = 4;
	/** Simulated network latency. */
	const FETCH_DELAY_MS = 800;

	/**
	 * Deterministic page contents: the demo cycles a fixed pool of local
	 * assets, so the feed is endless. In a real app this is whatever your API
	 * returns for `?page=n`.
	 */
	function buildPage(page: number): FeedPhoto[] {
		return Array.from({ length: PAGE_SIZE }, (_, i) => {
			const serial = page * PAGE_SIZE + i;
			return {
				...ramkaPhotos[serial % ramkaPhotos.length]!,
				id: `feed-${serial}`,
				alt: `Feed photo ${serial + 1}`,
				caption: `Photo #${serial + 1}`
			};
		});
	}

	/** Simulated paginated API: swap for your real `fetch('/api/photos?page=n')`. */
	function fetchPhotosPage(page: number): Promise<FeedPhoto[]> {
		return new Promise((resolve) => setTimeout(() => resolve(buildPage(page)), FETCH_DELAY_MS));
	}

	let photos = $state.raw<FeedPhoto[]>(buildPage(0));
	let loading = $state(false);

	// The next page to request and an in-flight guard.
	let nextPage = 1;
	let pending = false;

	function loadMore() {
		if (pending) return;
		pending = true;
		loading = true;
		const page = nextPage;
		void fetchPhotosPage(page).then((nextPhotos) => {
			nextPage = page + 1;
			pending = false;
			loading = false;
			// Append-only: existing indices (and snap offsets) never move.
			photos = [...photos, ...nextPhotos];
		});
	}

	/**
	 * Page-feed pagination: fetch when the sentinel under the grid comes within
	 * 800px of the viewport. Recreated whenever the list grows (it reads
	 * `photos.length`): an observer only reports intersection *changes*, so
	 * after an append that leaves the sentinel inside the margin it would
	 * otherwise stay silent.
	 */
	const loadMoreSentinel: Attachment<HTMLElement> = (sentinel) => {
		void photos.length;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) loadMore();
			},
			{ rootMargin: '800px 0px' }
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	};

	// Viewer pagination: onValueChange fires for every navigation source
	// (swipe, arrow keys, Previous/Next and the opening trigger), so nearing
	// the end by any route requests the next page.
	function handleValueChange(value: number) {
		if (value >= photos.length - LOAD_AHEAD) loadMore();
	}
</script>

<div class="min-h-screen select-none">
	<!-- scrollTriggerIntoView keeps the (possibly far-scrolled-to) trigger tile
	     positioned for the close morph; instant so the covered page never
	     visibly scrolls. Trigger thumb and slide share one source image, so the
	     thumb bridge covers the open: no reason to hold the morph for decode. -->
	<Lightbox.Root
		onValueChange={handleValueChange}
		scrollTriggerIntoView={[
			{ type: 'onChange', behavior: 'instant' },
			{ type: 'onOpenComplete', behavior: 'instant' }
		]}
		awaitImageDecode={false}
	>
		<div
			class="sticky top-14 z-30 flex shrink-0 items-center justify-between border-b border-black/[0.06] bg-background px-4 py-2.5 md:top-0 dark:border-white/[0.08]"
		>
			<div class="flex flex-col">
				<span
					class="text-[19px] leading-6 font-bold tracking-tight text-neutral-900 dark:text-neutral-50"
				>
					Feed
				</span>
				<span class="text-[11px] leading-4 font-medium text-neutral-500 dark:text-neutral-400">
					{photos.length} photos loaded · scrolls forever
				</span>
			</div>
		</div>

		<!-- Every tile is a Trigger; new pages render new tiles AND new slides
		     from the same array, so the viewer and the feed can never drift. -->
		<div class="grid grid-cols-3 gap-0.5 md:grid-cols-4 lg:grid-cols-5">
			{#each photos as photo, i (photo.id)}
				<Lightbox.Trigger
					index={i}
					class="relative block aspect-square cursor-pointer overflow-hidden bg-transparent p-0 md:scroll-mt-16 {triggerFocusClass}"
				>
					{#snippet children({ image })}
						<img
							{@attach image}
							{@attach clearBlurPlaceholder}
							src={photo.thumb}
							srcset="{photo.thumb} {photo.thumbWidth}w, {photo.src} {photo.width}w"
							sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, 33vw"
							width={photo.width}
							height={photo.height}
							alt={photo.alt}
							loading="lazy"
							decoding="async"
							style={blurPlaceholderStyle(photo)}
							class="block size-full object-cover"
						/>
					{/snippet}
				</Lightbox.Trigger>
			{/each}
		</div>

		<!-- Load-more sentinel + spinner. Observed with an 800px margin, so pages
		     usually land before this scrolls into view. -->
		<div
			{@attach loadMoreSentinel}
			class="flex items-center justify-center py-10"
			aria-hidden="true"
		>
			<LoaderCircle
				class="h-5 w-5 animate-spin text-neutral-400 transition-opacity {loading
					? 'opacity-100'
					: 'opacity-0'}"
			/>
		</div>

		<Lightbox.Portal>
			<Lightbox.Backdrop class="lightbox-demo-backdrop fixed inset-0 bg-white dark:bg-black" />
			<Lightbox.Content
				aria-label="Feed photos"
				class="lightbox-demo-content lightbox-demo-content-solo fixed inset-0 flex flex-col overscroll-contain outline-none"
			>
				<Lightbox.Slides
					aria-roledescription="carousel"
					aria-label="Full-size photos"
					preload={2}
					class="lightbox-demo-slides flex-1 gap-5 md:gap-0 [&::-webkit-scrollbar]:hidden"
				>
					{#each photos as photo, i (photo.id)}
						<Lightbox.Slide class="lightbox-demo-slide-pad h-full">
							<Lightbox.Item
								index={i}
								aria-roledescription="slide"
								aria-label="{i + 1} of {photos.length}"
							>
								<Lightbox.Zoom maxZoom={6}>
									<Lightbox.Media
										width={photo.width}
										height={photo.height}
										class="overflow-hidden rounded-none md:rounded-lg"
									>
										<!-- No blur placeholder: every index has a trigger thumb,
										     so Ramka bridges the open. -->
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

				<!-- Previous / Next: desktop only; mobile swipes. Both disable at
				     the loaded frontier and re-enable when the next page lands. -->
				<div class="lightbox-demo-chrome-hide absolute start-3 top-1/2 z-30 -translate-y-1/2">
					<Lightbox.Previous class={chromeButtonMd} aria-label="Previous photo">
						<ChevronLeft aria-hidden="true" class="h-5 w-5" strokeWidth={2.25} />
					</Lightbox.Previous>
				</div>
				<div class="lightbox-demo-chrome-hide absolute end-3 top-1/2 z-30 -translate-y-1/2">
					<Lightbox.Next class={chromeButtonMd} aria-label="Next photo">
						<ChevronRight aria-hidden="true" class="h-5 w-5" strokeWidth={2.25} />
					</Lightbox.Next>
				</div>

				<div
					class="lightbox-demo-chrome-top lightbox-demo-chrome-hide absolute end-3 top-[calc(0.75rem+env(safe-area-inset-top,0px))] z-30 flex gap-2"
				>
					<div class={chromeButtonGroup}>
						<Lightbox.ZoomOut class={chromeButtonSegment} aria-label="Zoom out">
							<ZoomOut aria-hidden="true" class="h-4 w-4" strokeWidth={2.25} />
						</Lightbox.ZoomOut>
						<Lightbox.ZoomIn
							class="{chromeButtonSegment} {chromeSegmentDivider}"
							aria-label="Zoom in"
						>
							<ZoomIn aria-hidden="true" class="h-4 w-4" strokeWidth={2.25} />
						</Lightbox.ZoomIn>
					</div>
					<Lightbox.Close class={chromeButton} aria-label="Close">
						<X aria-hidden="true" class="h-[18px] w-[18px]" strokeWidth={2.25} />
					</Lightbox.Close>
				</div>

				<!-- The counter proves the append: the total grows while the viewer
				     is open. The pill shows while a page is in flight. -->
				<div
					class="lightbox-demo-chrome-bottom lightbox-demo-chrome-hide pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 px-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
				>
					<Lightbox.Counter
						class="text-[11px] leading-tight text-neutral-500 tabular-nums dark:text-neutral-400"
					>
						{#snippet children({ current, total })}{current} of {total}{/snippet}
					</Lightbox.Counter>
					<div
						class="flex items-center gap-1.5 rounded-full bg-black/[0.05] px-2.5 py-1 text-[11px] font-medium text-neutral-600 transition-opacity dark:bg-white/[0.09] dark:text-neutral-300 {loading
							? 'opacity-100'
							: 'opacity-0'}"
						aria-hidden={!loading}
					>
						<LoaderCircle class="h-3 w-3 animate-spin" />
						Loading more photos
					</div>
				</div>
			</Lightbox.Content>
		</Lightbox.Portal>
	</Lightbox.Root>
</div>
