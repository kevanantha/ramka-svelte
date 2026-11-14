<!-- @docs-excerpt-title Imperative API under RTL -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';

	const lightbox = Lightbox.createHandle();
</script>

<!-- Opens the first item, at the inline-start (right) edge of the track. -->
<button type="button" onclick={() => lightbox.open(0)}>פתיחת הגלריה</button>
<!-- Jumps to the 4th item regardless of reading direction. -->
<button type="button" onclick={() => lightbox.goTo(3)}>מעבר לתמונה 4</button>

<Lightbox.Root handle={lightbox} dir="rtl">
	<!-- … Portal / Content / Slides … -->
</Lightbox.Root>
