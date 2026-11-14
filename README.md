# ramka-svelte

**The lightbox for Svelte.** A Svelte 5 port of [ramka](https://github.com/arturbien/ramka) by Artur Bień: unstyled, accessible gallery primitives with shared-element View Transitions and native scroll swiping.

> _ramka_ — Polish for "frame".

## Status

Work in progress. Ported so far:

- **Morph view transitions.** The original's morph engine (`view-transition-morph.ts`, composited morph, timing presets, name isolation, touch guard), driven by Svelte's `flushSync` and reading the lightbox through live getters.
- **Native scrolling.** `Slides` / `Slide` ride CSS scroll snapping, with the original's fling lock, `scrollend` settle and resize re-parking.
- **Dialog shell.** `Root`, `Trigger`, `Portal`, `Backdrop`, `Content` (focus trap, Escape, arrow / Home / End keys, scrim click), `Close`.
- **Media.** `Item` (preload window, tab/tabpanel or slide ARIA, canvas placeholder bridge), `Media` (fit-box sizing).
- **Chrome.** `Previous`, `Next`, `Counter`, `Caption`, `ThumbnailGroup`, `Thumbnail`.
- **Zoom.** `Zoom`, `ZoomIn`, `ZoomOut`: pinch, double-tap/click, ctrl/trackpad wheel, drag with momentum and rubber-banding, and `+` `-` `0` / arrow keys through `Content`. The gesture maths, pose controller and zoom session are the original's; the engine loads as a separate chunk, as in the original. One deliberate difference: without a `maxZoom` prop, every slide caps at its image's natural size. The original does that only for the first slide it opens on; after a slide change it falls back to 4×, because the cleared image size is never re-detected for an already-loaded image.
- **Pull to dismiss.** Drag the image down (touch, or a two-finger trackpad swipe) to close; a short pull springs back on a velocity-aware spring. `Content` publishes `--lightbox-pull-progress` and the snap-back's `--lightbox-pull-snap-duration` / `--lightbox-pull-snap-easing` on itself and `Backdrop`, with `data-pulling`, `data-pull-snapping` and `data-pull-dismissing` for styling. `pullToClose={false}` turns it off and skips its chunk.
- **Imperative handle.** `createHandle()` for `Root` and `Trigger`: `open(index, { triggerId })`, `close()`, `goTo()` and a reactive `isOpen`, with Triggers inside the Root or detached from it.
- **Server-rendered open viewers.** With `Portal container={null}` a deep link can be server-rendered (or prerendered) already open. The active item is stamped `data-ssr-active` for `scroll-initial-target`, and `Slides ssrSlideShift` translates the track, so the first paint shows the right slide before hydration in any browser. The active trigger is stamped `data-morph-target`. The first-paint rules ship as `<style>` tags in the head, and `CSPProvider` stamps them with the page's CSP nonce.
- **Development warnings.** Unnamed parts (`Close`, `Previous`, `Next`, `ZoomIn`, `ZoomOut`, `Item`), a `dir` that disagrees with the scroller's CSS direction, and handle calls before a Root is mounted.
- **Stage.** `Stage` scopes pull to dismiss, zoom pan bounds and wheel / pinch, and the media keys (arrows, Home / End, `+` `-` `0`) to the media pane, so side panels beside it keep native scroll and their own keys. Its snippet's `morph` attachment (also on `getLightboxStageContext()`) makes one element the shared open/close morph destination, such as a 9:16 stories frame.
- **Docs presets.** `/presets/default` (Tailwind and CSS variants behind a toggle), `/presets/store`, `/presets/stories`, `/presets/editorial` (article figures with a caption + credit block) and `/presets/twitter` (split media pane + thread sidebar, mobile engagement bar and thread sheet, `+N` crossfade tile, reply opens via `createHandle`), with the preset page scaffolding (title, live demo, file tabs with highlighted source and copy).
- **Thumbnail strip.** `ThumbnailStrip` + `ThumbnailStripTrack`: the active thumbnail stays centered under the strip's midline, linked to `Slides` by a native `ScrollTimeline` (a measured JS scroll mirror for variable-width slides, while zoomed, or where `ScrollTimeline` is missing). Thumbnail clicks, tablist arrows, `Content` keys and `Previous` / `Next` scrub the track (`scrubOnSelect`); thumbnail clicks also crossfade the stage with an element-scoped view transition on `Slides` (`selectViewTransition`, tuned by `--lightbox-select-vt-duration` / `--lightbox-select-vt-easing`), and `wrapSelectCommit` wraps the index commit. The strip publishes `data-scrubbing`, `data-positioned` and `--lightbox-thumbnail-strip-travel`, and keeps the active thumbnail centered when items are added or removed while it is open.
- **Docs examples.** `/examples/lightbox/text-message` (one Trigger over an attachment stack, `morphTo="origin"`), `/examples/lightbox/film-trailers` (posters morphing into autoplaying videos) and `/examples/lightbox/3d-models` (three.js canvases in trigger and slide, `onBeforeOpen` waiting for the slide's first frame).
- **Lightbox examples.** `/examples/lightbox/photos-app` and its mirrored `photos-app-rtl`, `infinite-scroll` (a feed and viewer that paginate together), `url-synced-state` (an `[[id]]` route with every photo prerendered as a deep link that opens the viewer, and swipes and Back kept in the URL with shallow routing) and `intercepted-routes` (links that open a modal viewer over the grid through shallow routing, and a standalone `photos/[id]` page for reloads and shared links).
- **Blog.** `/blog/story-of-the-lightbox`, `/blog/headless-lightbox`, `/blog/why-native-scrolling` and `/blog/lightbox-accessibility`, with all their demos: the 2005 lightbox, the clone marquee, the anatomy diagram, the light-table slide sorter (a ThumbnailStrip skin), the jank playground and momentum lab, the focus-trap and screen-reader simulators, and the chrome builder on the twitter preset. Code samples that show ramka's API use Svelte syntax and are highlighted at prerender.
- **License pages.** `/license` (the MIT text) and `/license/notices`, rendered from `packages/ramka/THIRD-PARTY-NOTICES.md`, which now ships in the package with `LICENSE`.
- **Unit tests.** ramka's vitest suite, ported to `@testing-library/svelte` on jsdom (`pnpm test`): 796 cases, all passing. Titles and assertions are the original's; files the original runs under node render with `svelte/server`. The React-only `react-compat` / `render/*` suites map onto `bind:ref`, attachments, rest props and snippets in `render-mechanisms.test.ts`.
- **Debug pages.** Dev-only, as on ramka.dev: production answers 404 and the static build writes no HTML for them. `/debug/double-click-open`, `/debug/dynamic-items` (slides added and removed while the viewer is open), `/debug/heavy-feed`, `/debug/lightbox-overlays` (tooltip, menu and nested dialogs stacked on the viewer), `/debug/media-stretch`, `/debug/minimal-composition`, `/debug/moodboard-snug` (three.js models), `/debug/morph-easter-eggs`, `/debug/real-estate-listing` and `/debug/vt-motion`. The `/api/slow-image` delay endpoint is Vite middleware, so it answers in `vite dev` and `vite preview` and returns 404 on a static host.
- **Docs site and guides.** The docs shell (sidebar, mobile nav drawer, pager, Shiki code blocks with copy, live demo + code frames, API tables) and every guide under `/docs`: installation, the lightbox overview, state & lifecycle, composition, SvelteKit images (the original's Next.js Image guide, rebuilt on `@sveltejs/enhanced-img`), view transitions, gestures, zoom & a11y, RTL, CSP and the API reference. Code samples are type-checked Svelte files; the API reference is generated from the components' props (`pnpm --filter docs docs:api`).
- **End-to-end tests.** ramka's Playwright suite (`e2e/`, `pnpm test:e2e`): morph, zoom, carousel, RTL, the low-end fallback and the mobile morph, touch swipe and pull to dismiss, on the original's five projects (desktop Chromium, WebKit and Firefox, plus emulated Pixel 7 and iPhone 15), with no retries, against the production build served by `vite preview`. Titles and assertions are the original's; [`e2e/README.md`](./e2e/README.md) lists where it differs from the original suite.

## Usage

```svelte
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	let { items } = $props();
</script>

<Lightbox.Root>
	{#each items as item, i}
		<Lightbox.Trigger index={i}>
			{#snippet children({ image })}
				<img {@attach image} src={item.thumb} alt={item.alt} />
			{/snippet}
		</Lightbox.Trigger>
	{/each}

	<Lightbox.Portal>
		<Lightbox.Backdrop />
		<Lightbox.Content aria-label="Photo viewer">
			<Lightbox.Slides aria-label="Photos">
				{#each items as item, i}
					<Lightbox.Slide>
						<Lightbox.Item index={i} caption={item.caption}>
							<Lightbox.Media width={item.width} height={item.height}>
								<img src={item.src} alt={item.alt} />
							</Lightbox.Media>
						</Lightbox.Item>
					</Lightbox.Slide>
				{/each}
			</Lightbox.Slides>
			<Lightbox.Close aria-label="Close" />
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
```

Differences from the React API:

- `open` and `value` are bindable (`bind:open`, `bind:value`) instead of `open` / `defaultOpen` / `onOpenChange` pairs. The `onOpenChange`, `onOpenChangeComplete` and `onValueChange` callbacks still exist.
- Render functions are snippets, and `imageRef` / `morphRef` are attachments named `image` / `morph`: `{@attach image}` instead of `ref={imageRef}`.
- Parts take a bindable `ref` (`bind:ref`) for their element, and wrappers read state with `getLightboxContext()` (built on `createContext`, so Svelte ≥ 5.40).
- `Media` resolves its fit-box against the nearest size container, normally `Lightbox.Zoom` (Item → Zoom → Media, as in the original). Without Zoom, give the `Item` `container-type: size`.

## Development

This is a pnpm workspace:

- [`packages/ramka`](./packages/ramka): the library (`ramka-svelte`), built with `svelte-package`.
- [`apps/docs`](./apps/docs): the SvelteKit + Tailwind v4 site, built with `adapter-static`.

```bash
pnpm install
pnpm build      # package the library, then build the docs site
pnpm check      # svelte-check both workspaces
pnpm test       # unit tests (vitest + jsdom)
pnpm test:e2e   # browser tests against the build above (first run: pnpm exec playwright install --with-deps)
```

`.amp/services.yaml` runs the docs dev server. The docs import the library from `packages/ramka/src/lib` (a SvelteKit alias), so library edits hot-reload without packaging.

## License

[MIT](./LICENSE), same as the original. Demo photos come from the original docs (Unsplash license via picsum.photos).
