<!-- @docs-excerpt-title scrollTriggerIntoView -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
</script>

<Lightbox.Root
	scrollTriggerIntoView={[
		{ type: 'onChange', behavior: 'instant' },
		{ type: 'onOpenComplete', behavior: 'instant' }
	]}
>
	<!-- triggers + content -->
</Lightbox.Root>
