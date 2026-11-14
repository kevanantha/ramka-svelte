<!-- Two triggers for index 0 (testids trigger-a / trigger-b) and one item. -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import type { LightboxHandle, NavigationSource } from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';

	let {
		handle,
		onValueChange,
		ids = []
	}: {
		handle?: LightboxHandle;
		onValueChange?: (value: number, metadata: { source: NavigationSource }) => void;
		ids?: string[];
	} = $props();
</script>

<Lightbox.Root {handle} {onValueChange}>
	<Lightbox.Trigger index={0} id={ids[0]} data-testid="trigger-a">A</Lightbox.Trigger>
	<Lightbox.Trigger index={0} id={ids[1]} data-testid="trigger-b">B</Lightbox.Trigger>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Test">
			<SlidesHost>
				{#snippet children(i)}
					<Lightbox.Item index={i} data-testid="item-0">Item 0</Lightbox.Item>
				{/snippet}
			</SlidesHost>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
