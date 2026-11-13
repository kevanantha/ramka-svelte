<script lang="ts">
	import SiteHeader from '#lib/components/SiteHeader.svelte';
	import SiteFooter from '#lib/components/SiteFooter.svelte';
	import InstallCommand from '#lib/components/InstallCommand.svelte';
	import LandingDemo from '#lib/components/LandingDemo.svelte';
	import GitHubIcon from '#lib/components/GitHubIcon.svelte';
	import { GITHUB_URL } from '#lib/site.js';
</script>

<div class="isolate flex min-h-screen flex-col">
	<SiteHeader />

	<main class="flex-1">
		<section class="mx-auto w-full max-w-3xl px-6 pt-16 text-center md:pt-24">
			<h1
				class="text-5xl font-semibold tracking-tight text-balance text-neutral-950 md:text-7xl dark:text-neutral-50"
			>
				The lightbox for&nbsp;Svelte.
			</h1>
			<p
				class="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty text-neutral-500 md:text-xl dark:text-neutral-400"
			>
				Unstyled, accessible primitives built on native scrolling and view transitions. Morph and
				swipe, out of the box.
			</p>

			<div class="mt-10 flex flex-wrap items-center justify-center gap-3">
				<a
					href={GITHUB_URL}
					target="_blank"
					rel="noreferrer"
					class="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 px-4 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-900"
				>
					<GitHubIcon class="h-4 w-4" />
					Source
				</a>
			</div>

			<div class="mt-5">
				<InstallCommand />
			</div>
		</section>

		<section class="mx-auto w-full max-w-5xl px-6 pt-16 pb-24 md:pt-24">
			<p class="mb-6 text-center text-sm text-neutral-400 dark:text-neutral-600">
				Click any image. Swipe, pinch to zoom, pull to dismiss.
			</p>
			<LandingDemo />
		</section>
	</main>

	<SiteFooter />
</div>
