<!-- Live crossfade cases for the View transitions guide. -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import Play from '@lucide/svelte/icons/play';
	import LightboxGallery from '#lib/components/LightboxGallery.svelte';
	import { triggerFocusClass } from '#lib/components/chrome.js';
	import { codeChip as code } from '#lib/components/demo/demo-classes.js';
	import Separator from '#lib/components/docs/Separator.svelte';
	import { blurStyle, xfade } from '#lib/photos.js';
	import CloseDemoVideo from './CloseDemoVideo.svelte';

	/** Matching 3∶2 sources — element boxes in the demos may still differ. */
	const photos = [xfade.a, xfade.b, xfade.c];

	/**
	 * Album with hidden extras behind a +N tile (only the first two get
	 * triggers). Overflow items have no trigger image, so their destination
	 * image carries the blur-up placeholder.
	 */
	const album = [
		...photos,
		...[xfade.d, xfade.e, xfade.f, xfade.g].map((p) => ({ ...p, destinationBlur: true }))
	];
	const visible = 2;
	const extras = album.length - visible;

	const trailer = {
		title: 'Big Buck Bunny',
		poster: xfade.bbbPoster,
		video: 'https://download.blender.org/peach/trailer/trailer_iphone.m4v',
		width: 480,
		height: 270
	};

	/** Initials chips → portraits (non-image morph source). */
	const team = [
		{ name: 'Ava Chen', initials: 'AC', color: '#2a7ab5', photo: xfade.ava },
		{ name: 'Jules Okonkwo', initials: 'JO', color: '#c93c20', photo: xfade.jules },
		{ name: 'Sam Rivera', initials: 'SR', color: '#7a9a6d', photo: xfade.sam },
		{ name: 'Mei Laurent', initials: 'ML', color: '#7b3f72', photo: xfade.mei }
	];
	// Non-image triggers — the destination image is the only placeholder.
	const portraits = team.map((p) => ({ ...p.photo, destinationBlur: true }));

	let readyToPlay = $state(false);
</script>

<div class="flex flex-col gap-10">
	<div class="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
		<table class="w-full text-left text-sm">
			<thead class="bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
				<tr>
					<th class="px-3 py-2 font-medium">Value</th>
					<th class="px-3 py-2 font-medium">Use when</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-neutral-200 dark:divide-neutral-800">
				<tr>
					<td class="px-3 py-2 font-mono text-xs">undefined</td>
					<td class="px-3 py-2 text-neutral-600 dark:text-neutral-400">
						Same picture, same intrinsic aspect ratio — element boxes may differ
					</td>
				</tr>
				<tr>
					<td class="px-3 py-2 font-mono text-xs">"both"</td>
					<td class="px-3 py-2 text-neutral-600 dark:text-neutral-400">
						Trigger ≠ item both ways — stacks, +N overlays, swatches
					</td>
				</tr>
				<tr>
					<td class="px-3 py-2 font-mono text-xs">"close"</td>
					<td class="px-3 py-2 text-neutral-600 dark:text-neutral-400">
						Open frames match, close doesn't — poster → playing video
					</td>
				</tr>
				<tr>
					<td class="px-3 py-2 font-mono text-xs">"open"</td>
					<td class="px-3 py-2 text-neutral-600 dark:text-neutral-400">Rare inverse of close</td>
				</tr>
			</tbody>
		</table>
	</div>

	<section class="space-y-3">
		<h4 class="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
			Omit — same picture
		</h4>
		<p class="text-sm text-neutral-600 dark:text-neutral-400">
			Same picture and intrinsic aspect ratio; element boxes may differ. Both sides use
			<code class={code}>object-fit: cover</code>. Below: square thumbs → landscape viewer from 3∶2
			sources.
		</p>
		<Lightbox.Root>
			<!-- Square trigger boxes vs landscape gallery items — same 3∶2 sources. -->
			<div class="grid max-w-md grid-cols-3 gap-2">
				{#each photos as img, i (img.src)}
					<Lightbox.Trigger
						index={i}
						class="block aspect-square overflow-hidden rounded-lg bg-transparent p-0 {triggerFocusClass}"
					>
						{#snippet children({ image })}
							<img
								{@attach image}
								src={img.thumb}
								alt={img.alt}
								width={img.width}
								height={img.height}
								style={blurStyle(img)}
								class="block size-full object-cover"
							/>
						{/snippet}
					</Lightbox.Trigger>
				{/each}
			</div>
			<LightboxGallery items={photos} ariaLabel="Same-image morph" />
		</Lightbox.Root>
	</section>

	<Separator />

	<section class="space-y-3">
		<h4 class="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
			<code class={code}>crossfade="both"</code> — +N tile
		</h4>
		<p class="text-sm text-neutral-600 dark:text-neutral-400">
			Open dissolves the overlay/+N tile into a clean photo. Close from a photo without a thumb uses
			<code class={code}>morphTo="closest"</code>.
		</p>
		<!-- Indexes beyond the last trigger close to the nearest one. -->
		<Lightbox.Root morphTo="closest">
			<div class="grid max-w-sm grid-cols-2 gap-0.5">
				{#each album.slice(0, visible) as img, i (img.src)}
					{@const isOverlay = i === visible - 1 && extras > 0}
					<!-- Radius must live on the morph target (not only an outer clip), or the
					     VT can't interpolate it into the destination's rounded-lg. -->
					<Lightbox.Trigger
						index={i}
						crossfade={isOverlay ? 'both' : undefined}
						class="block overflow-hidden bg-transparent p-0 {triggerFocusClass} {i === 0
							? 'rounded-l-xl'
							: 'rounded-r-xl'}"
					>
						{#snippet children({ image })}
							<div class="relative overflow-hidden">
								<img
									{@attach image}
									src={img.thumb}
									alt={img.alt}
									width={img.width}
									height={img.height}
									style={blurStyle(img)}
									class="block aspect-square w-full object-cover"
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
			<LightboxGallery items={album} ariaLabel="Crossfade both demo" />
		</Lightbox.Root>
	</section>

	<Separator />

	<section class="space-y-3">
		<h4 class="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
			<code class={code}>crossfade="both"</code> — any element
		</h4>
		<p class="text-sm text-neutral-600 dark:text-neutral-400">
			Morph sources don't have to be images — dissolve initials chips into portraits so letters
			don't stretch.
		</p>
		<Lightbox.Root>
			<ul class="flex flex-wrap gap-6">
				{#each team as person, i (person.name)}
					<li class="flex w-20 flex-col items-center gap-2">
						<Lightbox.Trigger
							index={i}
							crossfade="both"
							class="size-16 overflow-hidden rounded-full bg-transparent p-0 {triggerFocusClass}"
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
			<LightboxGallery items={portraits} ariaLabel="Team portraits" />
		</Lightbox.Root>
	</section>

	<Separator />

	<section class="space-y-3">
		<h4 class="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
			<code class={code}>crossfade="close"</code> — poster → video
		</h4>
		<p class="text-sm text-neutral-600 dark:text-neutral-400">
			Open hard-cuts into the matching poster frame; close dissolves the live video back to the
			poster.
		</p>
		<Lightbox.Root
			onOpenChange={(open) => {
				if (!open) readyToPlay = false;
			}}
			onOpenChangeComplete={(open) => (readyToPlay = open)}
		>
			<Lightbox.Trigger
				index={0}
				crossfade="close"
				class="group block w-40 bg-transparent p-0 {triggerFocusClass}"
			>
				{#snippet children({ morph })}
					<!-- morph on the rounded node (radius for VT; library hides it during morphs). -->
					<div {@attach morph} class="relative overflow-hidden rounded-xl">
						<img
							src={trailer.poster.thumb}
							alt={trailer.title}
							width={trailer.poster.width}
							height={trailer.poster.height}
							style={blurStyle(trailer.poster)}
							class="block aspect-[2/3] w-full rounded-xl object-cover"
						/>
						<div
							class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-black/20 opacity-0 transition-opacity group-hover:opacity-100"
						>
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-black"
							>
								<Play aria-hidden="true" class="h-4 w-4 fill-current" />
							</div>
						</div>
					</div>
				{/snippet}
			</Lightbox.Trigger>

			<LightboxGallery
				items={[
					{
						...trailer.poster,
						caption: trailer.title,
						width: trailer.width,
						height: trailer.height
					}
				]}
				ariaLabel={trailer.title}
				thumbnails="never"
				zoomControls={false}
			>
				{#snippet slide()}
					<CloseDemoVideo
						src={trailer.video}
						poster={trailer.poster.src}
						ready={readyToPlay}
						width={trailer.width}
						height={trailer.height}
					/>
				{/snippet}
			</LightboxGallery>
		</Lightbox.Root>
	</section>
</div>
