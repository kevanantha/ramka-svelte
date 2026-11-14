<!--
  Twitter / X-style lightbox: design-system package entry (copy with
  ThreadPanel.svelte and lightbox.css).

  Desktop: translucent media pane + thread sidebar (edge prev/next).
  Mobile: swipeable Slides + bottom engagement bar; comment opens a
  full-screen thread.

  Place it under `Lightbox.Root`, beside your triggers (give them the
  `xlb-trigger` class). To compose your own viewer, use the parts from
  `ramka-svelte/lightbox` with this skin's classes (`xlb-portal`,
  `xlb-backdrop`, `xlb-content`, `xlb-media-pane` on Stage, `xlb-slides`,
  `xlb-slide`, `xlb-media`, `xlb-control xlb-close`, `xlb-control xlb-nav
  xlb-nav-prev` / `xlb-nav-next`, `xlb-counter`) and `ThreadPanel`.
-->
<script lang="ts" module>
	export type { ThreadAuthor, ThreadPost, ThreadReply } from './ThreadPanel.svelte';

	/** Item shape for the gallery: pass the real intrinsic pixel size. */
	export type TwitterItem = {
		id?: string | number;
		src: string;
		thumb: string;
		alt: string;
		width: number;
		height: number;
	};
</script>

<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import ThreadPanel, {
		formatCount,
		iconLike,
		iconReply,
		iconRepost,
		iconShare,
		iconX,
		type ThreadPost
	} from './ThreadPanel.svelte';
	import './lightbox.css';

	let {
		items,
		thread,
		ariaLabel
	}: { items: TwitterItem[]; thread: ThreadPost; ariaLabel: string } = $props();

	const showNav = $derived(items.length > 1);
	let threadOpen = $state(false);
</script>

{#snippet iconViews()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
		<path d="M4 18V10M10 18V6M16 18v-5M20 18V8" stroke-linecap="round" stroke-linejoin="round" />
	</svg>
{/snippet}

<Lightbox.Portal class="xlb-portal">
	<Lightbox.Backdrop class="xlb-backdrop" />
	<Lightbox.Content
		class={['xlb-content', threadOpen && 'xlb-content-thread-open']}
		aria-label={ariaLabel}
	>
		<Lightbox.Stage class="xlb-media-pane">
			<Lightbox.Close class="xlb-control xlb-close xlb-chrome-pull-hide" aria-label="Close">
				{@render iconX()}
			</Lightbox.Close>

			<!-- The library ships no copy, so the words announcing the carousel
			     and its slides live here, next to the rest of your UI strings. -->
			<Lightbox.Slides
				class="xlb-slides"
				aria-label="Post media"
				aria-roledescription="carousel"
				preload={1}
			>
				{#each items as item, i (item.id ?? i)}
					<Lightbox.Slide class="xlb-slide">
						<Lightbox.Item
							index={i}
							aria-roledescription="slide"
							aria-label="{i + 1} of {items.length}"
						>
							<Lightbox.Zoom>
								<Lightbox.Media class="xlb-media" width={item.width} height={item.height}>
									<img
										width={item.width}
										height={item.height}
										src={item.src}
										alt={item.alt}
										loading="eager"
										draggable="false"
									/>
								</Lightbox.Media>
							</Lightbox.Zoom>
						</Lightbox.Item>
					</Lightbox.Slide>
				{/each}
			</Lightbox.Slides>

			{#if showNav}
				<Lightbox.Previous
					class="xlb-control xlb-nav xlb-nav-prev xlb-chrome-pull-hide"
					aria-label="Previous"
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.25"
						aria-hidden="true"
					>
						<path d="m15 18-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</Lightbox.Previous>
				<Lightbox.Next
					class="xlb-control xlb-nav xlb-nav-next xlb-chrome-pull-hide"
					aria-label="Next"
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.25"
						aria-hidden="true"
					>
						<path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</Lightbox.Next>
				<Lightbox.Counter class="xlb-counter xlb-chrome-pull-hide" />
			{/if}

			<!-- Mobile engagement bar -->
			<div class="xlb-mobile-bar xlb-chrome-pull-hide" aria-label="Post actions">
				<button
					type="button"
					class="xlb-mobile-action"
					aria-label="View comments"
					onclick={() => (threadOpen = true)}
				>
					{@render iconReply()}
					<span>{formatCount(thread.stats?.replies)}</span>
				</button>
				<button type="button" class="xlb-mobile-action" aria-label="Repost">
					{@render iconRepost()}
					<span>{formatCount(thread.stats?.reposts)}</span>
				</button>
				<button type="button" class="xlb-mobile-action" aria-label="Like">
					{@render iconLike()}
					<span>{formatCount(thread.stats?.likes)}</span>
				</button>
				<button type="button" class="xlb-mobile-action" aria-label="Views">
					{@render iconViews()}
					<span>{thread.stats?.views ?? '—'}</span>
				</button>
				<button type="button" class="xlb-mobile-action" aria-label="Share">
					{@render iconShare()}
				</button>
			</div>
		</Lightbox.Stage>

		<ThreadPanel {thread} open={threadOpen} onClose={() => (threadOpen = false)} />
	</Lightbox.Content>
</Lightbox.Portal>
