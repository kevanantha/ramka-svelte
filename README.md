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
- **Docs presets.** `/presets/store`, `/presets/stories`, `/presets/editorial` (article figures with a caption + credit block) and `/presets/twitter` (split media pane + thread sidebar, mobile engagement bar and thread sheet, `+N` crossfade tile, reply opens via `createHandle`), with the preset page scaffolding (title, live demo, file tabs with highlighted source and copy).
- **Thumbnail strip.** `ThumbnailStrip` + `ThumbnailStripTrack`: the active thumbnail stays centered under the strip's midline, linked to `Slides` by a native `ScrollTimeline` (a measured JS scroll mirror for variable-width slides, while zoomed, or where `ScrollTimeline` is missing). Thumbnail clicks, tablist arrows, `Content` keys and `Previous` / `Next` scrub the track (`scrubOnSelect`); thumbnail clicks also crossfade the stage with an element-scoped view transition on `Slides` (`selectViewTransition`, tuned by `--lightbox-select-vt-duration` / `--lightbox-select-vt-easing`), and `wrapSelectCommit` wraps the index commit. The strip publishes `data-scrubbing`, `data-positioned` and `--lightbox-thumbnail-strip-travel`.
- **Docs examples.** `/examples/lightbox/text-message` (one Trigger over an attachment stack, `morphTo="origin"`), `/examples/lightbox/film-trailers` (posters morphing into autoplaying videos) and `/examples/lightbox/3d-models` (three.js canvases in trigger and slide, `onBeforeOpen` waiting for the slide's first frame).

Not ported yet: the other docs pages and presets, and tests.

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
pnpm build   # package the library, then build the docs site
pnpm check   # svelte-check both workspaces
```

`.amp/services.yaml` runs the docs dev server. The docs import the library from `packages/ramka/src/lib` (a SvelteKit alias), so library edits hot-reload without packaging.

## License

[MIT](./LICENSE), same as the original. Demo photos come from the original docs (Unsplash license via picsum.photos).
