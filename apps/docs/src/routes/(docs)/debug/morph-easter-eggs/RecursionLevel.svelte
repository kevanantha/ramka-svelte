<!--
  V2 — lightboxes all the way down. Each nesting level is one photo in one
  shape: a circle, then a wide rectangle, then a square. The thumb trigger
  inside a level wears the next level's shape, so every open morphs
  shape-to-shape — which is the feature doing the joke's stunt work.
-->
<script lang="ts" module>
	import { ramkaA, ramkaC, ramkaD } from '#lib/photos.js';

	const RECURSION_LEVELS = [
		{
			img: ramkaA,
			frameClass: 'size-[min(66vmin,26rem)] rounded-full',
			thumbClass: 'size-12 rounded-full',
			hint: 'and inside it\u2026 another lightbox'
		},
		{
			img: ramkaD,
			frameClass: 'aspect-3/2 w-[min(84vw,34rem)] rounded-2xl',
			thumbClass: 'h-12 w-[4.5rem] rounded-lg',
			hint: 'told you. all the way down'
		},
		{
			img: ramkaC,
			frameClass: 'size-[min(66vmin,24rem)] rounded-md',
			thumbClass: 'size-12 rounded',
			hint: undefined
		}
	];
</script>

<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import CardTrigger from './CardTrigger.svelte';
	import EggViewer from './EggViewer.svelte';
	import SoloSlide from './SoloSlide.svelte';
	import RecursionLevel from './RecursionLevel.svelte';

	let { depth }: { depth: number } = $props();

	const level = $derived(RECURSION_LEVELS[depth - 1]!);
	const hasNext = $derived(depth < RECURSION_LEVELS.length);
</script>

<Lightbox.Root>
	{#if depth === 1}
		<CardTrigger crossfade="both" />
	{:else}
		<Lightbox.Trigger
			index={0}
			aria-label="Open lightbox level {depth}"
			class="pointer-events-auto block shrink-0 overflow-hidden shadow-lg ring-1 ring-white/30 transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 {level.thumbClass}"
		>
			{#snippet children({ image })}
				<img
					{@attach image}
					src={level.img.thumb}
					alt={level.img.alt}
					width={level.img.width}
					height={level.img.height}
					draggable="false"
					class="block size-full object-cover select-none"
				/>
			{/snippet}
		</Lightbox.Trigger>
	{/if}
	<EggViewer ariaLabel="Lightbox, level {depth} of {RECURSION_LEVELS.length}">
		<SoloSlide>
			{#snippet children({ image, morph })}
				<div class="flex max-h-full flex-col items-center">
					<div {@attach morph} class="overflow-hidden shadow-2xl {level.frameClass}">
						<img
							{@attach image}
							src={level.img.src}
							alt={level.img.alt}
							width={level.img.width}
							height={level.img.height}
							loading="eager"
							draggable="false"
							class="block size-full object-cover select-none"
						/>
					</div>
					<div class="mt-7 flex min-h-12 items-center gap-3.5">
						{#if hasNext}
							<p class="text-sm text-white/75">{level.hint}</p>
							<RecursionLevel depth={depth + 1} />
						{:else}
							<p class="text-sm text-white/75">
								Okay. That&rsquo;s enough. <span class="text-white/45">(ramka, probably)</span>
							</p>
						{/if}
					</div>
				</div>
			{/snippet}
		</SoloSlide>
	</EggViewer>
</Lightbox.Root>
