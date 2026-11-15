<script lang="ts">
	import PageMeta from '#lib/components/docs/PageMeta.svelte';
	import PhotosAppView from './PhotosAppView.svelte';
</script>

<PageMeta
	title="Photos app example"
	description="A macOS Photos-style Svelte image gallery: a square grid under a sticky blurred toolbar that opens into a morphing lightbox, built with ramka-svelte."
/>

<PhotosAppView />
