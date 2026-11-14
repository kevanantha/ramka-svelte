<!--
  One film: its own Root with a single-item gallery whose slide is the video.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import Play from '@lucide/svelte/icons/play';
	import LightboxGallery from '#lib/components/LightboxGallery.svelte';
	import { triggerFocusClass } from '#lib/components/chrome.js';
	import type { Film } from './films';

	let { film }: { film: Film } = $props();

	/** True only after the open transition completes: no playback during the morph. */
	let readyToPlay = $state(false);

	// Autoplay once open settles. While closed / mid-open / closing, stay paused
	// at 0 so the poster frame stays stable for the morph.
	function playback(video: HTMLVideoElement) {
		if (readyToPlay) {
			video.play().catch(() => {});
		} else {
			video.pause();
			video.currentTime = 0;
		}
	}
</script>

<Lightbox.Root
	onOpenChange={(open) => {
		if (!open) readyToPlay = false;
	}}
	onOpenChangeComplete={(open) => {
		readyToPlay = open;
	}}
>
	<!-- Hard-cut open (poster → video poster), dissolve on close (live frame → trigger). -->
	<Lightbox.Trigger
		index={0}
		crossfade="close"
		class="group block w-full cursor-pointer rounded-xl border-none bg-transparent p-0 text-left {triggerFocusClass}"
	>
		{#snippet children({ morph })}
			<!-- The morph is on the wrapper so poster + play affordance morph together. -->
			<div {@attach morph} class="relative overflow-hidden rounded-xl">
				<img
					src={film.poster}
					alt={film.title}
					width={film.posterWidth}
					height={film.posterHeight}
					loading="lazy"
					decoding="async"
					class="block aspect-[2/3] w-full rounded-xl object-cover"
				/>
				<div
					class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-black/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
				>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-black"
					>
						<Play aria-hidden="true" class="h-5 w-5 fill-current" />
					</div>
				</div>
			</div>
			<div class="px-0.5 pt-2.5">
				<div class="text-sm leading-snug font-medium">{film.title}</div>
				<div class="text-xs text-neutral-500 dark:text-neutral-400">
					{film.year} · {film.genre}
				</div>
			</div>
		{/snippet}
	</Lightbox.Trigger>

	<LightboxGallery
		items={[
			{
				src: film.poster,
				thumb: film.poster,
				alt: film.title,
				caption: film.title,
				width: film.videoWidth,
				height: film.videoHeight
			}
		]}
		ariaLabel={film.title}
		thumbnails="never"
		zoomControls={false}
	>
		{#snippet slide()}
			<Lightbox.Zoom>
				<!-- Media morphs and bridges the poster; the video fills the sized host. -->
				<Lightbox.Media
					width={film.videoWidth}
					height={film.videoHeight}
					class="overflow-hidden rounded-xl"
				>
					<video
						src={film.video}
						poster={film.poster}
						width={film.videoWidth}
						height={film.videoHeight}
						controls
						playsinline
						muted
						preload="metadata"
						class="object-cover"
						{@attach playback}
					></video>
				</Lightbox.Media>
			</Lightbox.Zoom>
		{/snippet}
	</LightboxGallery>
</Lightbox.Root>
