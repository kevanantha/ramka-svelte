<!-- Do / Don’t: one trigger, blur on the trigger (do) or on the destination (don’t). -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import LightboxGallery from '#lib/components/LightboxGallery.svelte';
	import { triggerFocusClass } from '#lib/components/chrome.js';
	import { blurPlaceholder } from '#lib/blur-placeholder.js';
	import Badge from '../Badge.svelte';
	import SlowImage from '../SlowImage.svelte';
	import { a, b, galleryItem } from './photos';

	let { kind }: { kind: 'do' | 'dont' } = $props();

	const demo = $derived(kind === 'do' ? a : b);
	const alt = $derived(
		kind === 'do' ? 'Do — blur on trigger only' : 'Don’t — blur on lightbox image'
	);
</script>

<div class="space-y-3">
	{#if kind === 'do'}<Badge tone="emerald">Do</Badge>{:else}<Badge tone="red">Don’t</Badge>{/if}
	<Lightbox.Root awaitImageDecode={false}>
		<Lightbox.Trigger
			index={0}
			class="block aspect-square w-40 cursor-pointer overflow-hidden rounded-xl bg-transparent p-0 {triggerFocusClass}"
		>
			{#snippet children({ image })}
				<img
					{@attach image}
					src={demo.photo.img.src}
					{alt}
					width={demo.photo.img.w}
					height={demo.photo.img.h}
					class="size-full object-cover"
					style={kind === 'do' ? blurPlaceholder(demo.lqip, demo.photo.img) : undefined}
				/>
			{/snippet}
		</Lightbox.Trigger>

		<LightboxGallery
			items={[galleryItem(demo, alt)]}
			ariaLabel={alt}
			thumbnails="never"
			zoomControls={false}
		>
			{#snippet slide(item)}
				<Lightbox.Zoom>
					<Lightbox.Media
						width={demo.photo.img.w}
						height={demo.photo.img.h}
						class="overflow-hidden rounded-none md:rounded-lg"
					>
						<SlowImage
							src={demo.photo.img.src}
							alt={item.alt}
							width={demo.photo.img.w}
							height={demo.photo.img.h}
							style={kind === 'dont' ? blurPlaceholder(demo.lqip, demo.photo.img) : undefined}
						/>
					</Lightbox.Media>
				</Lightbox.Zoom>
			{/snippet}
		</LightboxGallery>
	</Lightbox.Root>
</div>
