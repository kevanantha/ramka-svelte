<!--
  One image strip, in either architecture. `native`: a real scroller, the
  browser does the rest. `transform`: the transformCarousel attachment drives
  a translated track from pointer and wheel events (`decel` retunes its
  momentum live).
-->
<script lang="ts">
	import { transformCarousel } from './transform-carousel';
	import { STRIP_IMAGES } from './strip-images';

	let {
		kind,
		ariaLabel,
		decel
	}: { kind: 'native' | 'transform'; ariaLabel: string; decel?: () => number } = $props();
</script>

{#snippet images()}
	{#each STRIP_IMAGES as image (image.alt)}
		<img
			src={image.src}
			alt={image.alt}
			draggable="false"
			class="h-36 w-56 shrink-0 rounded-lg object-cover select-none"
		/>
	{/each}
{/snippet}

{#if kind === 'native'}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		role="group"
		aria-label={ariaLabel}
		tabindex="0"
		class="flex scrollbar-thin gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain overscroll-y-none rounded-xl pb-2"
	>
		{@render images()}
	</div>
{:else}
	<!-- overflow:hidden still makes this a scroll container as far as scroll
	     chaining is concerned, so containment here stops horizontal wheel
	     deltas the handler doesn't consume from becoming a back-swipe. -->
	<div
		{@attach transformCarousel(decel)}
		role="group"
		aria-label={ariaLabel}
		class="cursor-grab touch-pan-y overflow-hidden overscroll-x-contain rounded-xl active:cursor-grabbing"
	>
		<div class="flex w-max gap-3 will-change-transform">{@render images()}</div>
	</div>
{/if}
