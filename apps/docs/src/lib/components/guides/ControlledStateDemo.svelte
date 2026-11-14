<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import LightboxGallery from '#lib/components/LightboxGallery.svelte';
	import { btnClass } from '#lib/components/demo/demo-classes.js';
	import { lightboxImages } from '#lib/photos.js';

	let open = $state(false);
	let value = $state(0);
	const last = lightboxImages.length - 1;
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center gap-3">
		<button type="button" onclick={() => (open = true)} class={btnClass}>Open lightbox</button>
		<label class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
			Active index
			<input
				type="number"
				min={0}
				max={last}
				bind:value={() => value, (v) => (value = Math.max(0, Math.min(last, Number(v))))}
				class="w-16 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
			/>
		</label>
		<span class="text-xs text-neutral-500">open = {String(open)}</span>
	</div>

	<Lightbox.Root bind:open bind:value>
		<LightboxGallery items={lightboxImages} ariaLabel="Controlled photo gallery" />
	</Lightbox.Root>
</div>
