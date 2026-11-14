<!--
	The `Lightbox.Media` trees of lightbox-placeholder.test.tsx and
	zoom-engine-swap.test.tsx's `TestGallery`:

	  Root > Trigger? > Portal > Content > SlidesHost > Item > Zoom? > Media > child

	- `trigger`: render a Trigger (`data-testid="trigger"`) whose `<img>` attaches `image`.
	- `open`: Root's initial `open`, unbound (React's `defaultOpen`).
	- `zoom`: Zoom's props, or `false` for Media straight inside Item.
	- `child`: the media element (`tag` plus its attributes).
	- `onzoom`: receives the enclosing Zoom's context (React's `LightboxZoomRef`).
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import type { LightboxZoomContext, LightboxZoomProps } from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';
	import ZoomProbe from './ZoomProbe.svelte';

	type DataProps = Record<`data-${string}`, unknown>;

	let {
		trigger = false,
		open = false,
		zoom = {},
		media = {},
		child = { tag: 'img', src: '/full.jpg', alt: 'full' },
		onzoom
	}: {
		trigger?: boolean;
		open?: boolean;
		zoom?: (Omit<LightboxZoomProps, 'children'> & DataProps) | false;
		media?: Omit<Lightbox.LightboxMediaProps, 'children'> & DataProps;
		child?: { tag: 'img' | 'video' | 'canvas'; [attribute: string]: unknown };
		onzoom?: (zoom: LightboxZoomContext | undefined) => void;
	} = $props();

	const { tag, ...childAttributes } = $derived(child);
</script>

{#snippet mediaHost()}
	<Lightbox.Media {...media}>
		<svelte:element this={tag} {...childAttributes} />
	</Lightbox.Media>
{/snippet}

<Lightbox.Root {open}>
	{#if trigger}
		<Lightbox.Trigger index={0} data-testid="trigger">
			{#snippet children({ image })}
				<img {@attach image} src="/thumb.jpg" alt="thumb" />
			{/snippet}
		</Lightbox.Trigger>
	{/if}
	<Lightbox.Portal>
		<Lightbox.Content aria-label="viewer">
			<SlidesHost>
				{#snippet children()}
					<Lightbox.Item index={0}>
						{#if zoom}
							<Lightbox.Zoom {...zoom}>
								{@render mediaHost()}
								{#if onzoom}
									<ZoomProbe {onzoom} />
								{/if}
							</Lightbox.Zoom>
						{:else}
							{@render mediaHost()}
						{/if}
					</Lightbox.Item>
				{/snippet}
			</SlidesHost>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
