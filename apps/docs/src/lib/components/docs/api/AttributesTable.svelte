<script lang="ts">
	import DocDescription from './DocDescription.svelte';
	import {
		API_TABLE_STYLE,
		apiAttrsGridClass,
		apiNameCellClass,
		apiTableHeaderClass,
		apiTableShellClass
	} from './table-layout';
	import type { AttrRow } from './types';

	let { attributes }: { attributes: AttrRow[] } = $props();
</script>

{#if attributes.length > 0}
	<div class={apiTableShellClass} style={API_TABLE_STYLE} role="table" aria-label="Data attributes">
		<div role="row" class={[apiAttrsGridClass, apiTableHeaderClass]}>
			<div role="columnheader">Attribute</div>
			<div role="columnheader">Description</div>
		</div>
		<div role="rowgroup">
			{#each attributes as attr (attr.name)}
				<div
					role="row"
					class={[
						apiAttrsGridClass,
						'items-start border-b border-neutral-200 py-3 last:border-b-0 dark:border-neutral-800'
					]}
				>
					<div role="cell" class={apiNameCellClass}><code>{attr.name}</code></div>
					<div
						role="cell"
						class="min-w-0 text-[13px] leading-6 text-neutral-700 dark:text-neutral-200"
					>
						<DocDescription text={attr.description} />
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}
