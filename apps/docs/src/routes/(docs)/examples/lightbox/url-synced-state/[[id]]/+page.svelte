<script lang="ts">
	import { page } from '$app/state';
	import UrlSyncedStateDemo from '../UrlSyncedStateDemo.svelte';
	import { galleryPhotos } from '../photos';

	// Per-photo metadata for the URL the page loaded with (the demo owns the
	// live title).
	const photo = $derived(galleryPhotos.find((p) => p.id === page.params.id));
</script>

<svelte:head>
	<meta
		name="description"
		content={photo
			? `${photo.alt} — a deep link straight into the lightbox, driven by a SvelteKit optional route param and ramka-svelte's bindable open / value props.`
			: 'A masonry lightbox wired to SvelteKit routing: every photo is a shareable URL — deep links open the viewer, swipes rewrite the URL, browser Back closes it. Built with ramka-svelte.'}
	/>
</svelte:head>

<UrlSyncedStateDemo />
