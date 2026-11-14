<!-- One item whose caption is the `text` prop. -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';

	let { text }: { text: string } = $props();
</script>

<Lightbox.Root open value={0}>
	<Lightbox.Portal>
		<Lightbox.Content aria-label="Reactive caption test">
			<SlidesHost>
				{#snippet children(i)}
					<Lightbox.Item index={i} caption={text}>Item 0</Lightbox.Item>
				{/snippet}
			</SlidesHost>
			<Lightbox.Caption data-testid="reactive-caption" />
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
