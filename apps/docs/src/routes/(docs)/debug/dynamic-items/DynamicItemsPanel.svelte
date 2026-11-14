<!-- In-viewer controls for mutating the gallery list while the lightbox is open. -->
<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import { getLightboxContext } from 'ramka-svelte';
	import Check from '@lucide/svelte/icons/check';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ListPlus from '@lucide/svelte/icons/list-plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import {
		menuCheckboxItemClass,
		menuContentClass,
		menuItemClass,
		menuLabelClass,
		menuSeparatorClass,
		menuSubContentClass,
		menuSubTriggerClass,
		panelButtonClass
	} from '#lib/components/ui.js';
	import type { DynamicItem } from './animated-item-removal.svelte';

	let {
		items,
		autoRecover = $bindable(),
		isRemoving,
		onAddItemAtStart,
		onAddItemAtEnd,
		onRemoveActive,
		onRemoveAt,
		onReset
	}: {
		items: DynamicItem[];
		autoRecover: boolean;
		isRemoving: (item: DynamicItem) => boolean;
		onAddItemAtStart: () => void;
		onAddItemAtEnd: () => void;
		onRemoveActive: () => void;
		onRemoveAt: (index: number) => void;
		onReset: () => void;
	} = $props();

	const lightbox = getLightboxContext();
	const activeItem = $derived(items[lightbox.activeIndex]);
	const activeLabel = $derived(
		activeItem?.caption ?? activeItem?.alt ?? `Slide ${lightbox.activeIndex + 1}`
	);
	const activeRemoving = $derived(activeItem ? isRemoving(activeItem) : false);
</script>

<div
	class="lightbox-demo-chrome-hide pointer-events-auto absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] left-1/2 z-40 flex max-w-[min(100%-1.5rem,36rem)] -translate-x-1/2 flex-col gap-2 rounded-xl border border-white/20 bg-black/45 p-3 text-white shadow-lg backdrop-blur-xl backdrop-saturate-150"
	data-testid="dynamic-items-panel"
>
	<div class="flex flex-wrap items-center justify-between gap-2">
		<p class="text-xs font-medium tracking-wide text-white/80 uppercase">Dynamic items</p>
		<span
			class="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[11px] text-white/70 tabular-nums"
		>
			index {lightbox.activeIndex} · count {lightbox.itemCount}
		</span>
	</div>

	<div class="flex flex-wrap items-center gap-2">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger class={panelButtonClass}>
				<ListPlus data-icon="inline-start" />
				Items
				<ChevronDown data-icon="inline-end" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content align="start" sideOffset={4} class="{menuContentClass} w-56">
					<DropdownMenu.Group>
						<DropdownMenu.GroupHeading class={menuLabelClass}
							>Mutate gallery</DropdownMenu.GroupHeading
						>
						<DropdownMenu.Item class={menuItemClass} onSelect={onAddItemAtStart}>
							Add slide at beginning
						</DropdownMenu.Item>
						<DropdownMenu.Item class={menuItemClass} onSelect={onAddItemAtEnd}>
							Add slide at end
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class={menuItemClass}
							disabled={items.length === 0 || activeRemoving}
							onSelect={onRemoveActive}
						>
							<Trash2 />
							Remove current slide
						</DropdownMenu.Item>
					</DropdownMenu.Group>
					{#if items.length > 0}
						<DropdownMenu.Separator class={menuSeparatorClass} />
						<DropdownMenu.Sub>
							<DropdownMenu.SubTrigger class={menuSubTriggerClass}>
								Remove by slide
								<ChevronRight class="ml-auto" />
							</DropdownMenu.SubTrigger>
							<!-- Portaled like the root menu: nested in it, the root's scroll
							     container would clip the submenu. -->
							<DropdownMenu.Portal>
								<DropdownMenu.SubContent
									side="right"
									align="start"
									alignOffset={-3}
									sideOffset={0}
									class="{menuSubContentClass} max-h-64 overflow-y-auto"
								>
									{#each items as item, i (item.id)}
										<DropdownMenu.Item
											class={menuItemClass}
											disabled={isRemoving(item)}
											onSelect={() => onRemoveAt(i)}
										>
											{i === lightbox.activeIndex ? '● ' : ''}{item.caption}
										</DropdownMenu.Item>
									{/each}
								</DropdownMenu.SubContent>
							</DropdownMenu.Portal>
						</DropdownMenu.Sub>
					{/if}
					<DropdownMenu.Separator class={menuSeparatorClass} />
					<!-- Toggling keeps the menu open, like the original's Base UI checkbox item. -->
					<DropdownMenu.CheckboxItem
						class={menuCheckboxItemClass}
						closeOnSelect={false}
						bind:checked={autoRecover}
					>
						{#snippet children({ checked })}
							Auto-recover active slide
							{#if checked}
								<span class="pointer-events-none absolute right-2 flex items-center justify-center">
									<Check />
								</span>
							{/if}
						{/snippet}
					</DropdownMenu.CheckboxItem>
					<DropdownMenu.Item class={menuItemClass} onSelect={onReset}>
						Reset to 3 slides
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>

		<span class="min-w-0 truncate text-xs text-white/65">
			Viewing: <span class="text-white/90">{activeLabel}</span>
		</span>
	</div>

	<p class="text-[11px] leading-relaxed text-white/60">
		Simulate collaborative edits while the viewer stays open. The active slide dissolves before
		unmount; auto-recover waits for that fade before jumping to a neighbor.
	</p>
</div>
