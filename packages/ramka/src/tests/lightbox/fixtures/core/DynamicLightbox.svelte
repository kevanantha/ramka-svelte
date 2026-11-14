<!-- Items and triggers driven by local `count` state; "Remove" drops to 2. -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';

	let count = $state(4);
</script>

<button data-testid="remove" onclick={() => (count = 2)}>Remove</button>
<Lightbox.Root open>
	{#each { length: count }, i (i)}
		<Lightbox.Trigger index={i}>T{i}</Lightbox.Trigger>
	{/each}
	<Lightbox.Portal>
		<Lightbox.Content aria-label="Dynamic test" data-testid="content">
			<SlidesHost preload={count} {count}>
				{#snippet children(i)}
					<Lightbox.Item index={i}>Item {i}</Lightbox.Item>
				{/snippet}
			</SlidesHost>
			<Lightbox.Counter data-testid="counter" />
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
