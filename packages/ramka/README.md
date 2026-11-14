# ramka-svelte

**The lightbox for Svelte.** Unstyled, accessible lightbox primitives for Svelte 5, built on native scrolling and view transitions. Morph, swipe, zoom, and pull-to-dismiss, all out of the box.

A port of [ramka](https://github.com/arturbien/ramka) by Artur Bień. _ramka_ is Polish for "frame".

**[Documentation](https://ramka-svelte.vercel.app)** · [GitHub](https://github.com/kevanantha/ramka-svelte)

## Install

```bash
pnpm add ramka-svelte
```

Requires Svelte 5.40 or later.

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

The parts are unstyled: bring your own CSS. The [documentation](https://ramka-svelte.vercel.app/docs) covers every part, styling, view transitions, gestures, zoom, RTL, CSP and server rendering, with presets to copy.

## Coming from ramka for React

The parts, props and behavior are ramka's, in Svelte idioms:

- `open` and `value` are bindable (`bind:open`, `bind:value`). The `onOpenChange`, `onOpenChangeComplete` and `onValueChange` callbacks still exist.
- Render functions are snippets, and `imageRef` / `morphRef` are the attachments `image` / `morph`: `{@attach image}` instead of `ref={imageRef}`.
- Parts take a bindable `ref` for their element. `bind:this` on `Zoom` gives the `LightboxZoomRef` handle.
- Bugs in the original are fixed rather than copied. For example, without `maxZoom` every slide caps at its image's natural size.

## License

[MIT](./LICENSE), with Artur Bień's copyright from the original. See [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md).
