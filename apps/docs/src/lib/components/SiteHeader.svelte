<!--
  Header for pages outside the docs shell, which have no sidebar to carry the
  wordmark and theme toggle. `home` links the wordmark to the landing page
  (off on the landing page itself).
-->
<script lang="ts">
	import GitHubIcon from './GitHubIcon.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { headerButtonClass } from './docs/classes';
	import { GITHUB_URL } from '#lib/site.js';

	let { home = false }: { home?: boolean } = $props();

	const wordmark = 'text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50';
</script>

<!-- Mobile padding matches the docs mobile nav (56px row) so the wordmark
     doesn't shift between pages. -->
<header class="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3 md:py-5">
	{#if home}
		<a
			href="/"
			class="{wordmark} transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
			>ramka</a
		>
	{:else}
		<span class={wordmark}>ramka</span>
	{/if}
	<div class="flex items-center gap-2">
		<a
			href={GITHUB_URL}
			target="_blank"
			rel="noreferrer"
			aria-label="ramka on GitHub"
			class={headerButtonClass}
		>
			<GitHubIcon class="h-4 w-4" />
		</a>
		<ThemeToggle />
	</div>
</header>
