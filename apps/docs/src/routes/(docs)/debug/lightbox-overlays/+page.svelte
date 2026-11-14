<!--
  Debug: the default preset's lightbox with bits-ui overlays inside the
  viewer (dialog stacking, dropdown menus, tooltips) vs the focus trap and
  inert slides. Port of the original docs' app/(docs)/debug/lightbox-overlays.
-->
<script lang="ts" module>
	import type { LightboxItem } from '../../presets/default/css/Gallery.svelte';

	const SLIDE_COUNT = 16;
	const TRIGGER_COUNT = 8;

	/** Intrinsic sizes of ramka-overlay-0…5; the set repeats the pattern. */
	const SIZES: [number, number][] = [
		[1200, 800],
		[800, 1200],
		[1200, 1200],
		[1600, 900],
		[1000, 1250],
		[1300, 975]
	];

	const slides: LightboxItem[] = Array.from({ length: SLIDE_COUNT }, (_, i) => {
		const [width, height] = SIZES[i % SIZES.length]!;
		return {
			id: `overlay-debug-${i}`,
			src: `/photos/ramka-overlay-${i}.jpg`,
			thumb: `/photos/thumbs/ramka-overlay-${i}.jpg`,
			alt: `Overlay test slide ${i + 1}`,
			caption: `Slide ${i + 1} · ${width}×${height}`,
			width,
			height
		};
	});

	const ratio = (item: LightboxItem) => item.width / item.height;
</script>

<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import OverlayTestPanel from './OverlayTestPanel.svelte';
	import '../../presets/default/css/lightbox.css';

	let slidesLayout = $state<'bleed' | 'snug'>('bleed');
	const snug = $derived(slidesLayout === 'snug');
</script>

<svelte:head>
	<title>Lightbox + overlays — ramka-svelte</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
	<header>
		<p
			class="text-[11px] font-semibold tracking-widest text-amber-700 uppercase dark:text-amber-400"
		>
			Debug · development only
		</p>
		<h1 class="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
			Lightbox + bits-ui overlays
		</h1>
		<p class="mt-3 max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
			Default preset gallery with {SLIDE_COUNT} slides. Open the lightbox and use the floating panel to
			exercise bits-ui dialog, dropdown menu, and tooltip portaled inside the modal viewer.
		</p>
	</header>

	<section class="space-y-3">
		<h2 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">What to verify</h2>
		<ul class="list-disc space-y-1 pl-5 text-sm text-neutral-600 dark:text-neutral-400">
			<li>Overlays render above slides and below / above nested dialogs as expected</li>
			<li>Arrow keys and swipe still change slides while a dropdown is closed</li>
			<li>Escape dismisses nested dialog first, then the lightbox</li>
			<li>Tab focus stays inside the topmost open overlay</li>
			<li>Inactive slides stay inert — no stranded focus on hidden slide controls</li>
			<li>Pinch-zoom hides chrome but overlay panel remains reachable</li>
		</ul>
	</section>

	<Lightbox.Root>
		<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
			{#each slides.slice(0, TRIGGER_COUNT) as item, i (item.id)}
				<Lightbox.Trigger
					index={i}
					class="lb-trigger block overflow-hidden rounded-[0.625rem] border border-neutral-300 bg-neutral-100 p-0 dark:border-neutral-700 dark:bg-neutral-800"
				>
					{#snippet children({ image })}
						<img
							{@attach image}
							src={item.thumb}
							alt={item.alt}
							width={item.width}
							height={item.height}
							class="aspect-[4/3] w-full object-cover"
						/>
					{/snippet}
				</Lightbox.Trigger>
			{/each}
		</div>
		<p class="text-xs text-neutral-500">
			Triggers show {TRIGGER_COUNT} thumbnails; the lightbox contains all {SLIDE_COUNT} slides.
		</p>

		<Lightbox.Portal class="lb-portal">
			<Lightbox.Backdrop class="lb-backdrop" />
			<Lightbox.Content
				aria-label="Lightbox overlay compatibility test"
				class={['lb-content', snug && 'lb-content-snug']}
			>
				{#key slidesLayout}
					<Lightbox.Slides
						aria-label="Full-size images"
						preload={2}
						class={['lb-slides', snug && 'lb-slides-snug']}
						style={snug
							? `--lb-snug-ratio-start: ${ratio(slides[0]!)}; --lb-snug-ratio-end: ${ratio(slides[slides.length - 1]!)}`
							: undefined}
					>
						{#each slides as item, i (item.id)}
							<Lightbox.Slide
								class={['lb-slide', snug && 'lb-slide-snug']}
								style={snug ? `--lb-snug-ratio: ${ratio(item)}` : undefined}
							>
								<Lightbox.Item index={i} caption={item.caption}>
									<Lightbox.Zoom maxZoom={6}>
										<Lightbox.Media class="lb-media" width={item.width} height={item.height}>
											<img
												src={item.src}
												alt={item.alt}
												width={item.width}
												height={item.height}
												loading="eager"
												draggable="false"
											/>
										</Lightbox.Media>
									</Lightbox.Zoom>
								</Lightbox.Item>
							</Lightbox.Slide>
						{/each}
					</Lightbox.Slides>
				{/key}

				<OverlayTestPanel />

				<div class="lb-top-right lb-chrome-gesture-hide">
					<button
						type="button"
						class="lb-control lb-control-md lb-control-layout"
						aria-pressed={snug}
						aria-label={snug ? 'Switch to full-bleed slides' : 'Switch to snug slides'}
						onclick={() => (slidesLayout = snug ? 'bleed' : 'snug')}
					>
						<!-- Icon mirrors the CURRENT layout, matching the default preset. -->
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.25"
							aria-hidden="true"
						>
							{#if snug}
								<rect x="8.5" y="7" width="7" height="10" rx="1.5" />
								<path d="M4 9v6M20 9v6" stroke-linecap="round" />
							{:else}
								<rect x="4" y="7" width="16" height="10" rx="1.5" />
							{/if}
						</svg>
					</button>
					<div class="lb-control-group lb-control-md">
						<Lightbox.ZoomOut class="lb-control lb-control-md" aria-label="Zoom out">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.25"
								aria-hidden="true"
							>
								<circle cx="11" cy="11" r="8" />
								<path d="m21 21-4.3-4.3M8 11h6" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</Lightbox.ZoomOut>
						<Lightbox.ZoomIn class="lb-control lb-control-md" aria-label="Zoom in">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.25"
								aria-hidden="true"
							>
								<circle cx="11" cy="11" r="8" />
								<path
									d="m21 21-4.3-4.3M11 8v6M8 11h6"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</Lightbox.ZoomIn>
					</div>
					<Lightbox.Close class="lb-control" aria-label="Close">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.25"
							aria-hidden="true"
						>
							<path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</Lightbox.Close>
				</div>

				<div class="lb-bottom lb-chrome-gesture-hide">
					<div class="lb-caption-group">
						<Lightbox.Caption class="lb-caption" />
						<Lightbox.Counter class="lb-counter">
							{#snippet children({ current, total })}{current} of {total}{/snippet}
						</Lightbox.Counter>
					</div>
					<Lightbox.ThumbnailStrip class="lb-thumbnail-strip lb-thumbnail-strip-desktop">
						<Lightbox.ThumbnailStripTrack aria-label="Photo thumbnails">
							{#each slides as item, i (item.id)}
								<Lightbox.Thumbnail index={i}>
									<img src={item.thumb} alt={item.alt} draggable="false" />
								</Lightbox.Thumbnail>
							{/each}
						</Lightbox.ThumbnailStripTrack>
						<span class="lb-thumbnail-strip-indicator" aria-hidden="true"></span>
					</Lightbox.ThumbnailStrip>
				</div>
			</Lightbox.Content>
		</Lightbox.Portal>
	</Lightbox.Root>
</div>
