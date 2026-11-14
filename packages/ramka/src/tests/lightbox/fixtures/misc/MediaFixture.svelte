<!--
	`count` bare `Lightbox.Media` instances (800×533, `/photo.jpg` or
	`/photo-{i}.jpg`), optionally inside an open `Lightbox.Root` (`inOpenRoot`,
	the only place the port renders its server-paint `<style>` tags) and a
	`Lightbox.CSPProvider` (`nonce`).
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';

	let {
		count = 1,
		inOpenRoot = false,
		nonce
	}: { count?: number; inOpenRoot?: boolean; nonce?: string } = $props();
</script>

{#snippet medias()}
	{#each { length: count }, i (i)}
		<Lightbox.Media width={800} height={533}>
			<img src={count === 1 ? '/photo.jpg' : `/photo-${i}.jpg`} alt="" width={800} height={533} />
		</Lightbox.Media>
	{/each}
{/snippet}

{#snippet tree()}
	{#if inOpenRoot}
		<Lightbox.Root open>{@render medias()}</Lightbox.Root>
	{:else}
		{@render medias()}
	{/if}
{/snippet}

{#if nonce !== undefined}
	<Lightbox.CSPProvider {nonce}>{@render tree()}</Lightbox.CSPProvider>
{:else}
	{@render tree()}
{/if}
