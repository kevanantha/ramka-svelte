<!--
  The grid renders at /examples/lightbox/url-synced-state; every photo also
  exists as its own URL under the `[[id]]` optional param,
  /examples/lightbox/url-synced-state/5, so slides are shareable,
  deep-linkable pages.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import { untrack } from 'svelte';
	import { goto, snapshot } from '$app/navigation';
	import { page } from '$app/state';
	import ExampleShell from '#lib/components/ExampleShell.svelte';
	import LightboxGallery from '#lib/components/LightboxGallery.svelte';
	import { triggerFocusClass } from '#lib/components/chrome.js';
	import { blurPlaceholderStyle, clearBlurPlaceholder } from '#lib/blur-placeholder.js';
	import '#lib/styles/masonry-grid.css';
	import '#lib/styles/ssr-no-transitions.css';
	import { BASE_PATH, GALLERY_PAGE_TITLE, galleryPhotos, photoPageTitle } from './photos';

	/**
	 * Masonry inputs (layout and rationale in masonry-grid.css). A column is
	 * 120 row-units wide, a gap 9; a tile's span is its aspect-derived height
	 * in those units plus its own bottom gap. Unit-relative, so the same span
	 * works at both breakpoints and can live in the prerendered HTML. The
	 * photos are exact 2:3 / 3:2 / 1:1 crops, so the spans are integers.
	 */
	const MASONRY_COL_UNITS = 120;
	const MASONRY_GAP_UNITS = 9;

	function masonrySpan(image: { width: number; height: number }): number {
		return Math.round((MASONRY_COL_UNITS * image.height) / image.width) + MASONRY_GAP_UNITS;
	}

	// The URL is the shareable mirror of the lightbox. A shallow navigation
	// (below) leaves `page.params` on the URL the page loaded with and reports
	// its own target in `page.shallow`, which Back/Forward also restore. So
	// this one derivation covers deep links, swipes and the Back button.
	const urlId = $derived(page.shallow ? page.shallow.params?.id : page.params.id);
	const urlIndex = $derived(galleryPhotos.findIndex((photo) => photo.id === urlId));

	// Local state is the lightbox's source of truth; the URL mirrors it.
	// Driving `open` straight from the URL would also work, but a trigger tap
	// would then wait for the routing round trip, and the library only runs
	// the view-transition morph when open flips through its own gesture path
	// (Trigger / Close / Escape / pull to dismiss). Bound props written by
	// those gestures keep that path intact.
	//
	// Deep links hydrate OPEN: the photo page is prerendered with the viewer
	// already in the HTML. That needs the portal skipped on deep-link visits
	// (`deepLinkVisit` below): `document.body` doesn't exist on the server,
	// so only an in-place viewer can be part of the server HTML.
	const initialIndex = untrack(() => urlIndex);
	let open = $state(initialIndex !== -1);
	let index = $state(initialIndex === -1 ? 0 : initialIndex);

	// Decided ONCE per mount: swapping the portal container would reparent an
	// open viewer. Deep-link visits render the viewer in place, with
	// `relative z-50` so the fixed viewer stacks above the docs page's sticky
	// mobile header (z-40); portaled hosts win by document order and must not
	// carry a z-index.
	const deepLinkVisit = initialIndex !== -1;

	// Destination blur is the one exception to "an index with a trigger image
	// gets no destination blur": on a deep-link visit there is no gesture, so
	// no decoded trigger thumb to bridge from before hydration, while the blur
	// placeholder is inline in the HTML and can paint first. Later in-session
	// opens stay bridged and sharp: the blur is gone once the image loads.
	const items = deepLinkVisit
		? galleryPhotos.map((photo) => ({ ...photo, destinationBlur: true }))
		: galleryPhotos;

	// A server-painted open viewer must not FADE in: the skin's open fades run
	// off @starting-style, which for prerendered markup applies at page load.
	// While this flag is on, a host class flattens every transition inside
	// (ssr-no-transitions.css). Removed one frame AFTER the first
	// post-hydration paint; the second rAF is guaranteed to be a frame behind
	// it.
	let ssrNoTransitions = $state(deepLinkVisit);
	$effect(() => {
		let raf = requestAnimationFrame(() => {
			raf = requestAnimationFrame(() => (ssrNoTransitions = false));
		});
		return () => cancelAnimationFrame(raf);
	});

	const portalProps = $derived(
		deepLinkVisit
			? {
					container: null,
					class: `relative z-50${ssrNoTransitions ? ' lightbox-demo-ssr-no-transitions' : ''}`
				}
			: undefined
	);

	// URL → lightbox, for the URL changing underneath us: browser
	// Back/Forward. Gesture-driven changes wrote the URL themselves (below), so
	// this no-ops for them, and prop writes never call the library's
	// callbacks, so it can't echo back into history. URL-driven flips render
	// without the morph by design: Back closing the viewer fades.
	$effect(() => {
		const next = urlIndex;
		untrack(() => {
			if (next !== -1) {
				index = next;
				open = true;
			} else {
				open = false;
			}
		});
	});

	// Back and Forward restore each entry's page scroll, as the browser does
	// for the original (SvelteKit takes scroll restoration over and leaves it
	// alone on shallow entries). So when scrollTriggerIntoView moved the grid
	// during a session, the Back that closes the viewer returns the grid to
	// where it was when the viewer opened.
	snapshot({ capture: () => scrollY, restore: (y) => scrollTo(scrollX, y) });

	// Lightbox → URL, from the gesture callbacks, never from an effect, so
	// URL-driven flips can't echo into history. `goto(…, { shallow: true })`
	// writes history and `page.shallow` without running a navigation, so the
	// viewer keeps its state mid-swipe. The bound `open` / `value` are already
	// updated when the callbacks run.
	function handleOpenChange(nextOpen: boolean) {
		if (nextOpen) {
			// Opening pushes ONE entry, so Back closes the viewer instead of
			// leaving the page.
			void goto(`${BASE_PATH}/${galleryPhotos[index]!.id}`, { shallow: true });
		} else {
			// Gesture closes REWRITE the entry instead of popping it: a
			// history.back() here would restore the popped entry's scroll in the
			// middle of the close morph. The cost is one leftover grid entry per
			// viewer session.
			void goto(BASE_PATH, { shallow: true, replace: true });
		}
	}

	const title = $derived(
		`${open ? photoPageTitle(galleryPhotos[index]!) : GALLERY_PAGE_TITLE} — ramka-svelte`
	);

	function handleValueChange(nextIndex: number) {
		// Swipes and arrow keys REPLACE the entry: no history spam. Skipped
		// while closed: a trigger tap reports its index before the open, and
		// handleOpenChange writes that URL.
		if (open) {
			void goto(`${BASE_PATH}/${galleryPhotos[nextIndex]!.id}`, {
				shallow: true,
				replace: true
			});
		}
	}
</script>

<svelte:head>
	<!-- The title follows the lightbox: shallow navigations don't rerun the
	     page, so owning the URL writes means owning the title too. -->
	<title>{title}</title>
</svelte:head>

<ExampleShell
	title="URL-synced state"
	docsHref="/docs/lightbox/state-lifecycle"
	docsLabel="State & lifecycle docs"
>
	{#snippet description()}
		Every photo in this masonry wall is its own URL, driven by a SvelteKit optional route param —
		the page lives at an [[id]] route, and the lightbox is controlled via bind:open / bind:value on
		Lightbox.Root. Tapping a tile opens the viewer and pushes /examples/lightbox/url-synced-state/5
		with SvelteKit shallow routing (goto with shallow: true), swiping rewrites that URL in place,
		and the browser Back button closes the viewer. Loading a photo URL cold serves the viewer
		already open, straight from the prerendered HTML with per-photo metadata: deep-link visits
		render the Portal in place (container: null) instead of into document.body, which is what makes
		a server-rendered open lightbox possible at all — portals cannot be serialized into server HTML.
		Because the bound props update synchronously from the gestures, trigger taps keep the
		view-transition morph.
	{/snippet}

	<!-- `count` covers the items' registration, which never runs on the server:
	     without it a prerendered open page paints the counter as "5 of 0". -->
	<Lightbox.Root
		bind:open
		onOpenChange={handleOpenChange}
		bind:value={index}
		onValueChange={handleValueChange}
		count={galleryPhotos.length}
		loop
		scrollTriggerIntoView={[
			{ type: 'onChange', behavior: 'instant' },
			{ type: 'onOpenComplete', behavior: 'instant' }
		]}
	>
		<!-- Grid-span masonry (masonry-grid.css): one DOM order for every
		     viewport, so the prerendered HTML is right at any width and Tab order
		     stays close to visual order. -->
		<div class="lightbox-demo-masonry max-w-2xl">
			<div class="lightbox-demo-masonry-grid">
				{#each galleryPhotos as tile, tileIndex (tile.id)}
					<!-- The gap MUST be margin, not padding: the trigger is the morph
					     target, and padding would grow its box past the image. -->
					<Lightbox.Trigger
						index={tileIndex}
						class="block w-full cursor-pointer overflow-hidden rounded-xl border-none bg-transparent p-0 {triggerFocusClass}"
						style="grid-row-end: span {masonrySpan(
							tile
						)}; margin-bottom: calc(var(--masonry-unit) * {MASONRY_GAP_UNITS});"
					>
						{#snippet children({ image })}
							<img
								{@attach image}
								{@attach clearBlurPlaceholder}
								src={tile.src}
								alt={tile.alt}
								width={tile.width}
								height={tile.height}
								loading="lazy"
								decoding="async"
								style={blurPlaceholderStyle(tile)}
								class="block h-full w-full rounded-xl bg-neutral-100 object-cover transition duration-200 hover:opacity-90 dark:bg-neutral-800"
							/>
						{/snippet}
					</Lightbox.Trigger>
				{/each}
			</div>
		</div>

		<!-- captionFallback: items register captions in effects, which never run
		     on the server, so a deep-link visit would paint an empty placard.
		     ssrSlideShift paints the deep-linked slide, not slide 0, before
		     hydration (inert for regular visits). -->
		<LightboxGallery
			{items}
			ariaLabel="Gallery photos"
			backdrop="solid"
			captionFallback={deepLinkVisit ? galleryPhotos[index]?.caption : undefined}
			ssrSlideShift
			{portalProps}
		/>
	</Lightbox.Root>
</ExampleShell>
