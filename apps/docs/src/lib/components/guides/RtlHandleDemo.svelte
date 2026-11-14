<!--
  Navigation mirrors, indices do not. The in-viewer buttons jump by index and
  land on the same photo they would in an LTR gallery — only the direction the
  track travels to get there is flipped.

  These docs are an LTR page, and nothing here compensates for that: `dir` on
  Root reaches the portaled viewer by itself.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import LightboxGallery from '#lib/components/LightboxGallery.svelte';
	import { triggerFocusClass } from '#lib/components/chrome.js';
	import { btnClass } from '#lib/components/demo/demo-classes.js';
	import TriggerGrid from '#lib/components/demo/TriggerGrid.svelte';
	import TriggerImage from '#lib/components/demo/TriggerImage.svelte';
	import { lightboxImages } from '#lib/photos.js';

	const overlayBtnClass =
		'rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-black/75';

	const lightbox = Lightbox.createHandle();
	let index = $state(0);

	const last = lightboxImages.length - 1;
	const jumps = [
		{ label: 'First (0)', index: 0 },
		{ label: 'Index 3', index: 3 },
		{ label: `Last (${last})`, index: last }
	];
</script>

<div class="space-y-4" dir="rtl">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<p class="text-sm text-neutral-600 dark:text-neutral-400">
			גלריית תמונות · active index {index}
		</p>
		<button type="button" onclick={() => lightbox.open(0)} class={btnClass}>פתיחת הגלריה</button>
	</div>

	<TriggerGrid>
		{#each lightboxImages as img, i (img.src)}
			<Lightbox.Trigger
				handle={lightbox}
				id="rtl-photo-{i}"
				index={i}
				class="block overflow-hidden rounded-2xl {triggerFocusClass}"
			>
				<TriggerImage src={img.thumb} alt={img.alt} />
			</Lightbox.Trigger>
		{/each}
	</TriggerGrid>

	<Lightbox.Root handle={lightbox} dir="rtl" onValueChange={(value) => (index = value)}>
		<LightboxGallery items={lightboxImages} ariaLabel="גלריית תמונות בגודל מלא">
			{#snippet overlay()}
				<div class="pointer-events-none absolute inset-x-0 top-3 z-40 flex justify-center">
					<div class="pointer-events-auto flex gap-2" dir="ltr">
						{#each jumps as jump (jump.index)}
							<button
								type="button"
								data-rtl-goto={jump.index}
								onclick={() => lightbox.goTo(jump.index)}
								class={overlayBtnClass}
							>
								{jump.label}
							</button>
						{/each}
					</div>
				</div>
			{/snippet}
		</LightboxGallery>
	</Lightbox.Root>
</div>
