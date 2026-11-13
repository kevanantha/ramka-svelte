<script lang="ts">
	import DocsSection from '../DocsSection.svelte';
	import AttributesTable from './AttributesTable.svelte';
	import CssVariablesTable from './CssVariablesTable.svelte';
	import PropsTable from './PropsTable.svelte';
	import type { ApiPart } from './types';

	let { part }: { part: ApiPart } = $props();

	const h4 = 'text-xs font-semibold tracking-wider text-neutral-500 uppercase';
</script>

<DocsSection id={part.id} title={part.name} level={3}>
	<p>{part.description}</p>
	{#if part.props}
		<div class="space-y-2">
			<h4 class={h4}>Props</h4>
			<PropsTable props={part.props} partId={part.id} />
		</div>
	{/if}
	{#if part.attributes?.length}
		<div class="space-y-2">
			<h4 class={h4}>Data attributes</h4>
			<AttributesTable attributes={part.attributes} />
		</div>
	{/if}
	{#if part.cssVariables?.length}
		<div class="space-y-2">
			<h4 class={h4}>CSS variables</h4>
			<CssVariablesTable variables={part.cssVariables} />
		</div>
	{/if}
</DocsSection>
