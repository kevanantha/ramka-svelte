<!--
  The photos app mirrored for a right-to-left locale. Same composition, two
  changes: dir="rtl" on Lightbox.Root (mirrors navigation, the thumbnails and
  the arrow keys) and dir="rtl" on <html> (mirrors the layout). Both are
  needed: the prop drives behaviour, CSS drives paint, and the library warns
  in development when they disagree.
-->
<script lang="ts">
	import PageMeta from '#lib/components/docs/PageMeta.svelte';
	import PhotosAppView from '../photos-app/PhotosAppView.svelte';
</script>

<PageMeta
	title="Photos app example (RTL)"
	description={'The photos app example mirrored for a right-to-left locale: dir="rtl" on Lightbox.Root mirrors navigation, the thumbnail strip, and the arrow keys.'}
/>

<PhotosAppView dir="rtl" />
