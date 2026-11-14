<!-- Content = Stage (slides) + a focusable sidebar outside the Stage. -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';

	let {
		itemCount = 3,
		onOpenChange
	}: { itemCount?: number; onOpenChange?: (open: boolean) => void } = $props();
</script>

<Lightbox.Root open value={0} {onOpenChange}>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Stage test">
			<Lightbox.Stage data-testid="stage">
				<SlidesHost preload={1} count={itemCount}>
					{#snippet children(i)}
						<Lightbox.Item index={i} data-testid="item-{i}">Item {i}</Lightbox.Item>
					{/snippet}
				</SlidesHost>
			</Lightbox.Stage>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<aside data-testid="sidebar" tabindex="0">Thread</aside>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
