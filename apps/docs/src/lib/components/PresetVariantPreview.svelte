<!--
  Styling-variant switcher for preset pages: one tab per skin flavor
  (Tailwind / CSS), each with its own live demo and source card. Inactive
  variants unmount, so only one lightbox instance exists at a time and the
  two skins never coexist in the DOM. Tabs follow the original docs'
  tabs: arrows move focus (looping), Enter / Space / click activate.
-->
<script lang="ts" generics="Id extends string">
	import type { Snippet } from 'svelte';
	import ComponentPreview from './ComponentPreview.svelte';
	import type { SourceFile } from './source-file';

	let {
		variants,
		frame = false,
		preview
	}: {
		variants: Array<{ id: Id; label: string; files: SourceFile[] }>;
		frame?: boolean;
		/** Live demo for the active variant. */
		preview: Snippet<[Id]>;
	} = $props();

	const uid = $props.id();
	let activeId = $state<Id | undefined>();
	const active = $derived(variants.find((v) => v.id === activeId) ?? variants[0]);
	const tabs: HTMLButtonElement[] = [];

	function onKeydown(event: KeyboardEvent, index: number) {
		const last = variants.length - 1;
		const next =
			event.key === 'ArrowRight'
				? index === last
					? 0
					: index + 1
				: event.key === 'ArrowLeft'
					? index === 0
						? last
						: index - 1
					: event.key === 'Home'
						? 0
						: event.key === 'End'
							? last
							: -1;
		if (next < 0) return;
		event.preventDefault();
		tabs[next]?.focus();
	}

	// Same segmented-tab recipe as the source card (shadcn tabs + px-3 text-xs).
	const tabClass =
		'relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-[0.5rem] border border-transparent px-3 py-0.5 text-xs font-medium whitespace-nowrap text-neutral-950/60 transition-all hover:text-neutral-950 focus-visible:border-neutral-400 focus-visible:ring-[3px] focus-visible:ring-neutral-400/50 focus-visible:outline-1 focus-visible:outline-neutral-400 data-active:bg-background data-active:text-neutral-950 data-active:shadow-sm dark:text-neutral-400 dark:hover:text-neutral-50 dark:data-active:border-white/15 dark:data-active:bg-white/[0.045] dark:data-active:text-neutral-50';
</script>

<div class="flex flex-col gap-2">
	<div
		role="tablist"
		aria-orientation="horizontal"
		class="inline-flex h-8 w-fit items-center justify-center rounded-[0.625rem] bg-neutral-100 p-[3px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
	>
		{#each variants as variant, index (variant.id)}
			{@const selected = variant === active}
			<button
				bind:this={tabs[index]}
				type="button"
				role="tab"
				id="{uid}-tab-{variant.id}"
				aria-selected={selected}
				aria-controls={selected ? `${uid}-panel` : undefined}
				tabindex={selected ? 0 : -1}
				data-active={selected ? '' : undefined}
				class={tabClass}
				onclick={() => (activeId = variant.id)}
				onkeydown={(event) => onKeydown(event, index)}
			>
				{variant.label}
			</button>
		{/each}
	</div>
	{#if active}
		{#key active.id}
			<div
				role="tabpanel"
				id="{uid}-panel"
				aria-labelledby="{uid}-tab-{active.id}"
				tabindex="0"
				class="flex-1 text-sm outline-none"
			>
				<ComponentPreview files={active.files} {frame}>
					{@render preview(active.id)}
				</ComponentPreview>
			</div>
		{/key}
	{/if}
</div>
