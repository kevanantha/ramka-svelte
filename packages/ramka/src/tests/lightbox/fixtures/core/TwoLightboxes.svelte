<!-- Two independent Roots, both open. -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';
</script>

{#each ['a', 'b'] as name (name)}
	<Lightbox.Root open value={0}>
		<Lightbox.Portal>
			<Lightbox.Content data-testid="content-{name}" aria-label="Lightbox {name.toUpperCase()}">
				<SlidesHost>
					{#snippet children(i)}
						<Lightbox.Item index={i}>{name.toUpperCase()}0</Lightbox.Item>
					{/snippet}
				</SlidesHost>
			</Lightbox.Content>
		</Lightbox.Portal>
	</Lightbox.Root>
{/each}
