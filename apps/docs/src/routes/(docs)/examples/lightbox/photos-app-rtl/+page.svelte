<!--
  The photos app mirrored for a right-to-left locale. Same composition, two
  changes: dir="rtl" on Lightbox.Root (mirrors navigation, the thumbnails and
  the arrow keys) and dir="rtl" on <html> (mirrors the layout). Both are
  needed: the prop drives behaviour, CSS drives paint, and the library warns
  in development when they disagree.
-->
<script lang="ts">
	import PhotosAppView from '../photos-app/PhotosAppView.svelte';
</script>

<svelte:head>
	<title>Photos app example (RTL) — ramka-svelte</title>
	<meta
		name="description"
		content="The photos app example mirrored for a right-to-left locale: dir=&quot;rtl&quot; on Lightbox.Root mirrors navigation, the thumbnail strip, and the arrow keys."
	/>
</svelte:head>

<PhotosAppView dir="rtl" />
