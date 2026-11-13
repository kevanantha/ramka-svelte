<!--
	ramka's `TestLightbox` helper. React's controlled/uncontrolled pair maps to
	Svelte's bindable props like this:

	- `defaultOpen` / `defaultValue` (uncontrolled): the fixture owns the state
	  and Root writes it back, like `bind:open`.
	- `open` / `value` (controlled): a function binding whose getter returns the
	  prop and whose setter does not change it, so Root sees only what the
	  parent passes — React's controlled prop with an `onOpenChange` that does
	  not update state. Tests change it with `rerender`.
-->
<script lang="ts">
	import * as Lightbox from '../../../lib/lightbox';
	import type { NavigationSource } from '../../../lib/lightbox';
	import SlidesHost from './SlidesHost.svelte';

	let {
		itemCount = 3,
		defaultOpen = false,
		open,
		defaultValue,
		value,
		loop = false,
		preload = 1,
		viewTransition = false,
		awaitImageDecode,
		withThumbnails = false,
		withCaptions = false,
		onOpenChange,
		onOpenChangeComplete,
		onValueChange,
		renderPropItems = false
	}: {
		itemCount?: number;
		defaultOpen?: boolean;
		open?: boolean;
		defaultValue?: number;
		value?: number;
		loop?: boolean;
		preload?: number;
		viewTransition?: boolean;
		awaitImageDecode?: boolean | number;
		withThumbnails?: boolean;
		withCaptions?: boolean;
		onOpenChange?: (open: boolean) => void;
		onOpenChangeComplete?: (open: boolean) => void;
		onValueChange?: (value: number, metadata: { source: NavigationSource }) => void;
		renderPropItems?: boolean;
	} = $props();

	// Initial values only, like React's `default*` props.
	// svelte-ignore state_referenced_locally
	let localOpen = $state(defaultOpen);
	// svelte-ignore state_referenced_locally
	let localValue = $state(defaultValue ?? 0);
</script>

<Lightbox.Root
	bind:open={() => open ?? localOpen, (next) => (localOpen = next)}
	bind:value={() => value ?? localValue, (next) => (localValue = next)}
	{loop}
	{viewTransition}
	{awaitImageDecode}
	{onOpenChange}
	{onOpenChangeComplete}
	{onValueChange}
>
	{#each { length: itemCount }, i (i)}
		<Lightbox.Trigger index={i} data-testid="trigger-{i}">Trigger {i}</Lightbox.Trigger>
	{/each}

	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Test lightbox">
			<Lightbox.Close data-testid="close">Close</Lightbox.Close>

			<SlidesHost data-testid="slides" {preload} count={itemCount}>
				{#snippet children(i)}
					<Lightbox.Item
						index={i}
						data-testid="item-{i}"
						caption={withCaptions ? `Caption ${i}` : undefined}
					>
						{#snippet children(state)}
							{#if renderPropItems}
								<div
									data-testid="render-prop-{i}"
									data-active={state.active}
									data-visible={state.visible}
								>
									Item {i}
								</div>
							{:else}
								Item {i}
							{/if}
						{/snippet}
					</Lightbox.Item>
				{/snippet}
			</SlidesHost>

			<Lightbox.Previous data-testid="prev">Previous</Lightbox.Previous>
			<Lightbox.Next data-testid="next">Next</Lightbox.Next>
			<Lightbox.Counter data-testid="counter" />
			<Lightbox.Caption data-testid="caption" />

			{#if withThumbnails}
				<Lightbox.ThumbnailGroup data-testid="thumb-group">
					{#each { length: itemCount }, i (i)}
						<Lightbox.Thumbnail index={i} data-testid="thumb-{i}">Thumb {i}</Lightbox.Thumbnail>
					{/each}
				</Lightbox.ThumbnailGroup>
			{/if}
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
