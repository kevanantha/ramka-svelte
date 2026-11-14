<!-- Server-rendered open viewer (12 items) with Counter and Next, and Root `count`. -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';

	let { count }: { count?: number } = $props();
</script>

<Lightbox.Root open value={5} {count}>
	<Lightbox.Portal container={null}>
		<Lightbox.Content aria-label="Test">
			<SlidesHost count={12}>
				{#snippet children(i)}
					<Lightbox.Item index={i}>Item {i}</Lightbox.Item>
				{/snippet}
			</SlidesHost>
			<Lightbox.Counter data-testid="ssr-counter" />
			<Lightbox.Next data-testid="ssr-next">Next</Lightbox.Next>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
