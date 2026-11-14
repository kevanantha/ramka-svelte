<!-- Source aspect Do / Don’t: the same 3∶2 file vs a baked 1∶1 crop on the trigger. -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import LightboxGallery from '#lib/components/LightboxGallery.svelte';
	import { triggerFocusClass } from '#lib/components/chrome.js';
	import { blurStyle, xfade } from '#lib/photos.js';
	import Badge from '../Badge.svelte';
	import SlowImage from '../SlowImage.svelte';

	let { kind }: { kind: 'do' | 'dont' } = $props();

	const trigger = $derived(kind === 'do' ? xfade.a : xfade.aSquare);
	const alt = $derived(kind === 'do' ? 'Do — same source aspect' : 'Don’t — baked square crop');
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
					src={trigger.src}
					{alt}
					width={trigger.width}
					height={trigger.height}
					style={blurStyle(trigger)}
					class="size-full object-cover"
				/>
			{/snippet}
		</Lightbox.Trigger>

		<LightboxGallery
			items={[{ ...xfade.a, thumb: trigger.src, alt }]}
			ariaLabel={alt}
			thumbnails="never"
			zoomControls={false}
		>
			{#snippet slide(item)}
				<Lightbox.Zoom>
					<Lightbox.Media
						width={xfade.a.width}
						height={xfade.a.height}
						class="overflow-hidden rounded-none md:rounded-lg"
					>
						<SlowImage
							src={xfade.a.src}
							alt={item.alt}
							width={xfade.a.width}
							height={xfade.a.height}
						/>
					</Lightbox.Media>
				</Lightbox.Zoom>
			{/snippet}
		</LightboxGallery>
	</Lightbox.Root>
</div>
