<!--
	A detached `Lightbox.Trigger` (outside any Root, through a handle) under one
	`Lightbox.CSPProvider`, next to the open Root it is bound to. In the port the
	Root, not the Trigger, renders the hide rule (server-paint-styles.ts).
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';

	let { nonce, withRoot = true }: { nonce: string; withRoot?: boolean } = $props();
	const handle = Lightbox.createHandle();
</script>

<Lightbox.CSPProvider {nonce}>
	<Lightbox.Trigger {handle} index={0}>open</Lightbox.Trigger>
	{#if withRoot}
		<Lightbox.Root {handle} open>
			<Lightbox.Portal container={null}>
				<Lightbox.Content aria-label="viewer">viewer</Lightbox.Content>
			</Lightbox.Portal>
		</Lightbox.Root>
	{/if}
</Lightbox.CSPProvider>
