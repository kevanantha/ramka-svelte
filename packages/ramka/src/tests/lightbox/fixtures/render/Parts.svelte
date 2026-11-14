<!--
	An open lightbox with one of each button-like part, each taking its props as
	an object (attachments ride along under `createAttachmentKey()`). Trigger's
	`bind:ref` is reported through `onTriggerRef`.
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import type {
		LightboxBackdropProps,
		LightboxCloseProps,
		LightboxContentProps,
		LightboxNextProps,
		LightboxPreviousProps,
		LightboxRootProps,
		LightboxThumbnailProps,
		LightboxTriggerProps,
		LightboxItemRenderState
	} from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';

	type Data = Record<string, unknown>;

	let {
		root = {},
		trigger = {},
		backdrop = {},
		content = {},
		close = {},
		previous = {},
		next = {},
		thumbnail = {},
		showTrigger = true,
		onTriggerRef,
		onItemState
	}: {
		root?: Omit<LightboxRootProps, 'children'>;
		trigger?: Omit<LightboxTriggerProps, 'index' | 'children'> & Data;
		backdrop?: LightboxBackdropProps & Data;
		content?: Omit<LightboxContentProps, 'children'> & Data;
		close?: Omit<LightboxCloseProps, 'children'> & Data;
		previous?: Omit<LightboxPreviousProps, 'children'> & Data;
		next?: Omit<LightboxNextProps, 'children'> & Data;
		thumbnail?: Omit<LightboxThumbnailProps, 'index' | 'children'> & Data;
		showTrigger?: boolean;
		onTriggerRef?: (node: HTMLButtonElement | null) => void;
		onItemState?: (state: LightboxItemRenderState) => void;
	} = $props();

	let triggerRef: HTMLButtonElement | null = $state(null);
	$effect(() => onTriggerRef?.(triggerRef));
</script>

<Lightbox.Root {...root}>
	{#if showTrigger}
		<Lightbox.Trigger index={0} data-testid="trigger" bind:ref={triggerRef} {...trigger}>
			Open
		</Lightbox.Trigger>
	{/if}
	<Lightbox.Portal>
		<Lightbox.Backdrop data-testid="backdrop" {...backdrop} />
		<Lightbox.Content data-testid="content" aria-label="Parts" {...content}>
			<Lightbox.Close data-testid="close" {...close}>Close</Lightbox.Close>
			<SlidesHost count={3}>
				{#snippet children(i)}
					<Lightbox.Item index={i} data-testid="item-{i}">
						{#snippet children(state)}
							{onItemState?.(state)}Item {i}
						{/snippet}
					</Lightbox.Item>
				{/snippet}
			</SlidesHost>
			<Lightbox.Previous data-testid="prev" {...previous}>Previous</Lightbox.Previous>
			<Lightbox.Next data-testid="next" {...next}>Next</Lightbox.Next>
			<Lightbox.ThumbnailGroup>
				{#each { length: 3 }, i (i)}
					<Lightbox.Thumbnail index={i} data-testid="thumb-{i}" {...thumbnail}>
						Thumb {i}
					</Lightbox.Thumbnail>
				{/each}
			</Lightbox.ThumbnailGroup>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
