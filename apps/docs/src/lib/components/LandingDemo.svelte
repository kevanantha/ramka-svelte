<!--
  Landing gallery, ported from the original's landing-demo.tsx. Most tiles
  are cross-aspect (wide tiles hold portrait sources and vice versa), so
  opening visibly morphs the frame. The last tile is a "+2" stack with
  `crossfade="both"`; `morphTo="closest"` brings closes from the hidden
  items back to it. Column sums are exact so the wall is a rectangle
  (see the original's comments for the math).
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import LightboxGallery from './LightboxGallery.svelte';
	import { triggerFocusClass } from './chrome';
	import * as P from '#lib/photos.js';
	import type { GalleryItem } from '#lib/photos.js';

	type Tile = GalleryItem & { tileClass: string; breakClass: string };

	const visible: Tile[] = [
		{ ...P.ramkaA, tileClass: 'aspect-[3/2]', breakClass: '' },
		{ ...P.ramkaB, tileClass: 'aspect-[4/5]', breakClass: '' },
		{ ...P.ramkaJ, tileClass: 'aspect-[12/7]', breakClass: '' },
		{ ...P.ramkaC, tileClass: 'aspect-square', breakClass: 'md:break-before-column' },
		{
			...P.ramkaD,
			tileClass: 'aspect-video',
			breakClass: 'break-before-column md:break-before-auto'
		},
		{ ...P.ramkaK, tileClass: 'aspect-square md:aspect-[16/15]', breakClass: '' },
		{
			...P.ramkaE,
			tileClass: 'aspect-[16/11] md:aspect-[5/3]',
			breakClass: 'md:break-before-column'
		},
		{ ...P.ramkaF, tileClass: 'aspect-[4/5] md:aspect-[5/6]', breakClass: '' },
		{
			...P.ramkaG,
			tileClass: 'aspect-[4/3] md:aspect-[10/7]',
			breakClass: 'break-before-column md:break-before-auto'
		},
		{ ...P.ramkaL, tileClass: 'aspect-video', breakClass: 'md:break-before-column' },
		{ ...P.ramkaN, tileClass: 'aspect-[4/5]', breakClass: '' },
		{ ...P.ramkaH, tileClass: 'aspect-[16/15] md:aspect-[16/11]', breakClass: '' }
	];
	/** Behind the "+2" tile — no triggers of their own. */
	const hidden: GalleryItem[] = [P.ramkaM, P.ramkaI];
	const all: GalleryItem[] = [...visible, ...hidden];
	const lastIndex = visible.length - 1;
</script>

<Lightbox.Root
	morphTo="closest"
	awaitImageDecode={false}
	scrollTriggerIntoView={[
		{ type: 'onChange', behavior: 'instant' },
		{ type: 'onOpenComplete', behavior: 'instant' }
	]}
>
	<div class="columns-3 gap-2 md:columns-4 md:gap-3">
		{#each visible as img, i (img.src)}
			{@const isStack = i === lastIndex}
			<Lightbox.Trigger
				index={i}
				crossfade={isStack ? 'both' : undefined}
				aria-label={isStack ? `Show ${hidden.length} more photos` : undefined}
				class="mb-2 block w-full scroll-my-12 break-inside-avoid overflow-hidden rounded-lg bg-neutral-100 p-0 md:mb-3 md:rounded-xl dark:bg-neutral-900 {img.breakClass} {triggerFocusClass}"
			>
				{#snippet children({ image })}
					<!-- Overlays stack via grid cells (abspos children of multicol items
					     don't paint reliably in Safari); ::after is a 0.5px inset outline. -->
					<span
						class="grid rounded-[inherit] after:pointer-events-none after:z-20 after:col-start-1 after:row-start-1 after:rounded-[inherit] after:shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.1)] after:content-[''] dark:after:shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.12)]"
					>
						<img
							{@attach image}
							src={img.thumb}
							alt={img.alt}
							draggable="false"
							class="col-start-1 row-start-1 block h-full w-full object-cover select-none {img.tileClass}"
						/>
						{#if isStack}
							<span
								aria-hidden="true"
								class="z-10 col-start-1 row-start-1 flex items-center justify-center bg-black/35 text-3xl font-semibold tracking-tight text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.45)] md:text-4xl"
							>
								+{hidden.length}
							</span>
						{/if}
					</span>
				{/snippet}
			</Lightbox.Trigger>
		{/each}
	</div>
	<!-- Peek (snug) is the first-visit default; the toggle + localStorage take over. -->
	<LightboxGallery
		items={all}
		ariaLabel="ramka demo gallery"
		backdrop="solid"
		slidesLayout="snug"
		layoutToggle
	/>
</Lightbox.Root>
