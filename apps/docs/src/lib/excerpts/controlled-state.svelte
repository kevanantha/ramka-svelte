<!-- @docs-excerpt-title Controlled open + value -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';

	let open = $state(false);
	let value = $state(0);
</script>

<Lightbox.Root bind:open bind:value>
	<!-- triggers + content -->
</Lightbox.Root>
