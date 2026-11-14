<!--
	`Harness` of "survives a consumer re-render with a fresh inline config
	during the debounce": controlled `value`, and an echo button that re-renders
	the consumer. Svelte only re-evaluates a prop expression when its
	dependencies change, so the config literal reads `echo` to get React's
	fresh identity on every consumer re-render.
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import type { ScrollTriggerIntoView } from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';

	let index = $state(0);
	let echo = $state(0);

	// A new config on every call; called with `echo` so each echo makes one.
	const inlineConfig = (_render: number): ScrollTriggerIntoView => [
		{ type: 'onChange', behavior: 'instant' }
	];
</script>

<Lightbox.Root bind:value={index} scrollTriggerIntoView={inlineConfig(echo)}>
	{#each [0, 1, 2] as i (i)}
		<Lightbox.Trigger index={i} data-testid="trigger-{i}">T{i}</Lightbox.Trigger>
	{/each}
	<!-- Models the router re-render that follows a shallow URL write. -->
	<button data-testid="echo" onclick={() => (echo += 1)}>echo</button>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="scroll test">
			<SlidesHost preload={1} count={3}>
				{#snippet children(i)}
					<Lightbox.Item index={i}>Item {i}</Lightbox.Item>
				{/snippet}
			</SlidesHost>
			<Lightbox.Next data-testid="next">Next</Lightbox.Next>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
