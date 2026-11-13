<script lang="ts">
	import Menu from '@lucide/svelte/icons/menu';
	import GitHubIcon from '../GitHubIcon.svelte';
	import ThemeToggle from '../ThemeToggle.svelte';
	import Drawer from './Drawer.svelte';
	import SidebarNav from './SidebarNav.svelte';
	import { headerButtonClass } from './classes';
	import { GITHUB_URL, TAGLINE } from '#lib/site.js';

	let open = $state(false);
</script>

<!-- iOS 26 Safari ignores `theme-color` and tints the status bar from the
     background of a fixed/sticky element at the top of the viewport, live —
     but only when the background sits on the sticky element itself. -->
<header
	class="sticky top-0 z-40 border-b border-neutral-200 bg-white md:hidden dark:border-neutral-800 dark:bg-black"
>
	<!-- Same metrics as the landing header on mobile (px-6, 32px buttons,
	     56px row) so the wordmark doesn't shift between landing and docs. -->
	<div class="relative flex h-14 items-center justify-between gap-2 px-6">
		<a
			href="/"
			class="text-sm font-semibold tracking-tight text-neutral-900 hover:text-neutral-600 dark:text-neutral-50 dark:hover:text-neutral-300"
		>
			ramka
		</a>

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
			<button
				type="button"
				aria-label="Open navigation"
				aria-haspopup="dialog"
				aria-expanded={open}
				onclick={() => (open = true)}
				class={headerButtonClass}
			>
				<Menu class="h-4 w-4" />
			</button>
		</div>
	</div>
</header>

<Drawer bind:open title="ramka" description={TAGLINE}>
	<div data-drawer-scroll class="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-6">
		<SidebarNav onnavigate={() => (open = false)} />
	</div>
</Drawer>
