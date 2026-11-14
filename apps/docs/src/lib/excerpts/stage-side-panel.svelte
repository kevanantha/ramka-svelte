<!-- @docs-excerpt-title Stage + side panel -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox'; // @docs-hide
</script>

<!-- @docs-hide-start -->
<Lightbox.Root>
	<Lightbox.Portal>
		<!-- @docs-hide-end -->
		<Lightbox.Content aria-label="Post">
			<Lightbox.Stage class="media-pane">
				<Lightbox.Close aria-label="Close" />
				<Lightbox.Slides><!-- media --></Lightbox.Slides>
				<Lightbox.Previous aria-label="Previous" />
				<Lightbox.Next aria-label="Next" />
			</Lightbox.Stage>
			<aside><!-- thread / details --></aside>
		</Lightbox.Content>
		<!-- @docs-hide-start -->
	</Lightbox.Portal>
</Lightbox.Root>
<!-- @docs-hide-end -->
