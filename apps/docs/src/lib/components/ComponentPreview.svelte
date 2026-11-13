<!--
  Live example + the multi-file source card below it. `frame={false}` drops
  the bordered card and renders the demo straight on the page (presets).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import ComponentSource from './ComponentSource.svelte';
	import type { SourceFile } from './source-file';

	let {
		files,
		align = 'center',
		frame = true,
		class: className = '',
		children
	}: {
		files: SourceFile[];
		align?: 'center' | 'start' | 'end';
		frame?: boolean;
		class?: string;
		children: Snippet;
	} = $props();

	const alignClass = $derived(
		{
			center: 'items-center justify-center',
			start: 'items-start justify-start',
			end: 'items-end justify-end'
		}[align]
	);
</script>

<div class="flex flex-col gap-4 {className}">
	{#if frame}
		<div
			class="overflow-hidden rounded-[0.875rem] border border-neutral-200 dark:border-neutral-800"
		>
			<div class="flex min-h-70 bg-white p-6 sm:p-10 dark:bg-neutral-950 {alignClass}">
				{@render children()}
			</div>
		</div>
	{:else}
		<!-- Bare demos flow with the page column (left-aligned like the title
		     and description), instead of floating centered in the free space. -->
		<div class="py-4">{@render children()}</div>
	{/if}

	<ComponentSource {files} />
</div>
