<script lang="ts">
	import GitHubIcon from './GitHubIcon.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { GITHUB_URL } from '#lib/site.js';
</script>

<header class="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3 md:py-5">
	<span class="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
		ramka
	</span>
	<div class="flex items-center gap-2">
		<a
			href={GITHUB_URL}
			target="_blank"
			rel="noreferrer"
			aria-label="ramka on GitHub"
			class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
		>
			<GitHubIcon class="h-4 w-4" />
		</a>
		<ThemeToggle />
	</div>
</header>
