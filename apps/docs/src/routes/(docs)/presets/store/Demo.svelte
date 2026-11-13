<!--
  App-level demo, not part of the copy-paste package.

  A product card: small thumbs swap the main image (plain app state, not
  lightbox triggers), and the main image is the single `Lightbox.Trigger` for
  whatever is selected. `onValueChange` syncs viewer navigation back into
  that selection, so the close morph always lands on the image the user is
  looking at. Add-to-cart state is shared between the card and the viewer's
  buy panel via `ctaLabel` / `onAddToCart`.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import Gallery, { type ProductInfo, type StoreItem } from './Gallery.svelte';

	const product: ProductInfo = {
		name: 'Terra 27L Backpack',
		price: '$149',
		compareAtPrice: '$189',
		badge: 'New colour',
		description:
			'Waxed canvas, full-grain leather straps, and a padded 16″ laptop sleeve. Weather-ready for the daily commute or a weekend on the trail.',
		highlights: [
			'Water-resistant waxed canvas shell',
			'Padded 16″ laptop compartment',
			'Magnetic quick-access top pocket',
			'Lifetime repair guarantee'
		],
		stockNote: 'In stock — ships in 2 days'
	};

	const images: StoreItem[] = [
		{
			src: '/photos/store-pack-a.jpg',
			thumb: '/photos/store-pack-a-thumb.jpg',
			alt: 'Terra 27L backpack, front view',
			width: 1200,
			height: 1500
		},
		{
			src: '/photos/store-pack-b.jpg',
			thumb: '/photos/store-pack-b-thumb.jpg',
			alt: 'Terra 27L backpack, side profile',
			width: 1200,
			height: 1500
		},
		{
			src: '/photos/store-pack-c.jpg',
			thumb: '/photos/store-pack-c-thumb.jpg',
			alt: 'Detail of the waxed canvas and zippers',
			width: 1200,
			height: 1200
		},
		{
			src: '/photos/store-pack-d.jpg',
			thumb: '/photos/store-pack-d-thumb.jpg',
			alt: 'The backpack on a trail at golden hour',
			width: 1600,
			height: 1000
		},
		{
			src: '/photos/store-pack-e.jpg',
			thumb: '/photos/store-pack-e-thumb.jpg',
			alt: 'Interior compartments, laptop sleeve visible',
			width: 1200,
			height: 1500
		}
	];

	let selected = $state(0);
	let added = $state(false);
	const current = $derived(images[selected]!);
</script>

<div class="w-full max-w-2xl">
	<!-- Thumbs are the same product shots at lower res (same file + aspect),
	     so the placeholder bridge is seamless: skip the decode wait and start
	     the morph immediately. -->
	<Lightbox.Root loop onValueChange={(value) => (selected = value)} awaitImageDecode={false}>
		<div class="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
			<!-- Gallery column -->
			<div class="min-w-0 flex-1">
				<Lightbox.Trigger
					index={selected}
					class="slb-trigger block w-full overflow-hidden bg-neutral-100 p-0 dark:bg-neutral-800"
				>
					{#snippet children({ image })}
						{#key current.src}
							<img
								{@attach image}
								src={current.thumb}
								alt={current.alt}
								width={current.width}
								height={current.height}
								class="block aspect-square w-full object-cover"
								draggable="false"
							/>
						{/key}
					{/snippet}
				</Lightbox.Trigger>

				<div class="mt-3 flex gap-2" role="listbox" aria-label="Select product image">
					{#each images as img, i (img.src)}
						<button
							type="button"
							role="option"
							aria-selected={i === selected}
							aria-label={img.alt}
							onclick={() => (selected = i)}
							class="block size-14 shrink-0 overflow-hidden border p-0 transition {i === selected
								? 'border-neutral-900 dark:border-neutral-100'
								: 'border-neutral-200 opacity-70 hover:opacity-100 dark:border-neutral-700'}"
						>
							<img src={img.thumb} alt="" class="block size-full object-cover" draggable="false" />
						</button>
					{/each}
				</div>
			</div>

			<!-- Info column -->
			<div class="w-full md:w-56 md:shrink-0">
				<p
					class="text-[11px] font-semibold tracking-[0.08em] text-amber-700 uppercase dark:text-amber-400"
				>
					{product.badge}
				</p>
				<h3
					class="mt-1.5 text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
				>
					{product.name}
				</h3>
				<p class="mt-1 flex items-baseline gap-2 text-[15px]">
					<span class="text-neutral-900 dark:text-neutral-100">{product.price}</span>
					<s class="text-[13px] text-neutral-400">{product.compareAtPrice}</s>
				</p>
				<p class="mt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
					{product.description}
				</p>
				<button
					type="button"
					onclick={() => (added = true)}
					class="mt-6 w-full rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
				>
					{added ? 'Added to bag ✓' : 'Add to bag'}
				</button>
			</div>
		</div>

		<Gallery
			items={images}
			{product}
			ariaLabel="{product.name} gallery"
			ctaLabel={added ? 'Added to bag ✓' : 'Add to bag'}
			onAddToCart={() => (added = true)}
		/>
	</Lightbox.Root>
</div>
