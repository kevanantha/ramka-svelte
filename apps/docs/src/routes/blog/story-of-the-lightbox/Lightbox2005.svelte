<!--
  An era-accurate recreation of the 2005–2006 Lightbox experience: dimmed
  overlay, white photo frame, a loading spinner standing in for loading.gif,
  Verdana captions, hover-half prev/next zones, and the famous animated
  resize between photos of different sizes.

  The photos are CSS gradients so the demo ships no image assets and the
  resize wobble is visible immediately. The overlay is scoped to the figure
  (absolute, not fixed) so the demo never takes over the reader's page.
-->
<script lang="ts">
	const PHOTOS = [
		{
			id: 'dunes',
			title: 'Dunes at Fort Funston',
			// Frame size at the demo's scale — deliberately mismatched aspect ratios.
			w: 236,
			h: 158,
			gradient: 'linear-gradient(160deg, #fcd34d 0%, #fb923c 45%, #be456b 100%)'
		},
		{
			id: 'bridge',
			title: 'Bridge, fog coming in',
			w: 164,
			h: 210,
			gradient: 'linear-gradient(200deg, #bae6fd 0%, #7c9ff2 55%, #4c3d8f 100%)'
		},
		{
			id: 'tide',
			title: 'Ocean Beach, low tide',
			w: 252,
			h: 132,
			gradient: 'linear-gradient(120deg, #99f6e4 0%, #34b3a8 50%, #135e63 100%)'
		}
	];

	const FRAME_PADDING = 10;
	const CAPTION_HEIGHT = 46;
	/** Roughly the resizeDuration the original computed from its speed setting. */
	const RESIZE_MS = 420;
	const LOAD_MS = 650;
	const verdana = 'font-family: Verdana, sans-serif;';

	let index = $state<number | null>(null);
	let loading = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => () => clearTimeout(timer));

	function goTo(next: number) {
		index = next;
		loading = true;
		clearTimeout(timer);
		// The original resized the frame first, then faded the photo in once
		// loading.gif's work was done. Same order here.
		timer = setTimeout(() => (loading = false), LOAD_MS);
	}

	function close() {
		clearTimeout(timer);
		index = null;
		loading = false;
	}

	const photo = $derived(index === null ? null : PHOTOS[index]!);
	const frameWidth = $derived((photo?.w ?? 0) + FRAME_PADDING * 2);
	const frameHeight = $derived((photo?.h ?? 0) + FRAME_PADDING + CAPTION_HEIGHT);

	const hoverLabel =
		'absolute top-1/2 -translate-y-1/2 bg-black/45 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100';
</script>

<!-- Grey skeleton bar standing in for 2005 blog prose. -->
{#snippet bar(className: string)}
	<div class="rounded-sm bg-neutral-200/80 dark:bg-neutral-800 {className}"></div>
{/snippet}

<figure class="my-8 rounded-2xl border border-neutral-200 p-4 md:p-5 dark:border-neutral-800">
	<div
		class="relative overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
	>
		<!-- A 2005 blog post, at miniature scale. -->
		<div class="flex flex-col gap-4 p-4 md:p-5">
			<div>
				<div class="font-serif text-[17px] font-bold text-neutral-800 dark:text-neutral-200">
					Weekend photos
				</div>
				<div class="mt-1 text-[11px] text-neutral-400" style={verdana}>
					Posted December 2005 · 3 comments
				</div>
			</div>
			<div class="flex flex-col gap-2">
				{@render bar('h-2.5 w-full')}
				{@render bar('h-2.5 w-11/12')}
				{@render bar('h-2.5 w-3/5')}
			</div>
			<div class="flex flex-wrap items-center gap-3">
				{#each PHOTOS as p, i (p.id)}
					<button
						type="button"
						onclick={() => goTo(i)}
						class="block cursor-pointer border border-neutral-300 bg-white p-1 transition hover:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-500"
						aria-label="Open {p.title} in the 2005 lightbox"
					>
						<span class="block h-12 w-16" style:background={p.gradient}></span>
					</button>
				{/each}
			</div>
			<div class="flex flex-col gap-2">
				{@render bar('h-2.5 w-10/12')}
				{@render bar('h-2.5 w-2/3')}
			</div>
		</div>

		<!-- The overlay. In 2005 this was a tiled translucent PNG, because
		     rgba() backgrounds were still years from being dependable. -->
		{#if photo && index !== null}
			<div class="absolute inset-0 z-10 flex items-center justify-center p-3">
				<button
					type="button"
					aria-label="Close by clicking the overlay"
					onclick={close}
					class="absolute inset-0 cursor-pointer bg-black/75"
				></button>
				<div
					class="relative bg-white shadow-2xl"
					style:width="{frameWidth}px"
					style:height="{frameHeight}px"
					style:max-width="100%"
					style:transition="width {RESIZE_MS}ms ease-in-out, height {RESIZE_MS}ms ease-in-out"
				>
					<div
						class="absolute"
						style:inset="{FRAME_PADDING}px"
						style:bottom="{CAPTION_HEIGHT - FRAME_PADDING}px"
					>
						<div
							class="absolute inset-0 transition-opacity duration-300"
							style:background={photo.gradient}
							style:opacity={loading ? 0 : 1}
						></div>
						{#if loading}
							<div class="absolute inset-0 flex items-center justify-center">
								<span
									aria-hidden="true"
									class="inline-block size-6 animate-spin rounded-full border-[3px] border-neutral-300 border-t-neutral-600"
								></span>
							</div>
						{:else}
							<!-- Hover-half navigation, the 2006 way: PREV lives on the left
							     50% of the photo, NEXT on the right, visible on hover. -->
							<button
								type="button"
								onclick={() => goTo((index! + PHOTOS.length - 1) % PHOTOS.length)}
								class="group absolute inset-y-0 left-0 w-1/2 cursor-pointer"
								aria-label="Previous image"
							>
								<span class="{hoverLabel} left-1.5" style={verdana}>‹ PREV</span>
							</button>
							<button
								type="button"
								onclick={() => goTo((index! + 1) % PHOTOS.length)}
								class="group absolute inset-y-0 right-0 w-1/2 cursor-pointer"
								aria-label="Next image"
							>
								<span class="{hoverLabel} right-1.5" style={verdana}>NEXT ›</span>
							</button>
						{/if}
					</div>

					<!-- The caption bar: Verdana, #666, and a CLOSE control, exactly
					     the furniture the original drew under every photo. -->
					<div
						class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-2.5 pb-2"
						style:height="{CAPTION_HEIGHT}px"
						style:font-family="Verdana, sans-serif"
					>
						<div class="min-w-0">
							<div class="truncate text-[11px] font-bold text-neutral-700">
								{loading ? '' : photo.title}
							</div>
							<div class="mt-0.5 text-[10px] text-neutral-400">
								Image {index + 1} of {PHOTOS.length}
							</div>
						</div>
						<button
							type="button"
							onclick={close}
							class="shrink-0 cursor-pointer text-[10px] font-bold tracking-wide text-neutral-500 transition hover:text-neutral-800"
						>
							CLOSE ×
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<figcaption class="mt-4 text-[13px] leading-6 text-neutral-500 dark:text-neutral-400">
		Click a thumbnail. The dim, the white frame, the loading spinner, the caption in tiny Verdana,
		and the animated resize between differently sized photos are all faithful to 2005–2006 Lightbox,
		down to prev and next being invisible until you hover the photo&rsquo;s left or right half. One
		period detail is simulated: the original&rsquo;s dim was a tiled translucent PNG, not CSS
		opacity. And notice what your thumb already misses: no swiping, no pinch, no momentum. In 2005,
		you clicked.
	</figcaption>
</figure>
