<!--
	The one-item trees `describe('view transitions')` renders inline in React:

	  Root > Trigger? > Portal > Content > Close? > [Stage >] SlidesHost > Item

	`trigger` / `item` / `stage` / `close` pick the shape of each part (which
	element gets the `image` / `morph` attachment); the `*Props` objects pass
	through to the part. Root's `open` is spread unbound (React's `defaultOpen`).
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import type {
		LightboxContentProps,
		LightboxItemProps,
		LightboxPortalProps,
		LightboxRootProps,
		LightboxTriggerProps
	} from '../../../../lib/lightbox';
	import type { LightboxZoomContext } from '../../../../lib/lightbox/LightboxZoom.svelte';
	import SlidesHost from '../SlidesHost.svelte';
	import StageFrame from './StageFrame.svelte';
	import ZoomProbe from './ZoomProbe.svelte';

	type DataProps = Record<`data-${string}`, unknown>;

	let {
		root = {},
		trigger = 'text',
		triggerProps = {},
		triggerImageStyle,
		portalProps = {},
		contentProps = {},
		close,
		stage = 'none',
		item = 'image',
		itemProps = {},
		itemImageSrc = 'full.jpg',
		itemImageAlt = 'full',
		itemImageStyle,
		itemDivText = 'no morph target here',
		zoomProps = {},
		onzoom
	}: {
		root?: Omit<LightboxRootProps, 'children'>;
		/**
		 * - `none`: no Trigger
		 * - `text`: "Open"
		 * - `image`: `<img {@attach image} src="thumb.jpg">`
		 * - `plain-image`: `<img src="thumb.jpg">`, nothing attached
		 * - `morph-card`: a card whose inner `<img>` gets `morph`
		 * - `combined`: one `<img>` with both `image` and `morph`
		 */
		trigger?: 'none' | 'text' | 'image' | 'plain-image' | 'morph-card' | 'combined';
		triggerProps?: Omit<LightboxTriggerProps, 'index' | 'children'> & DataProps;
		triggerImageStyle?: string;
		portalProps?: Omit<LightboxPortalProps, 'children'> & DataProps;
		contentProps?: Omit<LightboxContentProps, 'children'> & DataProps;
		/** Where Lightbox.Close (`data-testid="close"`) goes. */
		close?: 'content-start' | 'content-end' | 'root';
		/** `snippet`: Stage's `morph` on a frame div; `context`: a nested wrapper attaches it. */
		stage?: 'none' | 'snippet' | 'context';
		/**
		 * - `image`: `<img {@attach image}>`
		 * - `plain-image`: `<img src="https://example.com/a.jpg">`, nothing attached
		 * - `text`: "item"
		 * - `div`: `<div>{itemDivText}</div>`, nothing attached
		 * - `media`: Media > img
		 * - `zoom-media`: Zoom > Media > img
		 */
		item?: 'image' | 'plain-image' | 'text' | 'div' | 'media' | 'zoom-media';
		itemProps?: Omit<LightboxItemProps, 'index' | 'children'> & DataProps;
		itemImageSrc?: string;
		itemImageAlt?: string;
		itemImageStyle?: string;
		itemDivText?: string;
		zoomProps?: { maxZoom?: number };
		/** Receives the Zoom context (React's `LightboxZoom` ref). */
		onzoom?: (zoom: LightboxZoomContext) => void;
	} = $props();
</script>

{#snippet slides()}
	<SlidesHost>
		{#snippet children()}
			<Lightbox.Item index={0} {...itemProps}>
				{#snippet children({ image })}
					{#if item === 'image'}
						<img {@attach image} src={itemImageSrc} alt={itemImageAlt} style={itemImageStyle} />
					{:else if item === 'plain-image'}
						<img src="https://example.com/a.jpg" alt="a" />
					{:else if item === 'text'}
						item
					{:else if item === 'div'}
						<div>{itemDivText}</div>
					{:else if item === 'media'}
						<Lightbox.Media data-testid="media">
							<img src="a.jpg" alt="a" />
						</Lightbox.Media>
					{:else}
						<Lightbox.Zoom {...zoomProps}>
							{#if onzoom}<ZoomProbe {onzoom} />{/if}
							<Lightbox.Media data-testid="media">
								<img src="a.jpg" alt="a" />
							</Lightbox.Media>
						</Lightbox.Zoom>
					{/if}
				{/snippet}
			</Lightbox.Item>
		{/snippet}
	</SlidesHost>
{/snippet}

<Lightbox.Root {...root}>
	{#if trigger !== 'none'}
		<Lightbox.Trigger index={0} data-testid="trigger-0" {...triggerProps}>
			{#snippet children({ image, morph })}
				{#if trigger === 'text'}
					Open
				{:else if trigger === 'image'}
					<img {@attach image} src="thumb.jpg" alt="thumb" style={triggerImageStyle} />
				{:else if trigger === 'plain-image'}
					<img src="thumb.jpg" alt="thumb" />
				{:else if trigger === 'morph-card'}
					<span data-testid="card">
						<img {@attach morph} data-testid="morph-el" src="thumb.jpg" alt="thumb" />
						<span>Label stays</span>
					</span>
				{:else}
					<img
						{@attach (node) => {
							const detachImage = image(node);
							const detachMorph = morph(node);
							return () => {
								detachImage?.();
								detachMorph?.();
							};
						}}
						data-testid="morph-el"
						src="thumb.jpg"
						alt="thumb"
					/>
				{/if}
			{/snippet}
		</Lightbox.Trigger>
	{/if}
	<Lightbox.Portal {...portalProps}>
		<Lightbox.Content {...contentProps}>
			{#if close === 'content-start'}
				<Lightbox.Close data-testid="close">Close</Lightbox.Close>
			{/if}
			{#if stage === 'snippet'}
				<Lightbox.Stage>
					{#snippet children({ morph })}
						<div {@attach morph} data-testid="frame">
							{@render slides()}
						</div>
					{/snippet}
				</Lightbox.Stage>
			{:else if stage === 'context'}
				<Lightbox.Stage>
					<StageFrame>{@render slides()}</StageFrame>
				</Lightbox.Stage>
			{:else}
				{@render slides()}
			{/if}
			{#if close === 'content-end'}
				<Lightbox.Close data-testid="close">Close</Lightbox.Close>
			{/if}
		</Lightbox.Content>
	</Lightbox.Portal>
	{#if close === 'root'}
		<Lightbox.Close data-testid="close">Close</Lightbox.Close>
	{/if}
</Lightbox.Root>
