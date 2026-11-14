<!--
	use-accessible-name-warning.test.tsx's slide `Gallery`: an open Root >
	Portal > Content > SlidesHost (named carousel) with one Item per entry of
	`items` (its props, plus `text` as content). With `thumbs`, a ThumbnailGroup
	of that many thumbnails follows as one more SlidesHost child, which the
	original's SlidesHost wraps in a slide like any other child.
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import type { LightboxItemProps } from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';

	type ItemEntry = Omit<LightboxItemProps, 'index' | 'children'> &
		Record<`data-${string}`, unknown> & { text?: string };

	let { items, thumbs = 0 }: { items: ItemEntry[]; thumbs?: number } = $props();
</script>

<Lightbox.Root open>
	<Lightbox.Portal>
		<Lightbox.Content aria-label="viewer">
			<SlidesHost
				aria-roledescription="karuzela"
				aria-label="zdjęcia"
				count={items.length + (thumbs ? 1 : 0)}
			>
				{#snippet children(i)}
					{#if i < items.length}
						{@const { text, ...itemProps } = items[i]}
						{#if text !== undefined}
							<Lightbox.Item index={i} {...itemProps}>{text}</Lightbox.Item>
						{:else}
							<Lightbox.Item index={i} {...itemProps} />
						{/if}
					{:else}
						<Lightbox.ThumbnailGroup aria-label="miniatury">
							{#each { length: thumbs }, t (t)}
								<Lightbox.Thumbnail index={t}>{t + 1}</Lightbox.Thumbnail>
							{/each}
						</Lightbox.ThumbnailGroup>
					{/if}
				{/snippet}
			</SlidesHost>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
