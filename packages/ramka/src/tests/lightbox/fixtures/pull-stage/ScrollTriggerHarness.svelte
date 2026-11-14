<!--
	The `Harness` of the scrollTriggerIntoView cases: `triggers` triggers
	("T{i}"), `items` items ("Item {i}") in a preload-1 SlidesHost, and a Next
	button unless `next={false}`.
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import type { LightboxRootProps, ScrollTriggerIntoView } from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';

	let {
		triggers,
		items,
		scrollTriggerIntoView,
		morphTo,
		viewTransition = false,
		next = true,
		label
	}: {
		triggers: number;
		items: number;
		scrollTriggerIntoView: ScrollTriggerIntoView;
		morphTo?: LightboxRootProps['morphTo'];
		viewTransition?: boolean;
		next?: boolean;
		label: string;
	} = $props();
</script>

<Lightbox.Root {scrollTriggerIntoView} {morphTo} {viewTransition}>
	{#each { length: triggers }, i (i)}
		<Lightbox.Trigger index={i} data-testid="trigger-{i}">T{i}</Lightbox.Trigger>
	{/each}
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label={label}>
			<SlidesHost preload={1} count={items}>
				{#snippet children(i)}
					<Lightbox.Item index={i}>Item {i}</Lightbox.Item>
				{/snippet}
			</SlidesHost>
			{#if next}
				<Lightbox.Next data-testid="next">Next</Lightbox.Next>
			{/if}
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
