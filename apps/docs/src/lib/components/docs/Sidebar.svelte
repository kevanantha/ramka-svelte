<script lang="ts">
	import GitHubIcon from '../GitHubIcon.svelte';
	import ThemeToggle from '../ThemeToggle.svelte';
	import SidebarNav from './SidebarNav.svelte';
	import { ghostButtonClass } from './classes';
	import { GITHUB_URL, TAGLINE } from '#lib/site.js';
</script>

<aside class="sticky top-0 hidden h-screen w-[17rem] shrink-0 p-2.5 md:block">
	<!-- macOS-style floating panel: solid gray material (no backdrop-filter on
	     this site), hairline border with a specular top highlight, soft
	     ambient shadow. -->
	<div
		class="flex h-full flex-col overflow-hidden rounded-xl border border-black/[0.07] bg-neutral-100 shadow-[inset_0_0.5px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(0,0,0,0.12)] dark:border-white/[0.08] dark:bg-neutral-900 dark:shadow-[inset_0_0.5px_0_rgba(255,255,255,0.07),0_1px_2px_rgba(0,0,0,0.4),0_12px_32px_-16px_rgba(0,0,0,0.6)]"
	>
		<div class="px-[18px] pt-4 pb-3">
			<div class="flex items-center justify-between gap-3">
				<a
					href="/"
					class="text-[15px] font-semibold tracking-tight text-neutral-900 transition-colors hover:text-neutral-600 dark:text-neutral-50 dark:hover:text-neutral-300"
				>
					ramka
				</a>
				<div class="flex items-center gap-0.5">
					<a
						href={GITHUB_URL}
						target="_blank"
						rel="noreferrer"
						aria-label="ramka on GitHub"
						class={ghostButtonClass}
					>
						<GitHubIcon class="h-4 w-4" />
					</a>
					<ThemeToggle variant="ghost" />
				</div>
			</div>
			<p
				class="mt-1.5 text-[13px] leading-relaxed text-pretty text-neutral-500 dark:text-neutral-400"
			>
				{TAGLINE}
			</p>
		</div>

		<div class="min-h-0 flex-1 scrollbar-thin overflow-y-auto px-2.5 pt-1 pb-5">
			<SidebarNav />
		</div>
	</div>
</aside>
