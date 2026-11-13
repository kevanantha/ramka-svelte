<script lang="ts">
	import DocDescription from './DocDescription.svelte';
	import TypeHighlight from './TypeHighlight.svelte';
	import {
		API_TABLE_STYLE,
		apiCssVarsGridClass,
		apiNameCellClass,
		apiTableHeaderClass,
		apiTableShellClass
	} from './table-layout';
	import type { CssVarRow } from './types';

	let { variables }: { variables: CssVarRow[] } = $props();
</script>

{#if variables.length > 0}
	<div class={apiTableShellClass} style={API_TABLE_STYLE} role="table" aria-label="CSS variables">
		<div role="row" class={[apiCssVarsGridClass, apiTableHeaderClass]}>
			<div role="columnheader">Variable</div>
			<div role="columnheader">Type</div>
			<div role="columnheader">Description</div>
		</div>
		<div role="rowgroup">
			{#each variables as v (v.name)}
				<div
					role="row"
					class={[
						apiCssVarsGridClass,
						'items-start border-b border-neutral-200 py-3 last:border-b-0 dark:border-neutral-800'
					]}
				>
					<div role="cell" class={apiNameCellClass}><code>{v.name}</code></div>
					<div role="cell" class="min-w-0 truncate">
						{#if v.type}<TypeHighlight code={v.type} />{:else}<span class="text-neutral-400">—</span
							>{/if}
					</div>
					<div
						role="cell"
						class="min-w-0 text-[13px] leading-6 text-neutral-700 dark:text-neutral-200"
					>
						<DocDescription text={v.description} />
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}
