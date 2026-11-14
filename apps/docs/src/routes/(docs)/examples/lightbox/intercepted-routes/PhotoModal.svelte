<!--
  The viewer a grid click opens over the grid: a self-contained, ALREADY-OPEN
  lightbox. There are no Lightbox.Triggers: a navigation opened it, not a
  gesture, which is the pattern's defining tradeoff: the open never flows
  through the library's gesture path, so it fades in rather than morphing
  from the clicked tile.

  The default body portal is fine here (unlike the URL-synced state
  example's container: null): this only mounts after a client-side click,
  where document.body exists. Nothing here is ever server-painted.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import LightboxGallery from '#lib/components/LightboxGallery.svelte';
	import { EXAMPLE_BASE_PATH, interceptedPhotos } from './photos';

	let { initialIndex }: { initialIndex: number } = $props();

	// No index has a trigger image, so Ramka has nothing to bridge from: the
	// destination blur is the only loading placeholder and belongs on every
	// item.
	const items = interceptedPhotos.map((photo) => ({ ...photo, destinationBlur: true }));

	// Local `open` so a close gesture (Escape, ✕, pull to dismiss) plays the
	// skin's fade BEFORE the history entry goes: popping first would yank the
	// viewer out of the DOM mid-frame. Browser Back does exactly that, with
	// no exit animation, which is unavoidable in this pattern.
	let open = $state(true);
	let index = $state(untrack(() => initialIndex));

	// Swipes REPLACE the current entry with the new photo URL: no history
	// spam, and the grid entry underneath stays, so one Back always closes the
	// viewer. A shallow navigation, so this component stays mounted.
	function handleValueChange(nextIndex: number) {
		void goto(`${EXAMPLE_BASE_PATH}/photos/${interceptedPhotos[nextIndex]!.id}`, {
			shallow: true,
			replace: true
		});
	}

	// Close = leave the photo URL. history.back() (not a push) pops the entry
	// the grid click pushed, so the stack ends the session where it started.
	// Deferred to the end of the fade; the popstate then unmounts this.
	function handleOpenChangeComplete(isOpen: boolean) {
		if (!isOpen) history.back();
	}
</script>

<!-- The Root mounts already open; `count` covers the render before the items
     register, so the counter never reads "n of 0", and the caption fallback
     covers the same window. -->
<Lightbox.Root
	bind:open
	bind:value={index}
	onValueChange={handleValueChange}
	onOpenChangeComplete={handleOpenChangeComplete}
	count={interceptedPhotos.length}
	loop
>
	<LightboxGallery
		{items}
		ariaLabel="Gallery photos"
		backdrop="solid"
		captionFallback={interceptedPhotos[index]?.caption}
	/>
</Lightbox.Root>
