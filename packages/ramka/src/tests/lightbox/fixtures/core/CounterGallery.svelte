<!-- Four items and a Counter; `custom` renders "{current} of {total}". -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';

	let {
		value = 0,
		count,
		custom = false
	}: { value?: number; count?: number; custom?: boolean } = $props();
</script>

<Lightbox.Root open {value} {count}>
	<Lightbox.Portal>
		<Lightbox.Content aria-label="Test">
			<SlidesHost count={4}>
				{#snippet children(i)}
					<Lightbox.Item index={i}>Item {i}</Lightbox.Item>
				{/snippet}
			</SlidesHost>
			{#if custom}
				<Lightbox.Counter data-testid="counter">
					{#snippet children({ current, total })}
						<span>{`${current} of ${total}`}</span>
					{/snippet}
				</Lightbox.Counter>
			{:else}
				<Lightbox.Counter data-testid="counter" />
			{/if}
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
