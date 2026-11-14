<!--
  A macOS Photos–style app surface: a dense grid of square thumbnails under a
  sticky toolbar. The whole page *is* the app, no docs chrome. The toolbar
  −/+ buttons change the grid density (crossfaded via a View Transition), and
  tapping any photo opens the shared docs viewer (LightboxGallery): swipe
  navigation, desktop thumbnails, a View Transition morph, pinch / scroll /
  keyboard zoom, and pull-to-dismiss.

  Rendered at two routes: photos-app (LTR) and photos-app-rtl, which passes
  dir="rtl" to show the same composition mirrored.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import Heart from '@lucide/svelte/icons/heart';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import { flushSync } from 'svelte';
	import LightboxGallery from '#lib/components/LightboxGallery.svelte';
	import { triggerFocusClass } from '#lib/components/chrome.js';
	import { ramkaPhotos } from '#lib/example-photos.js';
	import { blurPlaceholderStyle, clearBlurPlaceholder } from '#lib/blur-placeholder.js';

	let { dir = 'ltr' }: { dir?: 'ltr' | 'rtl' } = $props();

	const photos = ramkaPhotos.map((image, i) => ({
		...image,
		id: `photo-${i}`,
		alt: `Photo ${i + 1}`,
		caption: `July ${(i % 28) + 1}, 2024`,
		favorite: i === 0 || i === 15 || i === 24
	}));

	// Small toolbar buttons (grid density).
	const toolbarButton =
		'inline-flex h-7 w-7 items-center justify-center rounded-full text-neutral-600 transition hover:bg-black/5 disabled:pointer-events-none disabled:opacity-30 dark:text-neutral-300 dark:hover:bg-white/10';

	// Grid density (columns). Fewer columns = larger photos. `+` grows the
	// photos, `−` shrinks them.
	const MIN_COLUMNS = 2;
	const MAX_COLUMNS = 10;
	const DEFAULT_COLUMNS = 5;

	let columns = $state(DEFAULT_COLUMNS);

	function zoomTo(next: number) {
		const target = Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, next));
		if (target === columns) return;
		if (
			typeof document.startViewTransition !== 'function' ||
			matchMedia('(prefers-reduced-motion: reduce)').matches
		) {
			columns = target;
			return;
		}
		// The grid carries a single view-transition-name, so the browser
		// captures it as one unit and crossfades the old layout into the new
		// one. flushSync commits the column change inside the transition.
		document.startViewTransition(() => flushSync(() => (columns = target)));
	}

	/**
	 * Mirror the *document* while this page is mounted. Lightbox.Portal renders
	 * into document.body, so a `dir` on a wrapper here would mirror the grid and
	 * leave the viewer LTR. `<html dir>` reaches both, and it is what a real RTL
	 * app does. Restored on unmount so other pages don't inherit it.
	 */
	$effect.pre(() => {
		if (dir === 'ltr') return;
		const html = document.documentElement;
		const previous = html.getAttribute('dir');
		html.setAttribute('dir', 'rtl');
		return () => {
			if (previous === null) html.removeAttribute('dir');
			else html.setAttribute('dir', previous);
		};
	});
</script>

<div class="min-h-screen select-none">
	<Lightbox.Root
		loop
		{dir}
		scrollTriggerIntoView={[
			{ type: 'onChange', behavior: 'instant' },
			{ type: 'onOpenComplete', behavior: 'instant' }
		]}
		awaitImageDecode={false}
	>
		<!-- The toolbar and the grid get separate view-transition-names: one
		     shared group would stretch the snapshot when the grid height changes
		     with the column count, dragging the stuck toolbar. Named apart, the
		     toolbar stays static and layers above the grid's crossfade. -->
		<div>
			<!-- Large-title toolbar: title + count, density capsule on the end
			     side. Sticky below the mobile docs nav (top-14), at the top on md+. -->
			<div
				style:view-transition-name="photos-toolbar"
				class="pointer-events-auto sticky top-14 z-30 flex shrink-0 items-center gap-3 border-b border-black/[0.06] bg-background px-4 py-2.5 md:top-0 dark:border-white/[0.08]"
			>
				<div class="flex flex-col">
					<span
						class="text-[19px] leading-6 font-bold tracking-tight text-neutral-900 dark:text-neutral-50"
					>
						Library
					</span>
					<span class="text-[11px] leading-4 font-medium text-neutral-500 dark:text-neutral-400">
						{photos.length} Photos · July 2024
					</span>
				</div>

				<div class="flex flex-1 items-center justify-end">
					<div
						class="flex items-center gap-0.5 rounded-full bg-black/[0.05] p-0.5 dark:bg-white/[0.09]"
					>
						<button
							type="button"
							aria-label="Smaller photos"
							onclick={() => zoomTo(columns + 1)}
							disabled={columns >= MAX_COLUMNS}
							class={toolbarButton}
						>
							<Minus aria-hidden="true" class="h-4 w-4" />
						</button>
						<button
							type="button"
							aria-label="Larger photos"
							onclick={() => zoomTo(columns - 1)}
							disabled={columns <= MIN_COLUMNS}
							class={toolbarButton}
						>
							<Plus aria-hidden="true" class="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>

			<!-- Every tile is a Lightbox.Trigger, so tapping one morphs into the
			     viewer. -->
			<div
				class="grid gap-0.5"
				style:grid-template-columns="repeat({columns}, minmax(0, 1fr))"
				style:view-transition-name="photos-grid"
			>
				{#each photos as photo, i (photo.id)}
					<!-- scroll-margin clears the sticky toolbar so scrollTriggerIntoView
					     doesn't tuck a tile under it (md+; on mobile the document's
					     scroll-padding covers the docs nav). -->
					<Lightbox.Trigger
						index={i}
						class="relative block aspect-square cursor-pointer overflow-hidden bg-transparent p-0 md:scroll-mt-16 {triggerFocusClass}"
					>
						{#snippet children({ image })}
							<img
								{@attach image}
								{@attach clearBlurPlaceholder}
								src={photo.thumb}
								srcset="{photo.thumb} {photo.thumbWidth}w, {photo.src} {photo.width}w"
								sizes="{Math.round(100 / columns)}vw"
								width={photo.width}
								height={photo.height}
								alt={photo.alt}
								loading="lazy"
								decoding="async"
								style={blurPlaceholderStyle(photo)}
								class="block size-full object-cover"
							/>
							{#if photo.favorite}
								<Heart
									aria-hidden="true"
									class="pointer-events-none absolute start-1.5 bottom-1.5 h-4 w-4 fill-white text-white drop-shadow"
								/>
							{/if}
						{/snippet}
					</Lightbox.Trigger>
				{/each}
			</div>
		</div>

		<LightboxGallery items={photos} ariaLabel="Library photos" backdrop="solid">
			{#snippet slide(photo)}
				<Lightbox.Zoom maxZoom={6}>
					<Lightbox.Media
						width={photo.width}
						height={photo.height}
						class="overflow-hidden rounded-none md:rounded-lg"
					>
						<!-- No placeholder: every index has a trigger thumb, so Ramka
						     owns the open bridge. -->
						<img
							src={photo.src}
							alt={photo.alt}
							width={photo.width}
							height={photo.height}
							fetchpriority="high"
							draggable="false"
							class="select-none"
						/>
					</Lightbox.Media>
				</Lightbox.Zoom>
			{/snippet}
		</LightboxGallery>
	</Lightbox.Root>
</div>
