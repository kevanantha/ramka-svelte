<!--
  App-level demo, not part of the copy-paste package.

  An article excerpt with inline figures: each `<figure>` holds a
  `Lightbox.Trigger`, and opening one morphs into the editorial viewer with
  that figure's caption + credit under the media.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import Gallery, { type EditorialItem } from './Gallery.svelte';

	const figures: EditorialItem[] = [
		{
			src: '/photos/edit-harbor.jpg',
			thumb: '/photos/edit-harbor-thumb.jpg',
			alt: 'The old harbor at dawn, boats resting in still water',
			caption: 'The old harbor at dawn. Most of the fleet has not left the quay in a decade.',
			credit: 'Photograph: Anna Beck',
			width: 1600,
			height: 1000
		},
		{
			src: '/photos/edit-nets.jpg',
			thumb: '/photos/edit-nets-thumb.jpg',
			alt: 'Fishing nets stacked on the pier',
			caption: 'Nets stacked on the pier — mended each winter, used less each spring.',
			credit: 'Photograph: Anna Beck',
			width: 1000,
			height: 1400
		},
		{
			src: '/photos/edit-market.jpg',
			thumb: '/photos/edit-market-thumb.jpg',
			alt: 'The near-empty fish market hall in the early morning',
			caption: 'The market hall opens at five. By seven, the day’s catch is gone.',
			credit: 'Photograph: Jonas Ravn',
			width: 1600,
			height: 1000
		}
	];
</script>

{#snippet figure(index: number, className?: string)}
	{@const item = figures[index]!}
	<figure class={className}>
		<Lightbox.Trigger
			{index}
			class="elb-trigger block w-full scroll-my-5 overflow-hidden rounded-lg bg-transparent p-0"
		>
			{#snippet children({ image })}
				<img
					{@attach image}
					src={item.thumb}
					alt={item.alt}
					width={item.width}
					height={item.height}
					class="block w-full object-cover"
					draggable="false"
				/>
			{/snippet}
		</Lightbox.Trigger>
		<figcaption class="mt-2 text-[13px] leading-5 text-neutral-500">
			{item.caption} <span class="text-neutral-400 dark:text-neutral-600">{item.credit}</span>
		</figcaption>
	</figure>
{/snippet}

<article class="w-full max-w-xl text-start">
	<!-- Thumbs are the same photographs at lower res (same file + aspect), so
	     the placeholder bridge is seamless: skip the decode wait and start the
	     morph immediately.
	     Figures are scattered through a scrolling article, so after swiping to
	     another photograph its trigger may be off-viewport. `onClose`
	     repositions it inside the close transition's update phase (between
	     snapshot captures), so the page jump is never painted as a live frame.
	     (Scrolling earlier, e.g. `onChange`, makes iOS Safari re-rasterize the
	     open viewer and flash black tiles over the media.) -->
	<Lightbox.Root
		loop
		awaitImageDecode={false}
		scrollTriggerIntoView={[
			{ type: 'onOpenComplete', behavior: 'instant', block: 'nearest' },
			{ type: 'onClose', behavior: 'instant', block: 'nearest' }
		]}
	>
		<p class="text-[11px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">Dispatch</p>
		<h3
			class="mt-2 font-serif text-[26px] leading-snug tracking-tight text-neutral-900 dark:text-neutral-50"
		>
			The last fishermen of the northern coast
		</h3>
		<p class="mt-2 text-[13px] text-neutral-500">By Anna Beck · 8 min read</p>

		<p class="mt-5 text-[15px] leading-7 text-neutral-700 dark:text-neutral-300">
			The village wakes before the light does. For sixty years the boats went out whatever the
			weather; now, on most mornings, only three engines cough to life along the whole quay.
		</p>

		{@render figure(0, 'mt-6')}

		<p class="mt-6 text-[15px] leading-7 text-neutral-700 dark:text-neutral-300">
			Ask anyone here when it changed and they will not name a year. The harbor emptied the way
			harbors do — one retirement at a time, one son who moved to the city, one quota that made a
			small boat pointless.
		</p>

		<div class="mt-6 grid grid-cols-2 gap-4">
			{@render figure(1)}
			{@render figure(2)}
		</div>

		<Gallery items={figures} ariaLabel="Article photographs" />
	</Lightbox.Root>
</article>
