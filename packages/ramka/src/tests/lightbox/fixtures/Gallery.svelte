<!--
	The shape most one-off trees in ramka's suite take, with each part's props
	passed through:

	  Root > Trigger × triggers? > Portal > Backdrop? > Content > Close? >
	    SlidesHost > Item × items

	Root's `open` / `value` are spread unbound, so Root owns them after mount
	(React's `defaultOpen` / `defaultValue`). Items render "Item {i}" unless the
	test passes per-item props with `children`.
-->
<script lang="ts">
	import * as Lightbox from '../../../lib/lightbox';
	import type {
		LightboxBackdropProps,
		LightboxCloseProps,
		LightboxContentProps,
		LightboxItemProps,
		LightboxPortalProps,
		LightboxRootProps,
		LightboxTriggerProps
	} from '../../../lib/lightbox';
	import type { ComponentProps } from 'svelte';
	import SlidesHost from './SlidesHost.svelte';

	type DataProps = Record<`data-${string}`, unknown>;

	let {
		root = {},
		triggers = 0,
		trigger = {},
		portal = {},
		backdrop,
		content = {},
		close,
		slides = {},
		items = 1,
		item = {}
	}: {
		root?: Omit<LightboxRootProps, 'children'>;
		/** Number of triggers (index 0…n-1, `data-testid="trigger-{i}"`). */
		triggers?: number;
		trigger?: Omit<LightboxTriggerProps, 'index' | 'children'> & DataProps;
		portal?: Omit<LightboxPortalProps, 'children'> & DataProps;
		/** Render a Backdrop with these props. */
		backdrop?: LightboxBackdropProps & DataProps;
		content?: Omit<LightboxContentProps, 'children'> & DataProps;
		/** Render a Close with these props (text "Close"). */
		close?: Omit<LightboxCloseProps, 'children'> & DataProps;
		slides?: Omit<ComponentProps<typeof SlidesHost>, 'children' | 'count'> & DataProps;
		/** Item count, or per-item props. */
		items?: number | (Omit<LightboxItemProps, 'index'> & DataProps)[];
		/** Props every item gets (per-item props win). */
		item?: Omit<LightboxItemProps, 'index' | 'children'> & DataProps;
	} = $props();

	type ItemProps = Omit<LightboxItemProps, 'index'> & DataProps;
	const itemProps: ItemProps[] = $derived(
		typeof items === 'number' ? Array.from({ length: items }, () => ({})) : items
	);
</script>

<Lightbox.Root {...root}>
	{#each { length: triggers }, i (i)}
		<Lightbox.Trigger index={i} data-testid="trigger-{i}" {...trigger}>Trigger {i}</Lightbox.Trigger
		>
	{/each}
	<Lightbox.Portal {...portal}>
		{#if backdrop}
			<Lightbox.Backdrop {...backdrop} />
		{/if}
		<Lightbox.Content {...content}>
			{#if close}
				<Lightbox.Close {...close}>Close</Lightbox.Close>
			{/if}
			<SlidesHost {...slides} count={itemProps.length}>
				{#snippet children(i)}
					{@const own = itemProps[i]}
					<Lightbox.Item index={i} {...item} {...own}>
						{#snippet children(state)}
							{#if own.children}
								{@render own.children(state)}
							{:else}
								Item {i}
							{/if}
						{/snippet}
					</Lightbox.Item>
				{/snippet}
			</SlidesHost>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
