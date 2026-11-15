<!--
  The grid is plain links, NOT Lightbox.Triggers. A click is a shallow
  navigation to the photo URL (`goto(href, { shallow: true })`), and while
  the current history entry's shallow target is the photos/[id] route, an
  already-open lightbox (PhotoModal) mounts over the grid. That's the
  SvelteKit form of Next.js's intercepted + parallel routes, and the same
  tradeoff versus the URL-synced state example: the open never flows through
  the library's gesture path, so there is no trigger morph (the viewer fades
  in), and a reload on a photo URL renders the standalone page
  (photos/[id]) rather than this grid with the viewer open.

  A shallow navigation never scrolls, so the grid keeps its position while
  the modal is up.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ExampleShell from '#lib/components/ExampleShell.svelte';
	import { blurPlaceholderStyle, clearBlurPlaceholder } from '#lib/blur-placeholder.js';
	import PhotoModal from './PhotoModal.svelte';
	import {
		EXAMPLE_BASE_PATH,
		EXAMPLE_PAGE_TITLE,
		interceptedPhotos,
		interceptedPhotoTitle
	} from './photos';

	const PHOTO_ROUTE = '/(docs)/examples/lightbox/intercepted-routes/photos/[id]';

	// The "intercepted" photo: the shallow target, while it is a photo route.
	// Back to the grid entry clears `page.shallow`, which unmounts the modal.
	const modalIndex = $derived(
		page.shallow?.route?.id === PHOTO_ROUTE
			? interceptedPhotos.findIndex((photo) => photo.id === page.shallow?.params?.id)
			: -1
	);

	const title = $derived(
		`${modalIndex === -1 ? EXAMPLE_PAGE_TITLE : interceptedPhotoTitle(interceptedPhotos[modalIndex]!)} — ramka-svelte`
	);

	const description =
		'A photo grid wired to SvelteKit shallow routing: clicking a tile shallow-navigates to the photo URL and the lightbox opens over the grid; loading that URL cold renders a standalone photo page instead. Built with ramka-svelte.';
	// Share cards describe the grid, whatever photo the live title follows.
	const cardTitle = `${EXAMPLE_PAGE_TITLE} — ramka-svelte`;

	function intercept(event: MouseEvent & { currentTarget: HTMLAnchorElement }) {
		// Let the browser have modified clicks (new tab, download, …).
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return;
		}
		event.preventDefault();
		void goto(event.currentTarget.href, { shallow: true });
	}
</script>

<svelte:head>
	<!-- Swipes replace the photo URL, and the title follows it. -->
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={cardTitle} />
	<meta property="og:description" content={description} />
	<meta name="twitter:title" content={cardTitle} />
	<meta name="twitter:description" content={description} />
</svelte:head>

<ExampleShell
	title="Intercepted routes"
	docsHref="/docs/lightbox/state-lifecycle"
	docsLabel="State & lifecycle docs"
>
	{#snippet description()}
		The nextgram pattern, SvelteKit style: a grid of plain links whose clicks shallow-navigate to
		/photos/[id] (goto with shallow: true), and a modal that mounts an already-open, controlled
		lightbox over the grid while that shallow entry is current — browser Back closes it.
		Hard-loading the same photo URL skips the modal entirely and renders a standalone photo page:
		one URL, two presentations. Compare with the URL-synced state example, which keeps one
		presentation (grid + viewer) on refresh and keeps trigger morphs.
	{/snippet}

	<div class="grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
		{#each interceptedPhotos as photo (photo.id)}
			<a
				href="{EXAMPLE_BASE_PATH}/photos/{photo.id}"
				onclick={intercept}
				class="block overflow-hidden rounded-xl"
			>
				<img
					{@attach clearBlurPlaceholder}
					src={photo.src}
					alt={photo.alt}
					width={photo.width}
					height={photo.height}
					loading="lazy"
					decoding="async"
					style={blurPlaceholderStyle(photo)}
					class="block aspect-square h-auto w-full rounded-xl bg-neutral-100 object-cover transition duration-200 hover:opacity-90 dark:bg-neutral-800"
				/>
			</a>
		{/each}
	</div>
</ExampleShell>

{#if modalIndex !== -1}
	<PhotoModal initialIndex={modalIndex} />
{/if}
