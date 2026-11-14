<!-- Portal with `container={null}` inside a page wrapper: renders in place. -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';
</script>

<Lightbox.Root open>
	<div data-testid="anchor">
		<Lightbox.Portal container={null}>
			<Lightbox.Content data-testid="content" aria-label="In place">
				<SlidesHost>
					{#snippet children(i)}
						<Lightbox.Item index={i}>Item 0</Lightbox.Item>
					{/snippet}
				</SlidesHost>
			</Lightbox.Content>
		</Lightbox.Portal>
	</div>
</Lightbox.Root>
