<!-- @docs-excerpt-title Lifecycle callbacks -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
</script>

<Lightbox.Root
	onOpenChange={(open) => {
		// Fires immediately — sync URL / store here.
		void open;
	}}
	onOpenChangeComplete={(open) => {
		// Fires after enter/exit motion settles — cleanup / focus here.
		void open;
	}}
	onValueChange={(value, { source }) => {
		void value;
		void source; // 'trigger' | 'keyboard' | 'thumbnail' | 'button' | 'scroll' | 'imperative'
	}}
>
	<!-- … -->
</Lightbox.Root>
