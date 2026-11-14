<!--
	lightbox-placeholder.test.tsx's `Harness`: three thumbnail triggers, a
	`preload={0}` window, and a button that jumps the bound value to 2.
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';

	let value = $state(0);
</script>

<Lightbox.Root bind:value>
	{#each [0, 1, 2] as i (i)}
		<Lightbox.Trigger index={i} data-testid="trigger-{i}">
			{#snippet children({ image })}
				<img {@attach image} src="/thumb-{i}.jpg" alt={String(i)} />
			{/snippet}
		</Lightbox.Trigger>
	{/each}
	<button type="button" data-testid="jump" onclick={() => (value = 2)}>jump</button>
	<Lightbox.Portal>
		<Lightbox.Content aria-label="viewer">
			<SlidesHost preload={0} count={3}>
				{#snippet children(i)}
					<Lightbox.Item index={i}>
						{#snippet children({ image })}
							<img {@attach image} src="/full-{i}.jpg" alt={String(i)} />
						{/snippet}
					</Lightbox.Item>
				{/snippet}
			</SlidesHost>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
