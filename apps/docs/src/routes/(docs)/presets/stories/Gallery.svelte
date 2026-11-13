<!--
  Stories lightbox: design-system package entry (copy with lightbox.css).

  Instagram-style vertical stories: circular avatar triggers dissolve into a
  9:16 card via `crossfade`, then swipe between stories with a CSS
  scroll-driven rotateY (view-timeline) page-turn. No zoom: swipe / arrows
  to browse, pull down to dismiss.

  Place it under `Lightbox.Root`, beside your triggers (give them the
  `stl-trigger` class), and pass `onBeforeClose={pauseStoryVideos}` to the
  Root so the close snapshot freezes the frame that is showing.
-->
<script lang="ts" module>
	import type { LightboxBeforeCloseContext } from 'ramka-svelte/lightbox';

	/** Item shape for the gallery: pass the real intrinsic pixel size. */
	export type StoryItem = {
		id?: string | number;
		name: string;
		avatar: string;
		video: string;
		poster: string;
		alt: string;
		/** Relative time shown in the story HUD, e.g. “2h”. */
		time?: string;
		width: number;
		height: number;
	};

	/** Root `onBeforeClose`: pause every story video before the close snapshot. */
	export function pauseStoryVideos({ destination }: LightboxBeforeCloseContext) {
		const scope = destination?.closest('[data-ramka-content]') ?? destination;
		for (const video of scope?.querySelectorAll('video') ?? []) video.pause();
	}
</script>

<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import * as Lightbox from 'ramka-svelte/lightbox';
	import { getLightboxContext } from 'ramka-svelte';
	import './lightbox.css';

	let { items, ariaLabel }: { items: StoryItem[]; ariaLabel: string } = $props();

	const lightbox = getLightboxContext();
	const multiple = $derived(items.length > 1);

	/**
	 * Plays while its slide is active and the viewer is open; pauses in place
	 * otherwise, and while the story is being pulled down.
	 */
	function playback(active: boolean): Attachment<HTMLVideoElement> {
		return (video) => {
			const open = lightbox.open;
			const content = lightbox.dialogElement;
			const sync = () => {
				const pulling =
					!!content &&
					(content.hasAttribute('data-pulling') || content.hasAttribute('data-pull-dismissing'));
				if (active && open && !pulling) video.play().catch(() => {});
				else video.pause();
			};
			sync();
			if (!content) return;
			const observer = new MutationObserver(sync);
			observer.observe(content, {
				attributes: true,
				attributeFilter: ['data-pulling', 'data-pull-dismissing']
			});
			return () => observer.disconnect();
		};
	}
</script>

{#snippet hud(item: StoryItem, index: number)}
	<div class="stl-hud">
		<div class="stl-progress" aria-hidden="true">
			{#each items as _, j (j)}
				<span
					class="stl-progress-seg"
					data-state={j === index ? 'current' : j < index ? 'past' : 'future'}
				></span>
			{/each}
		</div>
		<div class="stl-meta">
			<img src={item.avatar} alt="" class="stl-meta-avatar" draggable="false" />
			<div class="stl-meta-text">
				<span class="stl-meta-name">{item.name}</span>
				{#if item.time}<span class="stl-meta-time">{item.time}</span>{/if}
			</div>
			<Lightbox.Close class="stl-close" aria-label="Close">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.75"
					aria-hidden="true"
				>
					<path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</Lightbox.Close>
		</div>
	</div>
{/snippet}

<Lightbox.Portal class="stl-portal">
	<Lightbox.Backdrop class="stl-backdrop" />
	<Lightbox.Content class="stl-content" aria-label={ariaLabel}>
		{#if multiple}
			<Lightbox.Previous class="stl-nav stl-nav-prev stl-chrome-gesture-hide" aria-label="Previous">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.75"
					aria-hidden="true"
				>
					<path d="m15 18-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</Lightbox.Previous>
		{/if}
		<!-- Stage sizes the 9:16 host; the inner frame is the shared morph
		     destination, so open/close morph the frame, not the active card. -->
		<Lightbox.Stage class="stl-stage">
			{#snippet children({ morph })}
				<div {@attach morph} class="stl-frame">
					<!-- The library ships no copy, so the words announcing the carousel
					     and its slides live here, next to the rest of your UI strings. -->
					<Lightbox.Slides
						class="stl-slides"
						aria-label="Stories"
						aria-roledescription="carousel"
						preload={1}
					>
						{#each items as item, i (item.id ?? i)}
							<Lightbox.Slide class="stl-slide">
								<Lightbox.Item
									index={i}
									class="stl-item"
									aria-roledescription="slide"
									aria-label="{i + 1} of {items.length}"
								>
									{#snippet children({ active })}
										<Lightbox.Media
											width={item.width}
											height={item.height}
											class="stl-media stl-card"
											style="background-image: url({item.poster}); background-size: cover; background-position: center;"
										>
											<video
												{@attach playback(active)}
												src={item.video}
												poster={item.poster}
												width={item.width}
												height={item.height}
												playsinline
												muted
												loop
												preload={active ? 'auto' : 'metadata'}
												aria-label={item.alt}
												class="stl-video"
											></video>
											{@render hud(item, i)}
										</Lightbox.Media>
									{/snippet}
								</Lightbox.Item>
							</Lightbox.Slide>
						{/each}
					</Lightbox.Slides>
				</div>
			{/snippet}
		</Lightbox.Stage>
		{#if multiple}
			<Lightbox.Next class="stl-nav stl-nav-next stl-chrome-gesture-hide" aria-label="Next">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.75"
					aria-hidden="true"
				>
					<path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</Lightbox.Next>
			<Lightbox.Counter class="stl-counter stl-chrome-gesture-hide" />
		{/if}
	</Lightbox.Content>
</Lightbox.Portal>
