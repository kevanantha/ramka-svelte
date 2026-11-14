<!--
  Debug: mixed-media moodboard with a snug lightbox — full-width slides on
  mobile; aspect-sized snap cards + desktop thumbnails on md+; sibling
  dim/zoom CSS. Port of the original docs' app/(docs)/debug/moodboard-snug.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import { MediaQuery } from 'svelte/reactivity';
	import ExampleShell from '#lib/components/ExampleShell.svelte';
	import LightboxGallery from '#lib/components/LightboxGallery.svelte';
	import { triggerFocusClass } from '#lib/components/chrome.js';
	import type { GalleryItem } from '#lib/photos.js';
	import LightboxVideo from './LightboxVideo.svelte';
	import {
		FRAME_SIZE,
		moodboardProducts,
		threeScene,
		waitForLightboxPainted,
		type MoodboardProduct
	} from './three-model.svelte';
	import { mutedPlayback } from './video';

	type Tile =
		| { kind: 'image'; id: string; alt: string; caption: string; width: number; height: number }
		| {
				kind: 'video';
				id: string;
				alt: string;
				caption: string;
				poster: string;
				video: string;
		  }
		| { kind: 'model'; id: string; alt: string; caption: string; product: MoodboardProduct };

	/** Short vertical Mixkit clips — full-frame vivid color, portrait (720×1280). */
	const films = [
		{
			id: 'inks',
			title: 'Flowing colored inks',
			poster: '/photos/mixkit-inks-poster.jpg',
			video: 'https://assets.mixkit.co/videos/44793/44793-720.mp4'
		},
		{
			id: 'plasticine',
			title: 'Orange & teal plasticine',
			poster: '/photos/mixkit-plasticine-poster.jpg',
			video: 'https://assets.mixkit.co/videos/47332/47332-720.mp4'
		}
	] as const;
	const POSTER = { width: 720, height: 1280 };

	const imageDefs = [
		{
			id: 'mb-s-01',
			alt: 'Foggy pine ridge at dawn',
			caption: 'Dawn ridge',
			width: 800,
			height: 1200
		},
		{ id: 'mb-s-02', alt: 'Empty coastal highway', caption: 'Open road', width: 800, height: 533 },
		{
			id: 'mb-s-03',
			alt: 'Overhead of a linen breakfast table',
			caption: 'Slow morning',
			width: 800,
			height: 800
		},
		{ id: 'mb-s-04', alt: 'Narrow sunlit alley', caption: 'Warm alley', width: 800, height: 1200 },
		{ id: 'mb-s-05', alt: 'Wide desert dunes', caption: 'Dunes', width: 800, height: 467 },
		{ id: 'mb-s-06', alt: 'Rain on a window', caption: 'Rainy glass', width: 800, height: 1025 },
		{ id: 'mb-s-07', alt: 'Calm lake reflection', caption: 'Still water', width: 800, height: 533 },
		{ id: 'mb-s-08', alt: 'Tall concrete staircase', caption: 'Ascent', width: 800, height: 1200 }
	];

	/** A 12-tile wall: 7 photos, 2 vertical clips, 3 GLBs — mixed through the columns. */
	function buildTiles(): Tile[] {
		const images: Tile[] = imageDefs.map((img) => ({ kind: 'image', ...img }));
		const [shoe, bottle, chair] = moodboardProducts;
		const [inks, plasticine] = films;
		const film = (f: (typeof films)[number]): Tile => ({
			kind: 'video',
			id: f.id,
			alt: f.title,
			caption: f.title,
			poster: f.poster,
			video: f.video
		});
		const model = (product: MoodboardProduct): Tile => ({
			kind: 'model',
			id: product.id,
			alt: product.name,
			caption: `${product.name} · ${product.material}`,
			product
		});
		// Column-friendly order (index % 3 for 3-col masonry): video / model
		// land in different columns and rows.
		return [
			images[0]!,
			film(inks),
			images[1]!,
			model(shoe),
			images[2]!,
			images[3]!,
			film(plasticine),
			images[4]!,
			model(chair),
			images[5]!,
			model(bottle),
			images[6]!
		];
	}

	const tiles = buildTiles();

	function toGalleryItem(tile: Tile): GalleryItem {
		const base = { alt: tile.alt, caption: tile.caption };
		if (tile.kind === 'image') {
			const src = `/photos/${tile.id}.jpg`;
			return {
				...base,
				src,
				thumb: `/photos/thumbs/${tile.id}.jpg`,
				width: tile.width,
				height: tile.height
			};
		}
		if (tile.kind === 'video') {
			return { ...base, src: tile.poster, thumb: tile.poster, ...POSTER };
		}
		const shot = tile.product.screenshot.src;
		return { ...base, src: shot, thumb: shot, width: FRAME_SIZE, height: FRAME_SIZE };
	}

	const galleryItems = tiles.map(toGalleryItem);

	// Responsive column count without CSS multicol (2 on mobile, 3 from `sm`).
	const wide = new MediaQuery('(min-width: 640px)', false);
	const cols = $derived(wide.current ? 3 : 2);
	const columns = $derived.by(() => {
		const buckets: { tile: Tile; index: number }[][] = Array.from({ length: cols }, () => []);
		tiles.forEach((tile, i) => buckets[i % cols]!.push({ tile, index: i }));
		return buckets;
	});

	let activeIndex = $state(0);
	let open = $state(false);
	/** Orbit only after open settles — same gate as the 3d-models example. */
	let orbitReady = $state(false);

	// Videos stay chrome-free; photos + 3D share Zoom (trackpad pinch / buttons).
	const zoomControls = $derived(tiles[activeIndex]!.kind !== 'video');

	const tileClass = `block w-full cursor-pointer overflow-hidden rounded-xl border-none bg-transparent p-0 ${triggerFocusClass}`;
</script>

<svelte:head>
	<title>Moodboard (snug slides) — ramka-svelte</title>
</svelte:head>

{#snippet description()}
	Masonry wall with mixed media — photos, two muted autoplaying vertical clips, and three orbitable
	Khronos GLBs. Lightbox is snug on desktop (aspect-sized snap cards + gap, desktop thumbnail-strip)
	and full-width on mobile; sibling dim/blur while zoomed. 3D tiles wait for a painted WebGL frame
	via onBeforeOpen, then enable Trackball orbit after the morph settles.
{/snippet}

{#snippet slide(item: GalleryItem, i: number)}
	{@const tile = tiles[i]!}
	{#if tile.kind === 'video'}
		<LightboxVideo
			src={tile.video}
			poster={tile.poster}
			enabled={open}
			width={POSTER.width}
			height={POSTER.height}
		/>
	{:else if tile.kind === 'model'}
		{@const active = open && activeIndex === i}
		<Lightbox.Zoom maxZoom={6}>
			<Lightbox.Media
				width={FRAME_SIZE}
				height={FRAME_SIZE}
				class="overflow-hidden rounded-none bg-transparent md:rounded-lg"
			>
				<!-- Orbit after settle; spin from reveal. Trackball keeps noZoom —
				     Lightbox.Zoom owns pinch/trackpad zoom. -->
				<div
					{@attach threeScene({
						product: tile.product,
						role: 'lightbox',
						get interactive() {
							return orbitReady && active;
						},
						get autoRotate() {
							return active;
						}
					})}
					class="relative size-full min-h-0"
				></div>
			</Lightbox.Media>
		</Lightbox.Zoom>
	{:else}
		<Lightbox.Zoom maxZoom={6}>
			<Lightbox.Media
				width={item.width}
				height={item.height}
				class="overflow-hidden rounded-none md:rounded-lg"
			>
				<img
					src={item.src}
					alt={item.alt}
					width={item.width}
					height={item.height}
					loading="eager"
					draggable="false"
					class="select-none"
				/>
			</Lightbox.Media>
		</Lightbox.Zoom>
	{/if}
{/snippet}

<ExampleShell title="Moodboard (snug slides)" {description}>
	<Lightbox.Root
		loop
		bind:value={activeIndex}
		awaitImageDecode={false}
		scrollTriggerIntoView={[
			{ type: 'onChange', behavior: 'instant' },
			{ type: 'onOpenComplete', behavior: 'instant' }
		]}
		onOpenChange={(next) => {
			open = next;
			if (!next) orbitReady = false;
		}}
		onBeforeOpen={async ({ signal }) => {
			const tile = tiles[activeIndex];
			if (tile?.kind === 'model') {
				await waitForLightboxPainted(tile.product.id, { signal, timeoutMs: 2500 });
			}
		}}
		onOpenChangeComplete={(next) => {
			// Orbit only after open settles (avoid fighting the morph).
			orbitReady = next;
		}}
	>
		<div class="flex max-w-2xl gap-4">
			{#each columns as column, ci (ci)}
				<div class="flex min-w-0 flex-1 flex-col gap-4">
					{#each column as { tile, index } (tile.id)}
						{#if tile.kind === 'image'}
							<Lightbox.Trigger {index} class={tileClass}>
								{#snippet children({ image })}
									<img
										{@attach image}
										src="/photos/thumbs/{tile.id}.jpg"
										alt={tile.alt}
										width={tile.width}
										height={tile.height}
										loading="lazy"
										class="block h-auto w-full rounded-xl bg-neutral-100 object-cover transition duration-200 hover:opacity-90 dark:bg-neutral-800"
									/>
								{/snippet}
							</Lightbox.Trigger>
						{:else if tile.kind === 'video'}
							<Lightbox.Trigger {index} crossfade="close" class={tileClass}>
								<!-- Keep the wall looping; pause only while this tile is open. -->
								<video
									{@attach mutedPlayback(!open || activeIndex !== index)}
									src={tile.video}
									poster={tile.poster}
									width={POSTER.width}
									height={POSTER.height}
									muted
									playsinline
									autoplay
									loop
									preload="auto"
									disableremoteplayback
									aria-label="Muted video"
									class="block w-full rounded-xl bg-neutral-100 object-cover transition duration-200 hover:opacity-90 dark:bg-neutral-800"
								></video>
							</Lightbox.Trigger>
						{:else}
							<!-- 3D — canvas in the trigger morphs to the lightbox canvas. -->
							<Lightbox.Trigger {index} crossfade="both" class={tileClass}>
								{#snippet children({ morph })}
									<div
										{@attach morph}
										class="relative aspect-square w-full overflow-hidden rounded-xl bg-transparent"
									>
										<!-- Grid tiles are view-only — orbit only in the lightbox. -->
										<div
											{@attach threeScene({
												product: tile.product,
												role: 'trigger',
												interactive: false,
												get autoRotate() {
													return !open || activeIndex !== index;
												}
											})}
											class="pointer-events-none absolute inset-0 size-full"
										></div>
									</div>
								{/snippet}
							</Lightbox.Trigger>
						{/if}
					{/each}
				</div>
			{/each}
		</div>

		<LightboxGallery
			items={galleryItems}
			ariaLabel="Moodboard media"
			backdrop="solid"
			slidesLayout="snug"
			{zoomControls}
			{slide}
		/>
	</Lightbox.Root>
</ExampleShell>
