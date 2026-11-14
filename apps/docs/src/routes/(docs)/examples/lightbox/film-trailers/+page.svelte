<!--
  Movie posters that morph into fullscreen videos.
  Port of the original docs' app/(docs)/examples/lightbox/film-trailers.
-->
<script lang="ts">
	import ExampleShell from '#lib/components/ExampleShell.svelte';
	import FilmLightbox from './FilmLightbox.svelte';
	import { films } from './films';

	const code = 'rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800';
</script>

<ExampleShell title="Film trailers">
	{#snippet description()}
		Each poster is its own <code class={code}>Lightbox.Root</code> with a single-item gallery and a
		<code class={code}>slide</code> snippet for the video.
		<code class={code}>crossfade="close"</code>
		hard-cuts the open morph into the video and dissolves the live frame back into the poster on close.
		Video autoplays (muted) only after
		<code class={code}>onOpenChangeComplete</code>.
	{/snippet}

	<div class="max-w-3xl">
		<div class="py-5">
			<div
				class="text-xs font-medium tracking-[0.08em] text-neutral-500 uppercase dark:text-neutral-400"
			>
				Now Streaming
			</div>
			<h2 class="mt-1 text-2xl font-semibold tracking-tight">Blender Open Movies</h2>
			<p class="mt-2 max-w-md text-sm text-neutral-500 dark:text-neutral-400">
				Four Creative Commons shorts from the Blender Foundation. Click any poster to watch
				fullscreen.
			</p>
		</div>

		<!-- Each film is its own Lightbox.Root, so opening one is a single poster → video morph. -->
		<div class="grid grid-cols-2 gap-5 sm:grid-cols-3">
			{#each films as film (film.id)}
				<FilmLightbox {film} />
			{/each}
		</div>
	</div>
</ExampleShell>
