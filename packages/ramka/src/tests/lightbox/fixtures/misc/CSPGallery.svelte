<!--
	An open gallery exercising all three server-paint rule sets (media fill,
	active-trigger hide, SSR initial slide): ramka's `openGallery()` from
	lightbox-csp.test.tsx and the tree in lightbox-csp.client.test.tsx. Wrapped
	in `Lightbox.CSPProvider` when `nonce` is given; rendered bare otherwise
	(the pre-CSP baseline).
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';

	let {
		nonce,
		value = 0,
		items = 1,
		mediaHeight = 600,
		inPlace = false,
		ssrSlideShift = false,
		src = (i: number) => `/${i}.jpg`
	}: {
		/** Wrap in `Lightbox.CSPProvider nonce={nonce}`; omitted: no provider. */
		nonce?: string;
		value?: number;
		items?: number;
		mediaHeight?: number;
		/** `Portal container={null}` (render in place, as SSR-open pages do). */
		inPlace?: boolean;
		ssrSlideShift?: boolean;
		src?: (i: number) => string;
	} = $props();
</script>

{#snippet gallery()}
	<Lightbox.Root open {value}>
		<Lightbox.Trigger index={0}>open</Lightbox.Trigger>
		<Lightbox.Portal container={inPlace ? null : undefined}>
			<Lightbox.Content aria-label="viewer">
				<Lightbox.Slides aria-label="Slides" {ssrSlideShift}>
					{#each { length: items }, i (i)}
						<Lightbox.Slide>
							<Lightbox.Item index={i} aria-label="{i + 1} of {items}">
								<Lightbox.Media width={800} height={mediaHeight}>
									<img src={src(i)} alt="" width={800} height={mediaHeight} />
								</Lightbox.Media>
							</Lightbox.Item>
						</Lightbox.Slide>
					{/each}
				</Lightbox.Slides>
			</Lightbox.Content>
		</Lightbox.Portal>
	</Lightbox.Root>
{/snippet}

{#if nonce !== undefined}
	<Lightbox.CSPProvider {nonce}>{@render gallery()}</Lightbox.CSPProvider>
{:else}
	{@render gallery()}
{/if}
