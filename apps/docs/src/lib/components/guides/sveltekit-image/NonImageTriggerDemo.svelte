<!-- Non-image triggers: no Ramka thumb bridge — destination blur is the placeholder. -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import LightboxGallery from '#lib/components/LightboxGallery.svelte';
	import { triggerFocusClass } from '#lib/components/chrome.js';
	import Badge from '../Badge.svelte';
	import SlowImage from '../SlowImage.svelte';
	import { blurPlaceholder } from '#lib/blur-placeholder.js';
	import { a, b, galleryItem } from './photos';

	const team = [
		{ name: 'Ava Chen', initials: 'AC', color: '#2a7ab5', demo: a },
		{ name: 'Jules Okonkwo', initials: 'JO', color: '#c93c20', demo: b }
	];
</script>

<div class="space-y-3">
	<Badge tone="violet">Non-image trigger</Badge>
	<Lightbox.Root>
		<ul class="flex flex-wrap gap-6">
			{#each team as person, i (person.name)}
				<li class="flex w-20 flex-col items-center gap-2">
					<Lightbox.Trigger
						index={i}
						crossfade="both"
						class="size-16 cursor-pointer overflow-hidden rounded-full bg-transparent p-0 {triggerFocusClass}"
					>
						<div
							class="flex size-full items-center justify-center text-sm font-semibold tracking-wide text-white"
							style:background={person.color}
						>
							{person.initials}
						</div>
					</Lightbox.Trigger>
					<span class="text-center text-xs font-medium text-neutral-700 dark:text-neutral-300">
						{person.name}
					</span>
				</li>
			{/each}
		</ul>

		<LightboxGallery
			items={team.map((p) => galleryItem(p.demo, `Portrait of ${p.name}`, p.name))}
			ariaLabel="Non-image trigger SvelteKit image demo"
			zoomControls={false}
		>
			{#snippet slide(item, index)}
				{@const demo = team[index]!.demo}
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
							style={blurPlaceholder(demo.lqip, demo.photo.img)}
							priority={false}
						/>
					</Lightbox.Media>
				</Lightbox.Zoom>
			{/snippet}
		</LightboxGallery>
	</Lightbox.Root>
</div>
