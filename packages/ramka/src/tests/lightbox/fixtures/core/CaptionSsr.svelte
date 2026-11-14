<!-- Server-rendered open viewer with captioned items and a Caption fallback. -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';

	let { fallback }: { fallback?: string } = $props();
</script>

<Lightbox.Root open value={1}>
	<Lightbox.Portal container={null}>
		<Lightbox.Content aria-label="Test">
			<SlidesHost count={3}>
				{#snippet children(i)}
					<Lightbox.Item index={i} caption="Caption {i}">Item {i}</Lightbox.Item>
				{/snippet}
			</SlidesHost>
			<Lightbox.Caption>{fallback}</Lightbox.Caption>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
