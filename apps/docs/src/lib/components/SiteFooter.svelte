<script lang="ts">
	import { GITHUB_URL, ORIGINAL_URL } from '#lib/site.js';

	const RAMKA = 'ramka - Polish for “frame”.';
	/** Anagrams of "ramka", cycled one per hover (the original's easter egg). */
	const TEASES = ['kamra - almost a camera.', 'marka - Polish for “brand”.'];
	let tease = $state<string | null>(null);
	let next = 0;
	function showNextTease() {
		tease = TEASES[next++ % TEASES.length] ?? null;
	}

	const link = 'transition hover:text-neutral-900 dark:hover:text-neutral-100';
</script>

<footer class="border-t border-neutral-200 dark:border-neutral-800">
	<div
		class="mx-auto flex w-full max-w-5xl min-w-0 flex-col gap-4 px-6 py-8 text-sm text-neutral-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between dark:text-neutral-400"
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events -->
		<p
			class="max-w-full min-w-0 cursor-default text-neutral-400 select-none dark:text-neutral-600"
			onmouseenter={showNextTease}
			onmouseleave={() => (tease = null)}
			onclick={() => (tease === null ? showNextTease() : (tease = null))}
		>
			{tease ?? RAMKA}
		</p>
		<nav class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
			<a href="/license" class={link}>License</a>
			<a href={ORIGINAL_URL} target="_blank" rel="noreferrer" class={link}>Original (React)</a>
			<a href={GITHUB_URL} target="_blank" rel="noreferrer" class={link}>GitHub</a>
		</nav>
	</div>
</footer>
