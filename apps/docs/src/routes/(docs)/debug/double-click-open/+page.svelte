<!--
  Debug: double-click preview + accessible single-pointer open control.
  Port of the original docs' app/(docs)/debug/double-click-open.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import X from '@lucide/svelte/icons/x';
	import ZoomIn from '@lucide/svelte/icons/zoom-in';
	import ZoomOut from '@lucide/svelte/icons/zoom-out';
	import { chromeButton, chromeButtonMd } from '#lib/components/chrome.js';
	import DoubleClickTile from './DoubleClickTile.svelte';

	function photo(id: string, width: number, height: number, alt: string, caption: string) {
		const file = `ramka-${id}.jpg`;
		return {
			id,
			src: `/photos/${file}`,
			thumb: `/photos/thumbs/${file}`,
			width,
			height,
			alt,
			caption
		};
	}

	const PHOTOS = [
		photo('dbl-a', 1400, 900, 'Coastal cliffs at dusk', 'Coastal cliffs at dusk'),
		photo('dbl-b', 900, 1400, 'Forest trail in morning light', 'Forest trail'),
		photo('dbl-c', 1200, 1200, 'City skyline reflection', 'City skyline'),
		photo('dbl-d', 1600, 900, 'Desert highway', 'Desert highway'),
		photo('dbl-e', 1000, 1250, 'Harbor boats at blue hour', 'Harbor at blue hour'),
		photo('dbl-f', 1300, 975, 'Mountain lake panorama', 'Mountain lake')
	];

	const handle = Lightbox.createHandle();
</script>

<svelte:head>
	<title>Double-click to open (accessible) — ramka-svelte</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
	<header>
		<p
			class="text-[11px] font-semibold tracking-widest text-amber-700 uppercase dark:text-amber-400"
		>
			Debug · development only
		</p>
		<h1 class="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
			Double-click to open (accessible)
		</h1>
		<p class="mt-3 max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
			Custom open gestures use <code class="text-sm">Lightbox.createHandle()</code> and
			<code class="text-sm">handle.open(index, {'{ triggerId }'})</code> — not overlays or synthetic
			clicks. Each tile keeps a real <code class="text-sm">Lightbox.Trigger</code>
			as the single-pointer control (WCAG 2.5.1); double-click on the preview is an optional pointer shortcut.
		</p>
	</header>

	<section class="space-y-3">
		<h2 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">What to verify</h2>
		<ul class="list-disc space-y-1 pl-5 text-sm text-neutral-600 dark:text-neutral-400">
			<li>Single click on the photo preview does nothing</li>
			<li>
				The preview hides while it carries <code class="text-xs">data-morph-target</code>
				(library-injected hide — no consumer CSS needed)
			</li>
			<li>
				Each <strong class="font-medium text-neutral-800 dark:text-neutral-200">Open …</strong>
				button opens on single click, Enter, and Space
			</li>
			<li>Closing returns focus to the Open button that owns that tile's trigger id</li>
			<li>Touch / single-tap users can open via the Open button (no double-click required)</li>
		</ul>
	</section>

	<section
		class="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 text-sm leading-relaxed text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300"
	>
		<p class="font-medium text-neutral-900 dark:text-neutral-100">Accessibility pattern</p>
		<ul class="mt-2 list-disc space-y-1 pl-5">
			<li>
				<strong class="font-medium text-neutral-900 dark:text-neutral-100">WCAG 2.5.1</strong>
				— double-click alone is not sufficient; the labeled
				<code class="text-xs">Lightbox.Trigger</code> button is the single-pointer alternative.
			</li>
			<li>
				Preview uses <code class="text-xs">role="group"</code> + screen-reader label; the decorative
				image is <code class="text-xs">aria-hidden</code>.
			</li>
			<li>
				The trigger's <code class="text-xs">morph</code> attachment points at the visible preview;
				the library sets <code class="text-xs">data-morph-target</code> there and hides it while the morph
				runs.
			</li>
			<li>
				Default <code class="text-xs">Lightbox.Trigger</code> (single click) remains the recommended production
				default when no custom gesture is required.
			</li>
		</ul>
	</section>

	<Lightbox.Root {handle} loop morphTo="closest" viewTransition>
		<div class="grid max-w-lg grid-cols-2 gap-4 sm:grid-cols-3">
			{#each PHOTOS as item, i (item.id)}
				<DoubleClickTile {handle} photo={item} index={i} />
			{/each}
		</div>
		<p class="mt-3 text-xs text-neutral-500">
			{PHOTOS.length} tiles · double-click preview or use each Open button
		</p>

		<Lightbox.Portal>
			<Lightbox.Backdrop
				class="lightbox-demo-backdrop lightbox-demo-backdrop-light fixed inset-0"
			/>
			<Lightbox.Content
				aria-label="Double-click open debug gallery"
				pullToClose
				class="lightbox-demo-content fixed inset-0 flex flex-col overscroll-contain outline-none"
			>
				<Lightbox.Slides
					aria-label="Full-size images"
					preload={1}
					class="lightbox-demo-slides flex-1 gap-5 md:gap-0 [&::-webkit-scrollbar]:hidden"
				>
					{#each PHOTOS as item, i (item.id)}
						<Lightbox.Slide class="lightbox-demo-slide-pad h-full">
							<Lightbox.Item index={i} caption={item.caption ?? item.alt}>
								<Lightbox.Zoom maxZoom={4}>
									<Lightbox.Media
										width={item.width}
										height={item.height}
										class="overflow-hidden rounded-none md:rounded-lg"
									>
										<img
											src={item.src}
											alt={item.alt}
											width={item.width}
											height={item.height}
											loading="eager"
											draggable="false"
											class="select-none"
										/>
									</Lightbox.Media>
								</Lightbox.Zoom>
							</Lightbox.Item>
						</Lightbox.Slide>
					{/each}
				</Lightbox.Slides>

				<div
					class="lightbox-demo-chrome-top lightbox-demo-chrome-hide absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] left-3 z-30"
				>
					<Lightbox.Counter
						class="min-w-[3.5rem] font-mono text-sm text-black/70 tabular-nums dark:text-white/70"
					/>
				</div>

				<div
					class="lightbox-demo-chrome-top lightbox-demo-chrome-hide absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] right-3 z-30 flex gap-2"
				>
					<Lightbox.ZoomOut class={chromeButtonMd} aria-label="Zoom out">
						<ZoomOut aria-hidden="true" class="h-4 w-4" strokeWidth={2.25} />
					</Lightbox.ZoomOut>
					<Lightbox.ZoomIn class={chromeButtonMd} aria-label="Zoom in">
						<ZoomIn aria-hidden="true" class="h-4 w-4" strokeWidth={2.25} />
					</Lightbox.ZoomIn>
					<Lightbox.Close class={chromeButton} aria-label="Close">
						<X aria-hidden="true" class="h-[18px] w-[18px]" strokeWidth={2.25} />
					</Lightbox.Close>
				</div>

				<div
					class="lightbox-demo-chrome-bottom lightbox-demo-chrome-hide pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-3 px-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
				>
					<Lightbox.Caption
						class="pointer-events-auto block min-h-[1.25rem] max-w-full truncate px-6 text-center text-sm text-black/70 dark:text-white/80"
					/>
				</div>
			</Lightbox.Content>
		</Lightbox.Portal>
	</Lightbox.Root>
</div>
