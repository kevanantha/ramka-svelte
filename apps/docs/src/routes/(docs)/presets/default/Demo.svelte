<!--
  App-level demos only, not part of the copy-paste package.

  Both skin variants export the same API (a `Gallery` plus the
  `triggerProps` every trigger spreads), so this demo renders either one:
  the docs page toggles between them. In your app, import ONE variant
  (`./css/Gallery.svelte` or `./tailwind/Gallery.svelte`) directly.

  1. +N overlay tile with `crossfade` + `morphTo="closest"`
  2. Child morph via `morph` (chrome stays put)
  3. Whole-trigger morph + crossfade (card → photo)
-->
<script lang="ts" module>
	import CssGallery, {
		triggerProps as cssTriggerProps,
		type LightboxItem
	} from './css/Gallery.svelte';
	import TailwindGallery, { triggerProps as tailwindTriggerProps } from './tailwind/Gallery.svelte';

	const variants = {
		css: { Gallery: CssGallery, triggerProps: cssTriggerProps },
		tailwind: { Gallery: TailwindGallery, triggerProps: tailwindTriggerProps }
	};

	export type PresetVariant = keyof typeof variants;

	/** Demo seed data: dims are explicit (the Gallery requires them). */
	const trip: LightboxItem[] = [
		['a', 'Maya on the ridge', 'Maya Chen', 1200, 1200],
		['b', 'Cliffside road at sunset', 'Cliffside road at sunset', 1600, 1000],
		['c', 'Turquoise cove', 'A turquoise cove', 1600, 1000],
		['d', 'Trail through pines', 'Through the pines', 1200, 1500],
		['e', 'Camp under the stars', 'Camp under the stars', 1600, 1000],
		['f', 'Morning coffee on the rocks', 'Morning on the rocks', 1200, 1200],
		['g', 'Waterfall in the canyon', 'Hidden waterfall', 1600, 1000],
		['h', 'Wildflowers on the hillside', 'Wildflower meadow', 1200, 1500],
		['i', 'Kayaks on calm water', 'Kayak at dawn', 1600, 1000],
		['j', 'Sunset over the lake', 'Golden hour', 1200, 1200],
		['k', 'Boardwalk through the marsh', 'Coastal marsh', 1600, 1000],
		['l', 'Fire lookout tower', 'Summit lookout', 1200, 1500]
	].map(([key, alt, caption, width, height]) => ({
		src: `/photos/preset-trip-${key}.jpg`,
		thumb: `/photos/preset-trip-${key}-thumb.jpg`,
		alt: alt as string,
		caption: caption as string,
		width: width as number,
		height: height as number
	}));

	const portrait = trip[0]!;
	const listing = trip[1]!;
	const extra = trip.length - 4;

	/** Outer corners for a 2×2 grid: must live on the Trigger (the morph reads its radius). */
	const tileCorners = [
		'rounded-tl-[0.875rem] rounded-tr-none rounded-br-none rounded-bl-none',
		'rounded-tl-none rounded-tr-[0.875rem] rounded-br-none rounded-bl-none',
		'rounded-tl-none rounded-tr-none rounded-br-none rounded-bl-[0.875rem]',
		'rounded-tl-none rounded-tr-none rounded-br-[0.875rem] rounded-bl-none'
	];

	const cardClass =
		'rounded-[1.125rem] border border-neutral-300 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.06),0_4px_12px_rgb(0_0_0/0.06)] dark:border-neutral-600 dark:bg-neutral-800 dark:shadow-[0_1px_2px_rgb(0_0_0/0.4),0_4px_16px_rgb(0_0_0/0.35)]';
</script>

<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';

	let { variant = 'css' }: { variant?: PresetVariant } = $props();

	const { Gallery, triggerProps } = $derived(variants[variant]);
</script>

<div class="flex w-full max-w-md flex-col gap-8">
	<!-- 2×2 grid; extras behind +N. The overlay trigger crossfades, and
	     `morphTo="closest"` closes overflow slides onto the nearest tile. The
	     corner radius lives on each Trigger so the morph can animate it.
	     `awaitImageDecode={false}` throughout: every thumb is the same photo at
	     lower res (same file + aspect), so the placeholder bridge is seamless
	     and the morph can start immediately instead of waiting on decode. -->
	<Lightbox.Root morphTo="closest" awaitImageDecode={false}>
		<p class="mb-2 text-xs font-medium tracking-wide text-neutral-500 uppercase">
			+N overlay with crossfade
		</p>
		<div
			class="grid aspect-[3/2] w-full grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-[0.875rem]"
		>
			{#each trip.slice(0, 4) as img, i (img.src)}
				{@const showOverlay = i === 3 && extra > 0}
				<Lightbox.Trigger
					{...triggerProps}
					index={i}
					crossfade={showOverlay ? 'both' : undefined}
					class="{triggerProps.class} relative block min-h-0 min-w-0 overflow-hidden border-0 bg-transparent p-0 {tileCorners[
						i
					]}"
				>
					{#snippet children({ image })}
						<img
							{@attach image}
							width={img.width}
							height={img.height}
							src={img.thumb}
							alt={img.alt}
							class="absolute inset-0 size-full object-cover"
						/>
						{#if showOverlay}
							<span
								class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50"
							>
								<span class="text-2xl font-bold text-white">+{extra}</span>
							</span>
						{/if}
					{/snippet}
				</Lightbox.Trigger>
			{/each}
		</div>
		<Gallery items={trip} ariaLabel="Trip photos" />
	</Lightbox.Root>

	<!-- The Trigger wraps the card; `{@attach morph}` (+ `image`) on the photo so only
	     that child morphs: title and price stay put. -->
	<Lightbox.Root awaitImageDecode={false}>
		<p class="mb-2 text-xs font-medium tracking-wide text-neutral-500 uppercase">
			Child morph via the morph attachment
		</p>
		<Lightbox.Trigger
			{...triggerProps}
			index={0}
			class="{triggerProps.class} w-full overflow-hidden text-start {cardClass}"
		>
			{#snippet children({ image, morph })}
				<img
					{@attach image}
					{@attach morph}
					width={listing.width}
					height={listing.height}
					src={listing.thumb}
					alt={listing.alt}
					class="aspect-[16/10] w-full rounded-t-[1.125rem] object-cover"
				/>
				<span class="block space-y-0.5 p-3">
					<span class="block text-sm font-semibold text-neutral-900 dark:text-neutral-50">
						Cliffside cottage
					</span>
					<span class="block text-xs text-neutral-500">Big Sur, CA · Sleeps 4</span>
					<span class="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
						$420 <span class="font-normal text-neutral-500">night</span>
					</span>
				</span>
			{/snippet}
		</Lightbox.Trigger>
		<Gallery
			items={[{ ...listing, caption: 'Cliffside cottage · Big Sur' }]}
			ariaLabel="Cliffside cottage"
		/>
	</Lightbox.Root>

	<!-- The whole trigger morphs (default); `crossfade="both"` dissolves card ↔ photo. -->
	<Lightbox.Root awaitImageDecode={false}>
		<p class="mb-2 text-xs font-medium tracking-wide text-neutral-500 uppercase">
			Whole trigger morph
		</p>
		<Lightbox.Trigger
			{...triggerProps}
			index={0}
			crossfade="both"
			class="{triggerProps.class} flex w-44 flex-col items-center gap-3 p-4 text-center {cardClass}"
		>
			{#snippet children({ image })}
				<img
					{@attach image}
					width={portrait.width}
					height={portrait.height}
					src={portrait.thumb}
					alt=""
					class="size-16 rounded-full object-cover"
				/>
				<span class="min-w-0">
					<span class="block text-sm font-semibold text-neutral-900 dark:text-neutral-50">
						Maya Chen
					</span>
					<span class="block text-xs text-neutral-500">@mayachen</span>
					<span class="mt-1 block text-xs text-neutral-600 dark:text-neutral-400">
						Photographer
					</span>
				</span>
			{/snippet}
		</Lightbox.Trigger>
		<Gallery items={[portrait]} ariaLabel="Maya Chen portrait" />
	</Lightbox.Root>
</div>
