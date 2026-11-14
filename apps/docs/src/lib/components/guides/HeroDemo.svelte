<!-- Compact live demo for the Lightbox docs hero. -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import LightboxGallery from '#lib/components/LightboxGallery.svelte';
	import { triggerFocusClass } from '#lib/components/chrome.js';
	import { docsHero } from '#lib/photos.js';
</script>

<Lightbox.Root>
	<div class="grid max-w-md grid-cols-3 gap-2">
		{#each docsHero as img, i (img.src)}
			<Lightbox.Trigger
				index={i}
				class="block aspect-square overflow-hidden rounded-lg bg-transparent p-0 {triggerFocusClass}"
			>
				{#snippet children({ image })}
					<img
						{@attach image}
						src={img.thumb}
						alt={img.alt}
						width={img.width}
						height={img.height}
						class="block size-full object-cover"
					/>
				{/snippet}
			</Lightbox.Trigger>
		{/each}
	</div>
	<LightboxGallery items={docsHero} ariaLabel="Lightbox hero demo" />
</Lightbox.Root>
