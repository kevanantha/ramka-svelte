<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import LightboxGallery from '#lib/components/LightboxGallery.svelte';
	import { triggerFocusClass } from '#lib/components/chrome.js';
	import { btnClass } from '#lib/components/demo/demo-classes.js';
	import TriggerGrid from '#lib/components/demo/TriggerGrid.svelte';
	import TriggerImage from '#lib/components/demo/TriggerImage.svelte';
	import { lightboxImages } from '#lib/photos.js';

	const lightbox = Lightbox.createHandle();
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<p class="text-sm text-neutral-600 dark:text-neutral-400">Product photos</p>
		<button
			type="button"
			onclick={() => lightbox.open(0, { triggerId: 'photo-0' })}
			class={btnClass}
		>
			View gallery
		</button>
	</div>

	<TriggerGrid>
		{#each lightboxImages as img, i (img.src)}
			<Lightbox.Trigger
				handle={lightbox}
				id="photo-{i}"
				index={i}
				class="block overflow-hidden rounded-2xl {triggerFocusClass}"
			>
				<TriggerImage src={img.thumb} alt={img.alt} />
			</Lightbox.Trigger>
		{/each}
	</TriggerGrid>

	<Lightbox.Root handle={lightbox}>
		<LightboxGallery items={lightboxImages} ariaLabel="Product photo gallery" />
	</Lightbox.Root>
</div>
