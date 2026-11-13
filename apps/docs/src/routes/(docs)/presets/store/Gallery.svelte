<!--
  Store lightbox: design-system package entry (copy with lightbox.css).

  A full commerce viewer, not just a photo overlay: the media stage keeps a
  vertical thumbnail rail (desktop) with a bottom ‹ 2 / 5 › pagination
  cluster and corner zoom controls, while a buy panel stays alongside:
  product name, price (with compare-at), description, highlights, stock note
  and the add-to-cart CTA. Mobile swaps the panel for a sticky price + CTA
  bar under the media. The shopper never loses the buy button while
  inspecting photos.

  Place it under `Lightbox.Root`, beside your triggers (give them the
  `slb-trigger` class). The rail is a plain `ThumbnailGroup` tablist: product
  galleries have a handful of images, so every thumb is visible and arrow
  keys / clicks jump directly. Pass a `panel` snippet to replace the default
  panel body (variant pickers, size selectors, reviews); the chrome stays.
-->
<script lang="ts" module>
	/** Item shape for the gallery: pass the real intrinsic pixel size. */
	export type StoreItem = {
		id?: string | number;
		src: string;
		thumb: string;
		alt: string;
		width: number;
		height: number;
	};

	/** Product data rendered by the buy panel (desktop) and mobile bar. */
	export type ProductInfo = {
		name: string;
		price: string;
		/** Original price, rendered struck-through next to `price`. */
		compareAtPrice?: string;
		/** Short label above the name, e.g. “New colour” or “Bestseller”. */
		badge?: string;
		description?: string;
		/** Bullet points under the description. */
		highlights?: string[];
		/** Availability line above the CTA, e.g. “In stock — ships in 2 days”. */
		stockNote?: string;
	};
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Lightbox from 'ramka-svelte/lightbox';
	import './lightbox.css';

	let {
		items,
		product,
		ariaLabel,
		ctaLabel = 'Add to bag',
		onAddToCart,
		panel
	}: {
		items: StoreItem[];
		product: ProductInfo;
		ariaLabel: string;
		ctaLabel?: string;
		onAddToCart?: () => void;
		panel?: Snippet;
	} = $props();

	const multiple = $derived(items.length > 1);
</script>

{#snippet priceRow(compact: boolean)}
	<span class={compact ? 'slb-mobile-price' : 'slb-price-row'}>
		<span class="slb-price">{product.price}</span>
		{#if product.compareAtPrice}<s class="slb-compare-at">{product.compareAtPrice}</s>{/if}
	</span>
{/snippet}

<Lightbox.Portal class="slb-portal">
	<Lightbox.Backdrop class="slb-backdrop" />
	<Lightbox.Content class="slb-content" aria-label={ariaLabel}>
		<Lightbox.Stage class="slb-stage">
			<!-- The library ships no copy, so the words announcing the carousel
			     and its slides live here, next to the rest of your UI strings. -->
			<Lightbox.Slides
				class="slb-slides"
				aria-label="Product images"
				aria-roledescription="carousel"
				preload={2}
			>
				{#each items as item, i (item.id ?? i)}
					<Lightbox.Slide class="slb-slide">
						<!-- With the rail the item is a `tabpanel` its thumbnail tab
						     already names, so only the single-image shape needs a name. -->
						<Lightbox.Item
							index={i}
							aria-roledescription="slide"
							aria-label={multiple ? undefined : `${i + 1} of ${items.length}`}
						>
							<Lightbox.Zoom maxZoom={5}>
								<Lightbox.Media class="slb-media" width={item.width} height={item.height}>
									<img
										width={item.width}
										height={item.height}
										src={item.src}
										alt={item.alt}
										loading="eager"
										draggable="false"
									/>
								</Lightbox.Media>
							</Lightbox.Zoom>
						</Lightbox.Item>
					</Lightbox.Slide>
				{/each}
			</Lightbox.Slides>

			<Lightbox.Close class="slb-control slb-close slb-chrome-gesture-hide" aria-label="Close">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
				>
					<path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</Lightbox.Close>

			{#if multiple}
				<Lightbox.ThumbnailGroup
					class="slb-rail slb-chrome-gesture-hide"
					aria-label="Product images"
				>
					{#each items as item, i (item.id ?? i)}
						<Lightbox.Thumbnail index={i} class="slb-rail-thumb">
							<img src={item.thumb} alt={item.alt} draggable="false" />
						</Lightbox.Thumbnail>
					{/each}
				</Lightbox.ThumbnailGroup>

				<div class="slb-pager slb-chrome-gesture-hide">
					<Lightbox.Previous class="slb-control slb-nav" aria-label="Previous">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<path d="m15 18-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</Lightbox.Previous>
					<Lightbox.Counter class="slb-counter">
						{#snippet children({ current, total })}{current} / {total}{/snippet}
					</Lightbox.Counter>
					<Lightbox.Next class="slb-control slb-nav" aria-label="Next">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</Lightbox.Next>
				</div>
			{/if}

			<div class="slb-zoom-group slb-chrome-gesture-hide">
				<Lightbox.ZoomOut class="slb-control" aria-label="Zoom out">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<circle cx="11" cy="11" r="8" />
						<path d="m21 21-4.3-4.3M8 11h6" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</Lightbox.ZoomOut>
				<Lightbox.ZoomIn class="slb-control" aria-label="Zoom in">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<circle cx="11" cy="11" r="8" />
						<path d="m21 21-4.3-4.3M11 8v6M8 11h6" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</Lightbox.ZoomIn>
			</div>
		</Lightbox.Stage>

		<!-- The buy context (panel / mobile bar) stays put during pull-to-dismiss;
		     only the stage chrome fades. -->
		<aside class="slb-panel" aria-label="Product details">
			{#if panel}
				{@render panel()}
			{:else}
				<div class="slb-panel-body">
					{#if product.badge}<span class="slb-badge">{product.badge}</span>{/if}
					<h2 class="slb-name">{product.name}</h2>
					{@render priceRow(false)}
					{#if product.description}<p class="slb-description">{product.description}</p>{/if}
					{#if product.highlights?.length}
						<ul class="slb-highlights">
							{#each product.highlights as line (line)}
								<li>{line}</li>
							{/each}
						</ul>
					{/if}
				</div>
				<div class="slb-panel-footer">
					{#if product.stockNote}<p class="slb-stock">{product.stockNote}</p>{/if}
					<button type="button" class="slb-cta" onclick={onAddToCart}>{ctaLabel}</button>
				</div>
			{/if}
		</aside>

		<!-- Mobile: the buy context rides along under the media. -->
		<div class="slb-mobile-bar">
			<div class="slb-mobile-info">
				<span class="slb-mobile-name">{product.name}</span>
				{@render priceRow(true)}
			</div>
			<button type="button" class="slb-cta slb-cta-compact" onclick={onAddToCart}>{ctaLabel}</button
			>
		</div>
	</Lightbox.Content>
</Lightbox.Portal>
