<script lang="ts">
	import type { PagerLink } from './types';

	let { prev, next }: { prev?: PagerLink; next?: PagerLink } = $props();

	const card =
		'rounded-2xl border border-neutral-200 px-5 py-4 transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-900';
</script>

{#snippet label(text: string, title: string)}
	<div class="text-[11px] font-medium tracking-[0.08em] text-neutral-400 uppercase">{text}</div>
	<div class="mt-1.5 text-sm font-semibold text-neutral-900 dark:text-neutral-50">{title}</div>
{/snippet}

{#if prev || next}
	<nav
		class={[
			'mt-20 grid gap-3 border-t border-neutral-200 pt-10 dark:border-neutral-800',
			prev && next ? 'sm:grid-cols-2' : 'grid-cols-1'
		]}
		aria-label="Docs pagination"
	>
		{#if prev}
			<a href={prev.href} class={card}>{@render label('Previous', prev.title)}</a>
		{:else}
			<div></div>
		{/if}
		{#if next}
			<a href={next.href} class={[card, prev && 'sm:text-right']}
				>{@render label('Next', next.title)}</a
			>
		{/if}
	</nav>
{/if}
