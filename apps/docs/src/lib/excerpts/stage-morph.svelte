<!-- @docs-excerpt-title Stage morph -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox'; // @docs-hide
</script>

<!-- @docs-hide-start -->
<Lightbox.Root>
	<Lightbox.Portal>
		<Lightbox.Content>
			<!-- @docs-hide-end -->
			<Lightbox.Stage>
				{#snippet children({ morph })}
					<div {@attach morph} class="frame">
						<Lightbox.Slides><!-- media --></Lightbox.Slides>
					</div>
				{/snippet}
			</Lightbox.Stage>
			<!-- @docs-hide-start -->
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
<!-- @docs-hide-end -->
