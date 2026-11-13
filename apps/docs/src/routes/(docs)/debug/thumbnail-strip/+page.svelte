<!--
  ThumbnailStrip recipes: the same unstyled primitive under six consumer
  skins. Port of the original docs' app/(docs)/debug/thumbnail-strip.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import DemoShell from './DemoShell.svelte';
	import AspectFrameStrip from './AspectFrameStrip.svelte';
	import { stripPhotos as photos } from './photos';
	import './strips.css';

	const TILTS = [-3.5, 2.2, -1.4, 3.1, -2.6, 1.8, -2.8, 2.5, -1.1, 3.4, -3.2, 1.6];
</script>

<svelte:head>
	<title>ThumbnailStrip recipes — ramka-svelte</title>
</svelte:head>

{#snippet bareStrip()}
	<Lightbox.ThumbnailStrip class="ts-debug-strip ts-debug-bare">
		<Lightbox.ThumbnailStripTrack aria-label="Thumbnails">
			{#each photos as photo, i (photo.id)}
				<Lightbox.Thumbnail index={i}>
					<img src={photo.thumb} alt="" draggable="false" />
				</Lightbox.Thumbnail>
			{/each}
		</Lightbox.ThumbnailStripTrack>
	</Lightbox.ThumbnailStrip>
{/snippet}

{#snippet circlesStrip()}
	<Lightbox.ThumbnailStrip class="ts-debug-strip ts-debug-circles">
		<Lightbox.ThumbnailStripTrack aria-label="Thumbnails">
			{#each photos as photo, i (photo.id)}
				<Lightbox.Thumbnail index={i}>
					<img src={photo.thumb} alt="" draggable="false" />
				</Lightbox.Thumbnail>
			{/each}
		</Lightbox.ThumbnailStripTrack>
		<span class="ts-debug-indicator" aria-hidden="true"></span>
	</Lightbox.ThumbnailStrip>
{/snippet}

{#snippet chipsStrip()}
	<Lightbox.ThumbnailStrip class="ts-debug-strip ts-debug-chips">
		<Lightbox.ThumbnailStripTrack aria-label="Slide index">
			{#each photos as photo, i (photo.id)}
				<Lightbox.Thumbnail index={i}>{String(i + 1).padStart(2, '0')}</Lightbox.Thumbnail>
			{/each}
		</Lightbox.ThumbnailStripTrack>
		<span class="ts-debug-indicator" aria-hidden="true"></span>
	</Lightbox.ThumbnailStrip>
{/snippet}

{#snippet polaroidStrip()}
	<Lightbox.ThumbnailStrip class="ts-debug-strip ts-debug-polaroid">
		<Lightbox.ThumbnailStripTrack aria-label="Thumbnails">
			{#each photos as photo, i (photo.id)}
				<Lightbox.Thumbnail index={i} style="--ts-tilt: {TILTS[i % TILTS.length]}deg">
					<img src={photo.thumb} alt="" draggable="false" />
					<span class="ts-debug-polaroid-caption">{photo.caption}</span>
				</Lightbox.Thumbnail>
			{/each}
		</Lightbox.ThumbnailStripTrack>
		<span class="ts-debug-indicator" aria-hidden="true">
			<span class="ts-debug-polaroid-tape"></span>
		</span>
	</Lightbox.ThumbnailStrip>
{/snippet}

{#snippet fadeStrip()}
	<Lightbox.ThumbnailStrip class="ts-debug-strip ts-debug-fade">
		<Lightbox.ThumbnailStripTrack aria-label="Thumbnails">
			{#each photos as photo, i (photo.id)}
				<Lightbox.Thumbnail index={i} style="--ts-aspect: {photo.aspect}">
					<img src={photo.thumb} alt="" draggable="false" />
				</Lightbox.Thumbnail>
			{/each}
		</Lightbox.ThumbnailStripTrack>
		<span class="ts-debug-indicator" aria-hidden="true"></span>
	</Lightbox.ThumbnailStrip>
{/snippet}

{#snippet aspectFrameStrip()}
	<AspectFrameStrip {photos} />
{/snippet}

<div class="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
	<header>
		<p
			class="text-[11px] font-semibold tracking-widest text-amber-700 uppercase dark:text-amber-400"
		>
			Debug · development only
		</p>
		<h1 class="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
			ThumbnailStrip recipes
		</h1>
		<p class="mt-3 max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
			Same unstyled primitive, different consumer CSS. Open any grid — the strip stays scroll-linked
			and midline-centered; only the skin changes.
		</p>
	</header>

	<DemoShell
		title="1 · Bare"
		description="Squares, gap, active opacity. No indicator — the smallest useful strip."
		contentClassName="ts-debug-content-bare"
		strip={bareStrip}
	/>

	<DemoShell
		title="2 · Circles"
		description="Round thumbs with a stationary hairline ring on the midline."
		contentClassName="ts-debug-content-circles"
		strip={circlesStrip}
	/>

	<DemoShell
		title="3 · Index chips"
		description="No images in the strip — monospace indices, fill on the active chip."
		contentClassName="ts-debug-content-chips"
		strip={chipsStrip}
	/>

	<DemoShell
		title="4 · Polaroids"
		description="Real Polaroid proportions (square image + caption band) with handwritten labels — selection is washi tape."
		contentClassName="ts-debug-content-polaroid"
		captionClassName="ts-debug-polaroid-viewer-caption"
		strip={polaroidStrip}
	/>

	<DemoShell
		title="5 · Edge fade"
		description="Per-thumb aspect widths, soft side mask, and a simple fixed frame."
		contentClassName="ts-debug-content-fade"
		strip={fadeStrip}
	/>

	<DemoShell
		title="6 · Aspect frame"
		description="Hardcoded per-thumb aspects with a nine-slice midline frame that morphs width on swipe / select."
		contentClassName="ts-debug-content-aspect-frame"
		strip={aspectFrameStrip}
	/>
</div>
