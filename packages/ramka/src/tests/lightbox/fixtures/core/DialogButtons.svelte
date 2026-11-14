<!-- An open dialog holding only plain buttons (no slides). -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';

	let { label, buttons }: { label: string; buttons: { testid: string; text: string }[] } = $props();
</script>

<Lightbox.Root open value={0}>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label={label}>
			{#each buttons as button (button.testid)}
				<button data-testid={button.testid} type="button">{button.text}</button>
			{/each}
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
