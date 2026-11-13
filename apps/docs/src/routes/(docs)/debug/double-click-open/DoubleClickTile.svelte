<!--
  Accessible double-click-to-open tile:

  - Preview: double-click opens via `handle.open` (pointer convenience).
  - `Lightbox.Trigger`: explicit single-pointer control (WCAG 2.5.1) with
    native button semantics, keyboard (Enter/Space), and focus return.
  - The trigger's `morph` targets the preview; the library-injected
    `data-morph-target` hide covers it during morphs; `image` keeps
    placeholder bridging.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import { triggerFocusClass } from '#lib/components/chrome.js';

	let {
		handle,
		photo,
		index
	}: {
		handle: Lightbox.LightboxHandle;
		photo: { id: string; thumb: string; alt: string };
		index: number;
	} = $props();

	let preview = $state<HTMLDivElement | null>(null);

	const triggerId = $derived(photo.id);
	const previewId = $derived(`${triggerId}-preview`);
	const hintId = $derived(`${triggerId}-hint`);
</script>

<figure class="flex flex-col gap-2">
	<div
		bind:this={preview}
		id={previewId}
		role="group"
		aria-labelledby="{previewId}-label {hintId}"
		class="relative overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900"
		ondblclick={() => handle.open(index, { triggerId })}
	>
		<p id="{previewId}-label" class="sr-only">{photo.alt}</p>
		<img
			src={photo.thumb}
			alt=""
			aria-hidden="true"
			draggable="false"
			class="aspect-square w-full object-cover"
		/>
	</div>

	<p id={hintId} class="text-xs text-neutral-500 dark:text-neutral-400">Double-click photo</p>

	<Lightbox.Trigger
		{handle}
		id={triggerId}
		{index}
		class="self-start rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800 {triggerFocusClass}"
	>
		{#snippet children({ image, morph })}
			<!-- `morph` must target the preview (a sibling of the button), so the
			     hide applies to the visible photo, not this sr-only image. -->
			<img
				{@attach image}
				{@attach () => (preview ? morph(preview) : undefined)}
				src={photo.thumb}
				alt=""
				aria-hidden="true"
				class="sr-only"
			/>
			Open {photo.alt}
		{/snippet}
	</Lightbox.Trigger>
</figure>
