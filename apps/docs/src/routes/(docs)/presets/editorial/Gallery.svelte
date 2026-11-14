<!--
  Editorial lightbox: design-system package entry (copy with lightbox.css).

  The viewer newsrooms use for article figures: a near-black surface in both
  color schemes (photography reads best on dark), a typography-forward
  caption + credit block under the media, a counter top-left, and ghost
  controls. Keyboard-first; no zoom: this is a reading context, not an
  inspection one (swipe / arrows to browse, pull down to dismiss).

  Place it under `Lightbox.Root`, beside your triggers (give them the
  `elb-trigger` class).
-->
<script lang="ts" module>
	/** Item shape for the gallery: pass the real intrinsic pixel size. */
	export type EditorialItem = {
		id?: string | number;
		src: string;
		thumb?: string;
		alt: string;
		/** The figure caption: a sentence describing the photograph. */
		caption?: string;
		/** The credit line, e.g. “Photograph: Anna Beck / Agence Lumière”. */
		credit?: string;
		width: number;
		height: number;
	};
</script>

<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import './lightbox.css';

	let { items, ariaLabel }: { items: EditorialItem[]; ariaLabel: string } = $props();

	const multiple = $derived(items.length > 1);
</script>

<Lightbox.Portal class="elb-portal">
	<Lightbox.Backdrop class="elb-backdrop" />
	<Lightbox.Content class="elb-content" aria-label={ariaLabel}>
		<!-- The library ships no copy, so the words announcing the carousel and
		     its slides live here, next to the rest of your UI strings. -->
		<Lightbox.Slides
			class="elb-slides"
			aria-label="Article photographs"
			aria-roledescription="carousel"
			preload={2}
		>
			{#each items as item, i (item.id ?? i)}
				<!-- Caption + credit as one block for `Item`, rendered by `Caption`. -->
				{#snippet figureCaption()}
					{#if item.caption}<span class="elb-caption-text">{item.caption}</span
						>{/if}{#if item.credit}<span class="elb-credit">{item.credit}</span>{/if}
				{/snippet}
				<Lightbox.Slide class="elb-slide">
					<Lightbox.Item
						class="elb-item"
						index={i}
						caption={item.caption || item.credit ? figureCaption : undefined}
						aria-roledescription="slide"
						aria-label="{i + 1} of {items.length}"
					>
						<Lightbox.Media class="elb-media" width={item.width} height={item.height}>
							<img
								width={item.width}
								height={item.height}
								src={item.src}
								alt={item.alt}
								loading="eager"
								draggable="false"
							/>
						</Lightbox.Media>
					</Lightbox.Item>
				</Lightbox.Slide>
			{/each}
		</Lightbox.Slides>

		<div class="elb-top elb-chrome-gesture-hide">
			{#if multiple}
				<Lightbox.Counter class="elb-counter" />
			{:else}
				<span></span>
			{/if}
			<Lightbox.Close class="elb-control" aria-label="Close">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.75"
					aria-hidden="true"
				>
					<path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</Lightbox.Close>
		</div>

		{#if multiple}
			<Lightbox.Previous class="elb-control elb-nav elb-nav-prev elb-chrome-gesture-hide">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.75"
					aria-hidden="true"
				>
					<path d="m15 18-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</Lightbox.Previous>
			<Lightbox.Next class="elb-control elb-nav elb-nav-next elb-chrome-gesture-hide">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.75"
					aria-hidden="true"
				>
					<path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</Lightbox.Next>
		{/if}

		<div class="elb-bottom elb-chrome-gesture-hide">
			<Lightbox.Caption class="elb-caption" />
		</div>
	</Lightbox.Content>
</Lightbox.Portal>
