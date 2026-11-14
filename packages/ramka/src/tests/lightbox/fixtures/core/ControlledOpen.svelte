<!-- TestLightbox with `open` owned by this parent and external open/close buttons. -->
<script lang="ts">
	import TestLightbox from '../TestLightbox.svelte';

	let isOpen = $state(false);
</script>

<button data-testid="ext-open" onclick={() => (isOpen = true)}>Open</button>
<button data-testid="ext-close" onclick={() => (isOpen = false)}>Close</button>
<TestLightbox open={isOpen} onOpenChange={(next) => (isOpen = next)} />
