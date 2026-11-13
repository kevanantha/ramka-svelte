<!-- JSDoc / docs prose with light formatting: paragraphs, `-` lists, `inline code`, **bold**, URLs. -->
<script lang="ts">
	import TypeHighlight from './TypeHighlight.svelte';
	import { docsLinkClass } from '../classes';

	let { text }: { text: string } = $props();

	type Block = { kind: 'p'; text: string } | { kind: 'ul'; items: string[] };

	function parseListItems(lines: string[]): string[] {
		const items: string[] = [];
		for (const line of lines) {
			const m = line.match(/^\s*-\s+(.*)$/);
			if (m?.[1] != null) {
				items.push(m[1].trim());
				continue;
			}
			const last = items[items.length - 1];
			if (last != null && /^\s+/.test(line)) items[items.length - 1] = `${last} ${line.trim()}`;
		}
		return items;
	}

	const blocks = $derived(
		text
			.split(/\n{2,}/)
			.map((b) => b.trim())
			.filter(Boolean)
			.map((block): Block => {
				const lines = block.split('\n');
				if (lines.some((l) => /^\s*-\s+/.test(l)))
					return { kind: 'ul', items: parseListItems(lines) };
				return { kind: 'p', text: lines.map((l) => l.trim()).join(' ') };
			})
	);

	function parts(line: string) {
		return line.split(/(`[^`]+`|\*\*[^*]+\*\*|https?:\/\/[^\s]+)/g).filter(Boolean);
	}

	/** Highlight TS-ish snippets; leave prose-y identifiers as neutral chips. */
	function looksLikeTypeOrValue(code: string): boolean {
		return (
			/['"`]|=>|\||&|<|>|\(|\)|\{|\}|\[|\]|:/.test(code) ||
			/^(true|false|null|undefined|boolean|string|number|function|void|never|any|unknown)$/.test(
				code
			) ||
			/^[A-Z][A-Za-z0-9.]*$/.test(code)
		);
	}
</script>

{#snippet inline(line: string)}
	{#each parts(line) as part, i (i)}
		{#if part.startsWith('`') && part.endsWith('`')}
			{@const code = part.slice(1, -1)}
			{#if looksLikeTypeOrValue(code)}
				<code
					class="mx-0.5 inline-block rounded-md border border-neutral-200 bg-neutral-100/80 px-1.5 py-0.5 align-baseline dark:border-neutral-700 dark:bg-neutral-900"
					><TypeHighlight {code} class="text-[0.9em]" /></code
				>
			{:else}
				<code
					class="mx-0.5 rounded-md bg-violet-50 px-1.5 py-0.5 font-mono text-[0.9em] text-violet-800 dark:bg-violet-950/60 dark:text-violet-200"
					>{code}</code
				>
			{/if}
		{:else if part.startsWith('**') && part.endsWith('**')}
			<strong class="font-semibold text-neutral-900 dark:text-neutral-50"
				>{part.slice(2, -2)}</strong
			>
		{:else if /^https?:\/\//.test(part)}
			<a href={part} class={docsLinkClass}>{part}</a>
		{:else}{part}{/if}
	{/each}
{/snippet}

{#if !text || text === '—'}
	<span class="text-neutral-400">—</span>
{:else}
	<div class="space-y-3 text-inherit">
		{#each blocks as block, i (i)}
			{#if block.kind === 'ul'}
				<ul class="list-disc space-y-1.5 pl-4 marker:text-neutral-400">
					{#each block.items as item, j (j)}
						<li class="leading-6">{@render inline(item)}</li>
					{/each}
				</ul>
			{:else}
				<p class="leading-6">{@render inline(block.text)}</p>
			{/if}
		{/each}
	</div>
{/if}
