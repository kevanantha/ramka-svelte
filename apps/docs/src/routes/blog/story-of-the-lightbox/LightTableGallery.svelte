<!--
  The photo set for "The room was dark first": a hero shot plus a row of
  three, opening into a viewer built like the polaroid ThumbnailStrip
  recipe, then skinned as the E-Z-View slide sorter from the photos: a flat
  molded top panel holds the printed name and the controls, tiered rack
  lanes glow across the backdrop, and the thumbs are cardboard slide mounts
  standing on their own lit ledge, each window keeping its photo's real
  aspect ratio. The furniture the section is about, as chrome.

  These four are a genuine set, so unlike the article's solo Shots they
  share one Root: swipe, strip and counter work across them. Skin lives in
  `light-table.css`; labels/credits in `article-images.ts`.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import X from '@lucide/svelte/icons/x';
	import ZoomIn from '@lucide/svelte/icons/zoom-in';
	import ZoomOut from '@lucide/svelte/icons/zoom-out';
	import { triggerFocusClass } from '#lib/components/chrome.js';
	import Ext from '../Ext.svelte';
	import { LIGHT_TABLE_IMAGES } from './article-images';
	import './light-table.css';

	const [hero, ...rest] = LIGHT_TABLE_IMAGES;
	const trigger = `group relative block w-full cursor-zoom-in overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 ${triggerFocusClass}`;
</script>

<figure class="mt-8">
	<Lightbox.Root
		loop
		morphTo="closest"
		scrollTriggerIntoView={[
			{ type: 'onChange', behavior: 'instant' },
			{ type: 'onOpenComplete', behavior: 'instant' }
		]}
	>
		<div class="flex flex-col gap-3">
			<Lightbox.Trigger index={0} class={trigger}>
				{#snippet children({ image })}
					<img
						{@attach image}
						src={hero.src}
						alt={hero.alt}
						width={hero.width}
						height={hero.height}
						loading="lazy"
						draggable="false"
						class="aspect-[16/10] w-full object-cover select-none"
					/>
				{/snippet}
			</Lightbox.Trigger>
			<div class="grid grid-cols-3 gap-3">
				{#each rest as img, i (img.id)}
					<Lightbox.Trigger index={i + 1} class={trigger}>
						{#snippet children({ image })}
							<img
								{@attach image}
								src={img.src}
								alt={img.alt}
								width={img.width}
								height={img.height}
								loading="lazy"
								draggable="false"
								class="aspect-square w-full object-cover select-none"
							/>
						{/snippet}
					</Lightbox.Trigger>
				{/each}
			</div>
		</div>

		<Lightbox.Portal>
			<Lightbox.Backdrop class="lightbox-demo-backdrop lt-backdrop fixed inset-0" />
			<Lightbox.Content
				aria-label="Photos of light tables and slides"
				pullToClose
				class="lightbox-demo-content lt-viewer-content fixed inset-0 flex flex-col overscroll-contain outline-none"
			>
				<!-- Printed branding: silkscreened onto the plastic, so it lives
				     under the slides (a zoomed photo passes over it) and behind
				     the zoom shade (it dims together with the frame). Mirrors the
				     top panel's box so the two rows line up. -->
				<div
					class="lt-top-panel lightbox-demo-chrome-hide pointer-events-none absolute inset-x-0 top-0 flex items-center px-4 md:px-5"
				>
					<div class="flex min-w-0 items-baseline gap-2.5">
						<span class="lt-panel-script truncate">ramka</span><span class="lt-panel-title truncate"
							>slide sorter</span
						>
					</div>
				</div>
				<!-- Backlight dimmer: darkens the plastic behind the photo as zoom rises. -->
				<div
					aria-hidden="true"
					class="lt-zoom-shade pointer-events-none absolute inset-0 z-0"
				></div>
				<Lightbox.Slides
					aria-label="Full-size photos"
					preload={1}
					class="lightbox-demo-slides z-10 flex-1 gap-5 md:gap-0 [&::-webkit-scrollbar]:hidden"
				>
					{#each LIGHT_TABLE_IMAGES as img, i (img.id)}
						<Lightbox.Slide class="lightbox-demo-slide-pad h-full">
							<Lightbox.Item index={i} caption={img.label}>
								<Lightbox.Zoom maxZoom={4}>
									<Lightbox.Media width={img.width} height={img.height} class="lt-media">
										<img
											src={img.src}
											alt={img.alt}
											width={img.width}
											height={img.height}
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

				<!-- The sorter's flat top panel: controls only — the printed name
				     is silkscreened onto the plastic below the slides. -->
				<div
					class="lt-top-panel lightbox-demo-chrome-top lightbox-demo-chrome-hide absolute inset-x-0 top-0 z-30 flex items-center justify-end gap-3 px-4 md:px-5"
				>
					<div class="flex items-center gap-2">
						<!-- Desktop-only zoom buttons; pinch and double-tap cover touch. -->
						<Lightbox.ZoomOut class="lt-btn hidden md:inline-flex" aria-label="Zoom out">
							<ZoomOut aria-hidden="true" class="h-4 w-4" strokeWidth={2.25} />
						</Lightbox.ZoomOut>
						<Lightbox.ZoomIn class="lt-btn hidden md:inline-flex" aria-label="Zoom in">
							<ZoomIn aria-hidden="true" class="h-4 w-4" strokeWidth={2.25} />
						</Lightbox.ZoomIn>
						<Lightbox.Close class="lt-btn inline-flex" aria-label="Close">
							<X aria-hidden="true" class="h-[18px] w-[18px]" strokeWidth={2.25} />
						</Lightbox.Close>
					</div>
				</div>

				<div
					class="lightbox-demo-chrome-bottom lightbox-demo-chrome-hide pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-1 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
				>
					<Lightbox.Caption
						class="lt-viewer-caption pointer-events-auto block min-h-[1.2rem] max-w-full truncate px-4 text-center drop-shadow-[0_1px_1px_rgb(255_255_255/0.7)] dark:drop-shadow-[0_1px_2px_rgb(0_0_0/0.65)]"
					/>
					<div class="pointer-events-auto w-full min-w-0">
						<Lightbox.ThumbnailStrip class="lt-strip">
							<Lightbox.ThumbnailStripTrack aria-label="Thumbnails">
								{#each LIGHT_TABLE_IMAGES as img, i (img.id)}
									<Lightbox.Thumbnail index={i}>
										<span class="lt-window" style:--lt-ar={String(img.width / img.height)}>
											<!-- A regular image, not a bridged destination. -->
											<img src={img.src} alt="" draggable="false" />
										</span>
										<span class="lt-mount-label">{img.label}</span>
									</Lightbox.Thumbnail>
								{/each}
							</Lightbox.ThumbnailStripTrack>
						</Lightbox.ThumbnailStrip>
					</div>
				</div>
			</Lightbox.Content>
		</Lightbox.Portal>
	</Lightbox.Root>
	<figcaption class="mt-3 text-center text-[13px] leading-6 text-neutral-400 dark:text-neutral-500">
		The furniture, at work. Photos by <Ext href="https://unsplash.com/@priscilladupreez"
			>Priscilla Du Preez</Ext
		>, <Ext href="https://unsplash.com/@ninjason">Jason Leung</Ext> and <Ext
			href="https://unsplash.com/@jakubzerdzicki">Jakub Żerdzicki</Ext
		> on <Ext href="https://unsplash.com/license">Unsplash</Ext>.
	</figcaption>
</figure>
