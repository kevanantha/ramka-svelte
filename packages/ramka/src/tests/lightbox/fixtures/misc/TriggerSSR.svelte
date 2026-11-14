<!--
	lightbox-trigger-ssr.test.tsx's tree: Root > Trigger × triggers
	(`data-testid="trigger-{i}"`, text `T{i}`) > Portal in place > Content.
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import type { LightboxRootProps } from '../../../../lib/lightbox';

	let {
		root = {},
		triggers = 3
	}: { root?: Omit<LightboxRootProps, 'children'>; triggers?: number } = $props();
</script>

<Lightbox.Root {...root}>
	{#each { length: triggers }, i (i)}
		<Lightbox.Trigger index={i} data-testid="trigger-{i}">T{i}</Lightbox.Trigger>
	{/each}
	<Lightbox.Portal container={null}>
		<Lightbox.Content aria-label="viewer">viewer</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
