<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import DocDescription from './DocDescription.svelte';
	import TypeHighlight from './TypeHighlight.svelte';
	import {
		API_TABLE_STYLE,
		apiPropsGridClass,
		apiTableHeaderClass,
		apiTableShellClass
	} from './table-layout';
	import type { PropRow } from './types';

	let { props, partId }: { props: PropRow[]; partId?: string } = $props();

	const panelId = $props.id();
	/** Open rows. Several may be open at once. */
	let expanded = $state<Record<string, boolean>>({});

	/** Collapsed Type column: match the original docs' short forms. */
	function shortType(type: string): string {
		const t = type.trim();
		if (!t) return '—';
		if (t.includes('=>') || /^\(\s*\)/.test(t) || t.startsWith('function')) return 'function';
		if (t.length > 40) return `${t.slice(0, 37)}…`;
		return t;
	}
</script>

{#snippet detail(label: string, align: 'start' | 'center', body: import('svelte').Snippet)}
	<div class={[apiPropsGridClass, align === 'center' ? 'items-center' : 'items-start']}>
		<dt
			class={[
				'text-[13px] leading-6 text-neutral-500 dark:text-neutral-400',
				align === 'start' && 'pt-0.5'
			]}
		>
			{label}
		</dt>
		<dd class="col-span-3 min-w-0 text-[13px] leading-6 text-neutral-800 dark:text-neutral-100">
			{@render body()}
		</dd>
	</div>
{/snippet}

{#if props.length === 0}
	<p class="text-sm text-neutral-500">This part has no custom props.</p>
{:else}
	<div class={apiTableShellClass} style={API_TABLE_STYLE} role="table" aria-label="Props">
		<div role="row" class={[apiPropsGridClass, apiTableHeaderClass]}>
			<div role="columnheader">Prop</div>
			<div role="columnheader">Type</div>
			<div role="columnheader">Default</div>
			<div role="columnheader" class="sr-only">Expand</div>
		</div>

		<div class="w-full">
			{#each props as prop, i (prop.name)}
				{@const anchor = partId ? `${partId}-${prop.name}` : prop.name}
				{@const displayType = shortType(prop.type)}
				{@const open = expanded[prop.name] ?? false}
				<div
					class="border-b border-neutral-200 last:border-b-0 dark:border-neutral-800"
					data-open={open ? '' : undefined}
				>
					<h3 class="m-0">
						<button
							type="button"
							id={anchor}
							aria-expanded={open}
							aria-controls="{panelId}-{i}"
							onclick={() => (expanded[prop.name] = !open)}
							class={[
								apiPropsGridClass,
								'group items-center py-3 text-left transition-colors outline-none',
								'hover:bg-neutral-50 dark:hover:bg-neutral-900/60',
								'focus-visible:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-400/40 focus-visible:ring-inset dark:focus-visible:bg-neutral-900/60'
							]}
							aria-label="Prop: {prop.name}{prop.required
								? ', required'
								: ''}, type: {displayType}{prop.default != null
								? `, default: ${prop.default}`
								: ''}"
						>
							<div
								class="min-w-0 truncate font-mono text-[13px] font-medium text-neutral-900 dark:text-neutral-50"
							>
								{prop.name}{#if prop.required}<span
										class="ml-0.5 font-normal text-red-500"
										title="Required"
										aria-hidden="true">*</span
									>{/if}
							</div>
							<div class="min-w-0 truncate"><TypeHighlight code={displayType} /></div>
							<div class="min-w-0 truncate">
								{#if prop.required || prop.default == null}
									<span class="text-neutral-400">—</span>
								{:else}
									<TypeHighlight code={prop.default} />
								{/if}
							</div>
							<ChevronDown
								aria-hidden="true"
								class="size-4 shrink-0 justify-self-end text-neutral-400 transition-transform duration-200 group-aria-expanded:rotate-180"
							/>
						</button>
					</h3>

					{#if open}
						<div
							id="{panelId}-{i}"
							role="region"
							aria-labelledby={anchor}
							class="overflow-hidden"
							transition:slide={{ duration: 200, easing: cubicOut }}
						>
							<div
								class="border-t border-neutral-200 bg-neutral-50 pt-4 pb-5 dark:border-neutral-800 dark:bg-neutral-900/80"
							>
								<dl class="space-y-3.5">
									{#snippet name()}
										<a
											href="#{anchor}"
											class="font-mono text-[13px] font-medium text-blue-600 underline decoration-blue-600/40 underline-offset-[3px] hover:decoration-blue-600 dark:text-blue-400 dark:decoration-blue-400/40 dark:hover:decoration-blue-400"
											>{prop.name}</a
										>
									{/snippet}
									{@render detail('Name', 'center', name)}

									{#if prop.description && prop.description !== '—'}
										{#snippet description()}
											<div class="text-[13px] leading-6 text-neutral-700 dark:text-neutral-200">
												<DocDescription text={prop.description} />
											</div>
										{/snippet}
										{@render detail('Description', 'start', description)}
									{/if}

									{#snippet type()}
										<div
											class="inline-block max-w-full overflow-x-auto rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
										>
											<TypeHighlight code={prop.type} class="break-words whitespace-pre-wrap" />
										</div>
									{/snippet}
									{@render detail('Type', 'center', type)}

									{#if prop.default != null}
										{#snippet fallback()}<TypeHighlight code={prop.default!} />{/snippet}
										{@render detail('Default', 'center', fallback)}
									{/if}
								</dl>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}
