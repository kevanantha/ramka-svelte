<!--
  The hard-load presentation. A reload, bookmark or shared link of
  …/photos/5 is a real navigation, not the grid's shallow one, so it renders
  THIS standalone page (Instagram's dedicated photo page is the same move):
  one URL, two presentations. If a reload should keep the grid + open viewer
  instead, that's the URL-synced state example.
-->
<script lang="ts">
	import { blurPlaceholderStyle, clearBlurPlaceholder } from '#lib/blur-placeholder.js';
	import { EXAMPLE_BASE_PATH, interceptedPhotoTitle } from '../../photos';

	let { data } = $props();
	const photo = $derived(data.photo);
</script>

<svelte:head>
	<title>{interceptedPhotoTitle(photo)} — ramka-svelte</title>
	<meta
		name="description"
		content="{photo.alt} — the standalone hard-load presentation of an intercepted photo route."
	/>
</svelte:head>

<div class="mx-auto w-full max-w-4xl px-6 py-14 md:px-10 md:py-16">
	<a
		href={EXAMPLE_BASE_PATH}
		class="mb-8 inline-block text-[13px] text-neutral-500 underline underline-offset-4 hover:text-neutral-800 dark:hover:text-neutral-200"
	>
		← Back to the gallery
	</a>
	<figure>
		<img
			{@attach clearBlurPlaceholder}
			src={photo.src}
			alt={photo.alt}
			width={photo.width}
			height={photo.height}
			fetchpriority="high"
			style={blurPlaceholderStyle(photo)}
			class="block h-auto w-full rounded-2xl bg-neutral-100 dark:bg-neutral-800"
		/>
		<figcaption class="mt-4 text-[15px] text-neutral-600 dark:text-neutral-300">
			{photo.caption}
		</figcaption>
	</figure>
	<p class="mt-8 max-w-2xl text-[13px] leading-6 text-neutral-500">
		You hard-loaded this photo URL, so route interception did not apply and you got this standalone
		page instead of the lightbox over the grid — one URL, two presentations. Navigate back to the
		gallery and click the same photo to see the intercepted modal presentation.
	</p>
</div>
