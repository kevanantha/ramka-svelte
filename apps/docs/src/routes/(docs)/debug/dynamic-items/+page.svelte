<!--
  Debug: default docs chrome with an in-viewer dropdown to add/remove slides
  while the lightbox stays open (collaborative-editor stress test).
  Port of the original docs' app/(docs)/debug/dynamic-items.
-->
<script lang="ts" module>
	import type { DynamicItem } from './animated-item-removal.svelte';

	const INITIAL_TRIGGER_COUNT = 3;

	/** The pool of local assets new items cycle through (ramka-dynamic-pool-*). */
	const POOL: [number, number][] = [
		[1200, 800],
		[800, 1200],
		[1200, 1200],
		[1600, 900],
		[1200, 800],
		[800, 1200],
		[1200, 1200],
		[1600, 900],
		[1200, 800],
		[800, 1200],
		[1200, 1200],
		[1600, 900]
	];

	let nextItemSerial = 1;

	/** Newly added items cycle through the pool by seed. */
	function createItem(seed: number): DynamicItem {
		const serial = nextItemSerial++;
		const n = seed % POOL.length;
		const [width, height] = POOL[n]!;
		return {
			id: `dynamic-${serial}`,
			src: `/photos/ramka-dynamic-pool-${n}.jpg`,
			thumb: `/photos/thumbs/ramka-dynamic-pool-${n}.jpg`,
			alt: `Dynamic slide ${serial}`,
			caption: `Slide ${serial} · ${width}×${height}`,
			width,
			height
		};
	}

	function createInitialItems(count = 3) {
		return Array.from({ length: count }, (_, i) => createItem(i));
	}

	const INITIAL_ITEMS = createInitialItems();
</script>

<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import { RadioGroup } from 'bits-ui';
	import { triggerFocusClass } from '#lib/components/chrome.js';
	import { labelClass, radioItemClass } from '#lib/components/ui.js';
	import { AnimatedItemRemoval } from './animated-item-removal.svelte';
	import DynamicItemsGallery from './DynamicItemsGallery.svelte';
	import DynamicItemsPanel from './DynamicItemsPanel.svelte';
	import './dynamic-items.css';

	type TriggerMode = 'fixed' | 'synced';

	let items = $state.raw(INITIAL_ITEMS);
	let activeIndex = $state(0);
	let autoRecover = $state(false);
	let triggerMode = $state<TriggerMode>('synced');
	let fixedTriggers = $state.raw(INITIAL_ITEMS.slice(0, INITIAL_TRIGGER_COUNT));
	let itemSeed = INITIAL_ITEMS.length;

	const removal = new AnimatedItemRemoval({
		get items() {
			return items;
		},
		set items(next) {
			items = next;
		},
		get activeIndex() {
			return activeIndex;
		},
		set activeIndex(next) {
			activeIndex = next;
		},
		get autoRecover() {
			return autoRecover;
		}
	});

	function removeActive() {
		const item = items[activeIndex];
		if (item && removal.isRemoving(item)) return;
		removal.removeAt(activeIndex);
	}

	function removeAt(index: number) {
		const item = items[index];
		if (!item || removal.isRemoving(item)) return;
		removal.removeAt(index);
	}

	function addItemAtEnd() {
		items = [...items, createItem(itemSeed++)];
	}

	function addItemAtStart() {
		items = [createItem(itemSeed++), ...items];
		activeIndex += 1;
	}

	function resetItems() {
		removal.clearPending();
		nextItemSerial = 1;
		itemSeed = 3;
		items = createInitialItems();
		fixedTriggers = items.slice(0, INITIAL_TRIGGER_COUNT);
		activeIndex = 0;
	}

	function setTriggerMode(value: string) {
		triggerMode = value as TriggerMode;
		if (triggerMode === 'fixed') fixedTriggers = items.slice(0, INITIAL_TRIGGER_COUNT);
	}

	const triggerItems = $derived(triggerMode === 'synced' ? items : fixedTriggers);
</script>

<svelte:head>
	<title>Dynamic items — ramka-svelte</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
	<header>
		<p
			class="text-[11px] font-semibold tracking-widest text-amber-700 uppercase dark:text-amber-400"
		>
			Debug · development only
		</p>
		<h1 class="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
			Dynamic items
		</h1>
		<p class="mt-3 max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
			Open the lightbox, then use the Items dropdown to add or remove slides without closing the
			viewer. Toggle auto-recover to compare raw library behavior vs. app-level reconciliation when
			the active slide disappears.
		</p>
	</header>

	<section class="space-y-3">
		<h2 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">What to verify</h2>
		<ul class="list-disc space-y-1 pl-5 text-sm text-neutral-600 dark:text-neutral-400">
			<li>Counter and thumbnail strip update as items mount/unmount</li>
			<li>Removing a non-active slide reindexes remaining slides (array-index model)</li>
			<li>With auto-recover off, deleting the active slide can leave a blank viewer</li>
			<li>With auto-recover on, deleting the active slide jumps to the nearest neighbor</li>
			<li>Slides and thumbnails dissolve out before unmounting (380ms ease-out)</li>
			<li>With auto-recover on, the viewer steps to a neighbor after the fade completes</li>
			<li>
				Fixed triggers: page grid stays at {INITIAL_TRIGGER_COUNT} tiles (frozen thumbs, index-bound);
				synced triggers grow/shrink with the gallery
			</li>
		</ul>
	</section>

	<fieldset class="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
		<legend class="px-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
			Trigger mode
		</legend>
		<RadioGroup.Root value={triggerMode} onValueChange={setTriggerMode} class="grid w-full gap-3">
			<label class="{labelClass} cursor-pointer font-normal">
				<RadioGroup.Item value="synced" class={radioItemClass}>
					{#snippet children({ checked })}
						{#if checked}
							<span
								class="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-50"
							></span>
						{/if}
					{/snippet}
				</RadioGroup.Item>
				Synced — new page triggers appear when slides are added
			</label>
			<label class="{labelClass} cursor-pointer font-normal">
				<RadioGroup.Item value="fixed" class={radioItemClass}>
					{#snippet children({ checked })}
						{#if checked}
							<span
								class="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-50"
							></span>
						{/if}
					{/snippet}
				</RadioGroup.Item>
				Fixed — page triggers stay at {INITIAL_TRIGGER_COUNT} tiles (thumbs frozen, still open by index)
			</label>
		</RadioGroup.Root>
	</fieldset>

	<Lightbox.Root bind:value={activeIndex}>
		<div class="grid max-w-md grid-cols-3 gap-3">
			{#each triggerItems as item, i (triggerMode === 'fixed' ? `fixed-${i}` : item.id)}
				<Lightbox.Trigger
					index={i}
					class={[
						'block overflow-hidden rounded-2xl',
						triggerFocusClass,
						triggerMode === 'synced' && removal.isRemoving(item) && 'dynamic-items-thumb-removing'
					]}
				>
					{#snippet children({ image })}
						<img
							{@attach image}
							src={item.thumb}
							alt={item.alt}
							width={item.width}
							height={item.height}
							class="aspect-square w-full object-cover"
						/>
					{/snippet}
				</Lightbox.Trigger>
			{/each}
		</div>
		<p class="mt-2 text-xs text-neutral-500">
			{triggerItems.length} page trigger{triggerItems.length === 1 ? '' : 's'} ({triggerMode}) · {items.length}
			slide{items.length === 1 ? '' : 's'} in gallery
		</p>

		<DynamicItemsGallery
			{items}
			ariaLabel="Dynamic items debug gallery"
			isRemoving={removal.isRemoving}
		>
			{#snippet overlay()}
				<DynamicItemsPanel
					{items}
					bind:autoRecover
					isRemoving={removal.isRemoving}
					onAddItemAtStart={addItemAtStart}
					onAddItemAtEnd={addItemAtEnd}
					onRemoveActive={removeActive}
					onRemoveAt={removeAt}
					onReset={resetItems}
				/>
			{/snippet}
		</DynamicItemsGallery>
	</Lightbox.Root>
</div>
