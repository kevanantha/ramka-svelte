<!-- +N grid: indexes 0–1 have trigger images (no destination blur); 2+ use the LQIP. -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import LightboxGallery from '#lib/components/LightboxGallery.svelte';
	import { triggerFocusClass } from '#lib/components/chrome.js';
	import { blurPlaceholder } from '#lib/blur-placeholder.js';
	import Badge from '../Badge.svelte';
	import SlowImage from '../SlowImage.svelte';
	import { a, b, c, d, galleryItem } from './photos';

	const album = [
		{ demo: a, alt: 'Mountain ridge' },
		{ demo: b, alt: 'Sunlit valley' },
		{ demo: c, alt: 'Green hills' },
		{ demo: d, alt: 'Forest path' }
	];
	const visible = 2;
	const extras = album.length - visible;
</script>

<div class="space-y-3">
	<Badge tone="sky">+N extras</Badge>
	<Lightbox.Root morphTo="closest" awaitImageDecode={false}>
		<div class="grid max-w-sm grid-cols-2 gap-0.5">
			{#each album.slice(0, visible) as { demo, alt }, i (alt)}
				{@const isOverlay = i === visible - 1 && extras > 0}
				<Lightbox.Trigger
					index={i}
					crossfade={isOverlay ? 'both' : undefined}
					class="block cursor-pointer overflow-hidden bg-transparent p-0 {triggerFocusClass} {i ===
					0
						? 'rounded-l-xl'
						: 'rounded-r-xl'}"
				>
					{#snippet children({ image })}
						<div class="relative">
							<img
								{@attach image}
								src={demo.photo.img.src}
								{alt}
								width={demo.photo.img.w}
								height={demo.photo.img.h}
								style={blurPlaceholder(demo.lqip, demo.photo.img)}
								class="aspect-square size-full object-cover"
							/>
							{#if isOverlay}
								<div
									class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50"
								>
									<span class="text-2xl font-bold text-white">+{extras}</span>
								</div>
							{/if}
						</div>
					{/snippet}
				</Lightbox.Trigger>
			{/each}
		</div>

		<LightboxGallery
			items={album.map(({ demo, alt }) => galleryItem(demo, alt))}
			ariaLabel="Plus-N SvelteKit image demo"
			zoomControls={false}
		>
			{#snippet slide(item, index)}
				{@const demo = album[index]!.demo}
				<!-- Only overflow indexes lack a trigger image. -->
				{@const destinationBlur = index >= visible}
				<Lightbox.Zoom>
					<Lightbox.Media
						width={demo.photo.img.w}
						height={demo.photo.img.h}
						class="overflow-hidden rounded-none md:rounded-lg"
					>
						<!-- Eager only for overflow slides (the ones that show the LQIP). -->
						<SlowImage
							src={demo.photo.img.src}
							alt={item.alt}
							width={demo.photo.img.w}
							height={demo.photo.img.h}
							style={destinationBlur ? blurPlaceholder(demo.lqip, demo.photo.img) : undefined}
							priority={destinationBlur}
						/>
					</Lightbox.Media>
				</Lightbox.Zoom>
			{/snippet}
		</LightboxGallery>
	</Lightbox.Root>
</div>
