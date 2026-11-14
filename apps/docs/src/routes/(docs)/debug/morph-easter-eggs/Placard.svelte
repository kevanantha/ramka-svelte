<!-- Museum placard under an exhibit. -->
<script lang="ts">
	let { title, lines }: { title: string; lines: string[] } = $props();
</script>

<div
	class="mx-auto mt-6 w-fit max-w-sm rounded-[3px] bg-[#f5f3ec] px-4 py-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.5)]"
>
	<p class="font-serif text-[13px] leading-snug font-semibold text-neutral-900 italic">{title}</p>
	{#each lines as line (line)}
		<p class="mt-0.5 font-serif text-[12px] leading-snug text-neutral-600">{line}</p>
	{/each}
</div>
