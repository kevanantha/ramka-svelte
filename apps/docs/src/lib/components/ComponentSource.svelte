<!-- Standalone source card: segmented file switcher + copy for the active file. -->
<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import '../styles/code-block.css';
	import { copyText, type SourceFile, type SourceFileGroup } from './source-file';

	let { files, class: className = '' }: { files: SourceFile[]; class?: string } = $props();

	const uid = $props.id();
	let activeName = $state('');
	let copied = $state(false);
	let copiedTimer = 0;
	const current = $derived(files.find((f) => f.name === activeName) ?? files[0]);

	/** Package files first, then the example, then anything ungrouped. */
	const sections = $derived.by(() => {
		if (!files.some((f) => f.group)) return [files];
		const order: Array<SourceFileGroup | undefined> = ['package', 'example', undefined];
		return order.map((group) => files.filter((f) => f.group === group)).filter((l) => l.length);
	});

	function select(file: SourceFile) {
		activeName = file.name;
		copied = false;
	}

	/** Arrow / Home / End move between tabs and activate them (roving tabindex). */
	function onTabKeydown(event: KeyboardEvent, index: number) {
		const last = files.length - 1;
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
		select(files[next]!);
		document.getElementById(`${uid}-tab-${next}`)?.focus();
	}

	function copy() {
		if (!current || !copyText(current.code)) return;
		copied = true;
		window.clearTimeout(copiedTimer);
		copiedTimer = window.setTimeout(() => (copied = false), 1500);
	}

	const tabClass =
		'relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-[0.5rem] border border-transparent px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-neutral-950/60 transition-all hover:text-neutral-950 focus-visible:border-neutral-400 focus-visible:ring-[3px] focus-visible:ring-neutral-400/50 focus-visible:outline-1 focus-visible:outline-neutral-400 data-active:bg-background data-active:text-neutral-950 data-active:shadow-sm dark:text-neutral-400 dark:hover:text-neutral-50 dark:data-active:border-white/15 dark:data-active:bg-white/[0.045] dark:data-active:text-neutral-50';
</script>

<div
	class="overflow-hidden rounded-[0.875rem] border border-neutral-200 dark:border-neutral-800 {className}"
>
	<div
		class="flex flex-col gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900"
	>
		<div class="flex items-center justify-between gap-3">
			{#if files.length > 1}
				<div
					role="tablist"
					aria-orientation="horizontal"
					class="inline-flex h-8 w-fit max-w-full [scrollbar-width:none] items-center justify-start overflow-x-auto rounded-[0.625rem] bg-neutral-100 p-[3px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 [&::-webkit-scrollbar]:hidden"
				>
					{#each sections as section, s (s)}
						{#if s > 0}
							<span
								aria-hidden="true"
								class="mx-1 h-4 w-px shrink-0 self-center bg-neutral-300 dark:bg-neutral-600"
							></span>
						{/if}
						{#each section as file (file.name)}
							{@const index = files.indexOf(file)}
							{@const active = file === current}
							<button
								type="button"
								role="tab"
								id="{uid}-tab-{index}"
								aria-selected={active}
								aria-controls="{uid}-panel-{index}"
								tabindex={active ? 0 : -1}
								data-active={active ? '' : undefined}
								class={tabClass}
								onclick={() => select(file)}
								onkeydown={(event) => onTabKeydown(event, index)}
							>
								{file.name}
							</button>
						{/each}
					{/each}
				</div>
			{:else}
				<span class="text-xs font-medium text-neutral-500">{current?.name}</span>
			{/if}

			<button
				type="button"
				onclick={copy}
				class="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-neutral-500 transition hover:bg-neutral-200/70 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
				aria-label={current ? `Copy ${current.name}` : 'Copy code'}
			>
				{#if copied}
					<Check class="size-3.5" />
				{:else}
					<Copy class="size-3.5" />
				{/if}
				<span class="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
			</button>
		</div>

		{#if current?.note}
			<p class="text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">
				{current.note}
			</p>
		{/if}
	</div>

	{#each files as file, index (file.name)}
		<div
			role={files.length > 1 ? 'tabpanel' : undefined}
			id="{uid}-panel-{index}"
			aria-labelledby={files.length > 1 ? `${uid}-tab-${index}` : undefined}
			hidden={file !== current}
			class="mt-0 flex-1 text-sm outline-none"
		>
			<div
				class="code-block-pre max-h-[min(32rem,70vh)] overflow-auto bg-neutral-50 dark:bg-neutral-950"
			>
				<!-- Shiki output, highlighted from our own source files at prerender. -->
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html file.html}
			</div>
		</div>
	{/each}
</div>
