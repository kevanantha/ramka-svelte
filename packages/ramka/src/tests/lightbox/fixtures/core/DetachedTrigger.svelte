<!-- A Trigger outside the Root, linked to it through `handle`. -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import type { LightboxHandle } from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';

	let {
		handle,
		triggerId,
		triggerIndex,
		triggerTestId,
		triggerLabel,
		itemCount = 1
	}: {
		handle: LightboxHandle;
		triggerId: string;
		triggerIndex: number;
		triggerTestId: string;
		triggerLabel: string;
		itemCount?: number;
	} = $props();
</script>

<Lightbox.Trigger {handle} id={triggerId} index={triggerIndex} data-testid={triggerTestId}>
	{triggerLabel}
</Lightbox.Trigger>
<Lightbox.Root {handle}>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Test">
			<SlidesHost count={itemCount}>
				{#snippet children(i)}
					<Lightbox.Item index={i} data-testid="item-{i}">Item {i}</Lightbox.Item>
				{/snippet}
			</SlidesHost>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
