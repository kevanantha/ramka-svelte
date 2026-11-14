<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import LightboxGallery from '#lib/components/LightboxGallery.svelte';
	import { triggerFocusClass } from '#lib/components/chrome.js';
	import { blurStyle, morphImages } from '#lib/photos.js';

	let {
		morphTo,
		triggerCount = morphImages.length,
		crossfadeTriggers,
		ariaLabel
	}: {
		morphTo: 'active' | 'origin' | 'closest';
		triggerCount?: number;
		crossfadeTriggers?: 'all' | 'last';
		ariaLabel: string;
	} = $props();

	let value = $state(0);

	// Destination blur only for indexes with no trigger image (SvelteKit images guide).
	const items = $derived(
		morphImages.map((img, i) => ({ ...img, destinationBlur: i >= triggerCount }))
	);
</script>

<Lightbox.Root {morphTo} bind:value awaitImageDecode={false}>
	<div class="grid gap-2" style:grid-template-columns="repeat({triggerCount}, minmax(0, 1fr))">
		{#each morphImages.slice(0, triggerCount) as img, i (img.src)}
			{@const isCrossfade =
				crossfadeTriggers === 'all' || (crossfadeTriggers === 'last' && i === triggerCount - 1)}
			<Lightbox.Trigger
				index={i}
				crossfade={isCrossfade ? 'both' : undefined}
				class="block cursor-pointer rounded-lg border-none bg-transparent p-0 {triggerFocusClass}"
			>
				{#snippet children({ image })}
					<img
						{@attach image}
						src={img.thumb}
						alt={img.alt}
						width={img.width}
						height={img.height}
						style={blurStyle(img)}
						class="block aspect-[3/2] w-full rounded-lg object-cover"
						loading="lazy"
					/>
				{/snippet}
			</Lightbox.Trigger>
		{/each}
	</div>

	<LightboxGallery {items} {ariaLabel} />
</Lightbox.Root>
