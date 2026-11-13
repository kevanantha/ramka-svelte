<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import { tokenClass, tokenize } from './type-tokens';

	let { code, class: className }: { code: string; class?: ClassValue } = $props();
</script>

<code class={['font-mono text-[13px] leading-snug', className]}
	>{#each tokenize(code) as t, i (i)}<span class={tokenClass[t.kind]}>{t.value}</span>{/each}</code
>
