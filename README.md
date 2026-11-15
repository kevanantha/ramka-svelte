# ramka-svelte

[![npm](https://img.shields.io/npm/v/ramka-svelte)](https://www.npmjs.com/package/ramka-svelte)

**The lightbox for Svelte.** A Svelte 5 port of [ramka](https://github.com/arturbien/ramka) by Artur Bień: unstyled, accessible gallery primitives with shared-element View Transitions and native scroll swiping.

> _ramka_ — Polish for "frame".

**[Documentation](https://ramka-svelte.vercel.app)** · [npm](https://www.npmjs.com/package/ramka-svelte)

## Install

```bash
pnpm add ramka-svelte
```

Requires Svelte 5.40 or later.

## Status

Every part, guide, preset and example on [ramka.dev](https://ramka.dev) is ported, and the docs site at [ramka-svelte.vercel.app](https://ramka-svelte.vercel.app) is the Svelte version of it. ramka's own test suites are ported with the original titles and assertions: 796 vitest cases, and 106 Playwright cases on the original's five projects (desktop Chromium, WebKit and Firefox, plus emulated Pixel 7 and iPhone 15).

What's in the box:

- **Dialog and slides.** `Root`, `Trigger`, `Portal`, `Backdrop`, `Content`, `Close`, `Slides`, `Slide`, `Item`, `Media`, on native CSS scroll snapping.
- **Morph view transitions** from the trigger to the slide and back, with the original's timing presets and fallbacks.
- **Zoom.** `Zoom`, `ZoomIn`, `ZoomOut`: pinch, double-tap/click, ctrl/trackpad wheel, drag with momentum, and keyboard.
- **Pull to dismiss**, on touch and two-finger trackpad swipes.
- **Chrome.** `Previous`, `Next`, `Counter`, `Caption`, `ThumbnailGroup`, `Thumbnail`, `ThumbnailStrip`, `ThumbnailStripTrack`.
- **Layout.** `Stage` for side panels next to the media.
- **Control.** `createHandle()` for imperative control and `CSPProvider` for nonces.
- **Server rendering.** Viewers can be server-rendered already open, so deep links paint the right slide before hydration.

Bugs in the original are fixed rather than copied:

- **Zoom limit.** Without `maxZoom`, every slide caps at its image's natural size. The original falls back to 4× after a slide change.
- **Intercepted routes.** The intercepted-routes example follows the URL rather than Next's router cache.
- **Slide numbers.** The dynamic-items debug page numbers new slides in order.

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
							<Lightbox.Zoom>
								<Lightbox.Media width={item.width} height={item.height}>
									<img src={item.src} alt={item.alt} />
								</Lightbox.Media>
							</Lightbox.Zoom>
						</Lightbox.Item>
					</Lightbox.Slide>
				{/each}
			</Lightbox.Slides>
			<Lightbox.Close aria-label="Close" />
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
```

The parts are unstyled. The [documentation](https://ramka-svelte.vercel.app/docs) covers styling, view transitions, gestures, zoom, RTL, CSP and server rendering, with presets to copy.

Differences from the React API:

- `open` and `value` are bindable (`bind:open`, `bind:value`) instead of `open` / `defaultOpen` / `onOpenChange` pairs. The `onOpenChange`, `onOpenChangeComplete` and `onValueChange` callbacks still exist.
- Render functions are snippets, and `imageRef` / `morphRef` are attachments named `image` / `morph`: `{@attach image}` instead of `ref={imageRef}`.
- Parts take a bindable `ref` (`bind:ref`) for their element, and `bind:this` on `Zoom` gives the `LightboxZoomRef` handle. Wrappers read state with `getLightboxContext()`.
- `Media` resolves its fit-box against the nearest size container, normally `Lightbox.Zoom` (Item → Zoom → Media, as in the original). Without Zoom, give the `Item` `container-type: size`.

## Development

This is a pnpm workspace:

- [`packages/ramka`](./packages/ramka): the library (`ramka-svelte`), built with `svelte-package`.
- [`apps/docs`](./apps/docs): the SvelteKit + Tailwind v4 site, built with `adapter-static` and deployed to Vercel on every push to `main`.

```bash
pnpm install
pnpm build      # package the library, then build the docs site
pnpm check      # svelte-check both workspaces
pnpm test       # unit tests (vitest + jsdom)
pnpm test:e2e   # browser tests against the build above (first run: pnpm exec playwright install --with-deps)
```

`.amp/services.yaml` runs the docs dev server. The docs import the library from `packages/ramka/src/lib` (a SvelteKit alias), so library edits hot-reload without packaging. The `/debug/*` pages are dev-only, as on ramka.dev. [`e2e/README.md`](./e2e/README.md) lists where the e2e suite differs from the original's.

## License

[MIT](./LICENSE), with Artur Bień's copyright from the original. Demo photos come from the original docs (Unsplash license via picsum.photos).
