<!-- Single-slide scaffold used by the one-item eggs; the snippet receives
     the Item's `image` / `morph` attachments. -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import type { Snippet } from 'svelte';

	let { children: content }: { children: Snippet<[Lightbox.LightboxItemRenderState]> } = $props();
</script>

<Lightbox.Slides aria-label="Showcase" class="flex-1 [&::-webkit-scrollbar]:hidden">
	<Lightbox.Slide class="h-full min-w-full flex-[0_0_100%]">
		<Lightbox.Item index={0} class="flex h-full w-full items-center justify-center px-6 py-14">
			{#snippet children(state)}{@render content(state)}{/snippet}
		</Lightbox.Item>
	</Lightbox.Slide>
</Lightbox.Slides>
