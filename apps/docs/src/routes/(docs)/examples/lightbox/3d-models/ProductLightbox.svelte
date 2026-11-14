<!--
  One model: its own Root (no shared gallery), so open/close is a single
  tile → fullscreen morph, same pattern as film-trailers.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import LightboxGallery from '#lib/components/LightboxGallery.svelte';
	import { triggerFocusClass } from '#lib/components/chrome.js';
	import { FRAME_SIZE, type Product } from './products';
	import { threeCanvas, waitForLightboxPainted } from './three-canvas.svelte';

	let { product }: { product: Product } = $props();

	/** Orbit input — only after open settles so it doesn't fight the morph. */
	let orbitReady = $state(false);
	let open = $state(false);
</script>

<Lightbox.Root
	awaitImageDecode={false}
	onOpenChange={(nextOpen) => {
		open = nextOpen;
		if (!nextOpen) orbitReady = false;
	}}
	onBeforeOpen={async ({ signal }) => {
		// Prepare already mounted the lightbox (hidden). Keep the trigger
		// spinning; wait until the lightbox has synced + painted, then morph
		// while motion stays live (same feel as close).
		await waitForLightboxPainted(product.id, { signal, timeoutMs: 2500 });
	}}
	onOpenChangeComplete={(nextOpen) => {
		orbitReady = nextOpen;
	}}
>
	<Lightbox.Trigger
		index={0}
		class="group block w-full cursor-pointer rounded-xl border-none bg-transparent p-0 text-center {triggerFocusClass}"
		crossfade="both"
	>
		{#snippet children({ morph })}
			<div
				{@attach morph}
				class="relative aspect-square w-full overflow-hidden rounded-xl bg-transparent"
			>
				<!-- Grid tiles are view-only; the spin pauses while this lightbox is open. -->
				<div
					class="pointer-events-none absolute inset-0 size-full"
					{@attach threeCanvas(product, {
						role: 'trigger',
						interactive: () => false,
						autoRotate: () => !open
					})}
				></div>
			</div>
			<div class="px-0.5 pt-2.5 text-center">
				<div class="text-sm leading-snug font-medium">{product.name}</div>
				<div class="text-xs text-neutral-500 dark:text-neutral-400">{product.material}</div>
			</div>
		{/snippet}
	</Lightbox.Trigger>

	<LightboxGallery
		items={[
			{
				src: product.src,
				thumb: product.src,
				alt: product.name,
				caption: `${product.name} · ${product.material}`,
				width: FRAME_SIZE,
				height: FRAME_SIZE
			}
		]}
		ariaLabel={product.name}
		preload={0}
		thumbnails="never"
		zoomControls={false}
	>
		{#snippet slide()}
			<div class="flex size-full items-center justify-center">
				<Lightbox.Media
					width={FRAME_SIZE}
					height={FRAME_SIZE}
					class="overflow-hidden rounded-xl bg-transparent"
				>
					<!-- Spins from reveal, so the post-morph canvas is already moving. -->
					<div
						class="relative size-full min-h-0"
						{@attach threeCanvas(product, {
							role: 'lightbox',
							interactive: () => orbitReady,
							autoRotate: () => open
						})}
					></div>
				</Lightbox.Media>
			</div>
		{/snippet}
	</LightboxGallery>
</Lightbox.Root>
