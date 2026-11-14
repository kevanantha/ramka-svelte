<!--
  Chrome builder: a Twitter-preset-style split viewer whose pieces (post
  sidebar, arrows, thumbnails, caption, tooltips on every stage icon button)
  toggle on and off, with the markup panel generated from the same booleans.
  The point of the demo is that the viewer and the code cannot drift apart,
  because in a composable API the markup IS the API: a piece of chrome
  exists exactly when you render it.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import X from '@lucide/svelte/icons/x';
	import { ramkaD, ramkaE, ramkaG } from '#lib/photos.js';
	import ThreadPanel, { type ThreadPost } from '../../(docs)/presets/twitter/ThreadPanel.svelte';
	import { buildSnippet, tokenizeLine, type ChromeOptions } from './chrome-snippet';
	import '../../(docs)/presets/twitter/lightbox.css';
	import './chrome-builder.css';

	const ITEMS = [ramkaD, ramkaE, ramkaG];

	const POST: ThreadPost = {
		author: {
			name: 'Mia Kowalska',
			handle: 'miakow',
			avatar: 'https://i.pravatar.cc/96?u=mia-kowalska',
			verified: true
		},
		text: 'Three frames from the weekend that I keep coming back to. The fog one is straight out of camera.',
		time: 'Aug 29, 2026 · 9:41 AM',
		stats: { replies: 42, reposts: 118, likes: 964, views: '48K' },
		replies: [
			{
				id: 'r1',
				author: {
					name: 'Sofia Lindgren',
					handle: 'sofialind',
					avatar: 'https://i.pravatar.cc/96?u=sofia'
				},
				text: 'The valley shot belongs on a wall. What lens?',
				time: '2h'
			},
			{
				id: 'r2',
				author: {
					name: 'James Okafor',
					handle: 'jamesokafor',
					avatar: 'https://i.pravatar.cc/96?u=james'
				},
				text: 'That plane window timing is unreal.',
				time: '1h'
			}
		]
	};

	const TOGGLES: { key: keyof ChromeOptions; label: string }[] = [
		{ key: 'sidebar', label: 'Post sidebar' },
		{ key: 'arrows', label: 'Arrows' },
		{ key: 'thumbs', label: 'Thumbnails' },
		{ key: 'caption', label: 'Caption' },
		{ key: 'tooltips', label: 'Tooltips' }
	];

	let options = $state<ChromeOptions>({
		sidebar: true,
		arrows: true,
		thumbs: true,
		caption: true,
		tooltips: true
	});

	const lines = $derived(buildSnippet(options).split('\n').map(tokenizeLine));

	// The preset's slides read `--xlb-inset-bottom` as padding so media never
	// sits under bottom chrome. Its default (3rem) is sized for the preset's
	// own counter; our caption + thumbnail band is taller, so reserve for
	// whatever is actually rendered (same trick as the docs gallery chrome).
	const bottomChrome = $derived(options.thumbs ? (options.caption ? '7.5rem' : '5.5rem') : null);

	/** Per-tile rounding for the 1-tall + 2 grid (morph reads the trigger radius). */
	const tileClasses = ['row-span-2 rounded-s-xl', 'rounded-tr-xl', 'rounded-br-xl'];

	const tokenClass = {
		comment: 'text-[#6e7781] dark:text-[#8b949e]',
		string: 'text-[#0a3069] dark:text-[#a5d6ff]',
		tag: 'text-[#116329] dark:text-[#7ee787]',
		attr: 'text-[#0550ae] dark:text-[#79c0ff]'
	} as const;

	const toggleClass = (active: boolean) =>
		`h-8 rounded-full px-3.5 text-[13px] font-medium transition ${
			active
				? 'bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900'
				: 'border border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900'
		}`;
</script>

<!-- The "your own tooltip component" of the demo: shows on hover and keyboard
     focus of the icon button it sits in (which carries `group`). -->
{#snippet tooltip(label: string, className: string)}
	{#if options.tooltips}
		<span
			role="tooltip"
			class="pointer-events-none absolute z-10 rounded-md bg-neutral-800/95 px-2 py-1 text-[11px] font-medium whitespace-nowrap text-white opacity-0 shadow-sm backdrop-blur transition-opacity delay-75 group-hover:opacity-100 group-focus-visible:opacity-100 {className}"
		>
			{label}
		</span>
	{/if}
{/snippet}

<figure class="my-8 rounded-2xl border border-neutral-200 p-4 md:p-5 dark:border-neutral-800">
	<div class="flex flex-wrap items-center gap-2" role="group" aria-label="Chrome pieces">
		{#each TOGGLES as { key, label } (key)}
			<button
				type="button"
				onclick={() => (options[key] = !options[key])}
				aria-pressed={options[key]}
				class={toggleClass(options[key])}
			>
				{label}
			</button>
		{/each}
	</div>

	<Lightbox.Root loop>
		<!-- The feed post that opens the viewer. -->
		<article class="mt-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
			<div class="flex items-center gap-2.5">
				<img
					src={POST.author.avatar}
					alt=""
					class="size-9 shrink-0 rounded-full object-cover"
					draggable="false"
				/>
				<div class="flex min-w-0 flex-wrap items-baseline gap-x-1 text-sm">
					<span class="font-semibold text-neutral-900 dark:text-neutral-50">{POST.author.name}</span
					>
					<span class="text-neutral-500">@{POST.author.handle} · 3h</span>
				</div>
			</div>
			<p class="mt-2 mb-3 text-[14px] leading-snug text-neutral-800 dark:text-neutral-200">
				{POST.text}
			</p>
			<div class="grid aspect-3/2 grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-xl">
				{#each ITEMS as item, i (item.src)}
					<Lightbox.Trigger
						index={i}
						class="xlb-trigger block overflow-hidden bg-transparent p-0 {tileClasses[i]}"
					>
						{#snippet children({ image })}
							<img
								{@attach image}
								src={item.thumb}
								alt={item.alt}
								loading="lazy"
								draggable="false"
								class="block size-full object-cover select-none"
							/>
						{/snippet}
					</Lightbox.Trigger>
				{/each}
			</div>
		</article>

		<Lightbox.Portal class="xlb-portal">
			<Lightbox.Backdrop class="xlb-backdrop" />
			<Lightbox.Content class="xlb-content" aria-label="Photos by {POST.author.name}">
				<Lightbox.Stage
					class="xlb-media-pane"
					style={bottomChrome
						? `--xlb-inset-bottom: calc(${bottomChrome} + env(safe-area-inset-bottom, 0px));`
						: undefined}
				>
					<Lightbox.Close
						class="xlb-control xlb-close group xlb-chrome-pull-hide"
						aria-label="Close"
					>
						<!-- 2.5 (not the chevrons' 2.25): long 45° diagonals antialias
						     thinner at 18px, so the X needs extra weight to match. -->
						<X aria-hidden="true" strokeWidth={2.5} />
						{@render tooltip('Close (Esc)', 'inset-s-0 top-full mt-2')}
					</Lightbox.Close>

					<Lightbox.Slides
						class="xlb-slides"
						aria-label="Post media"
						aria-roledescription="carousel"
						preload={1}
					>
						{#each ITEMS as item, i (item.src)}
							<Lightbox.Slide class="xlb-slide">
								<Lightbox.Item
									index={i}
									caption={item.caption}
									aria-roledescription="slide"
									aria-label="{i + 1} of {ITEMS.length}"
								>
									<Lightbox.Zoom>
										<Lightbox.Media class="xlb-media" width={item.width} height={item.height}>
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

					{#if options.arrows}
						<Lightbox.Previous
							class="xlb-control xlb-nav xlb-nav-prev group xlb-chrome-pull-hide"
							aria-label="Previous"
						>
							<ChevronLeft aria-hidden="true" strokeWidth={2.25} />
							{@render tooltip('Previous (←)', 'top-full left-1/2 mt-2 -translate-x-1/2')}
						</Lightbox.Previous>
						<Lightbox.Next
							class="xlb-control xlb-nav xlb-nav-next group xlb-chrome-pull-hide"
							aria-label="Next"
						>
							<ChevronRight aria-hidden="true" strokeWidth={2.25} />
							{@render tooltip('Next (→)', 'top-full left-1/2 mt-2 -translate-x-1/2')}
						</Lightbox.Next>
					{/if}

					{#if options.caption || options.thumbs}
						<div
							class="xlb-chrome-pull-hide cb-zoom-hide pointer-events-none absolute inset-x-0 bottom-0 z-2 flex flex-col items-center gap-3 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
						>
							{#if options.caption}
								<Lightbox.Caption
									class="block max-w-full truncate text-[13px] leading-tight font-medium text-white/90"
								/>
							{/if}
							{#if options.thumbs}
								<Lightbox.ThumbnailStrip class="lightbox-demo-thumbnail-strip pointer-events-auto">
									<Lightbox.ThumbnailStripTrack aria-label="Photo thumbnails">
										{#each ITEMS as item, i (item.src)}
											<Lightbox.Thumbnail index={i}>
												<img src={item.thumb} alt={item.alt} draggable="false" />
											</Lightbox.Thumbnail>
										{/each}
									</Lightbox.ThumbnailStripTrack>
									<!-- The shared indicator is black in light mode, but this
									     media pane is dark in both themes, so force white. -->
									<span
										class="lightbox-demo-thumbnail-strip-indicator border-white!"
										aria-hidden="true"
									></span>
								</Lightbox.ThumbnailStrip>
							{/if}
						</div>
					{/if}
				</Lightbox.Stage>

				{#if options.sidebar}
					<ThreadPanel thread={POST} open={false} onClose={() => {}} />
				{/if}
			</Lightbox.Content>
		</Lightbox.Portal>
	</Lightbox.Root>

	<div class="mt-4 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
		<div
			class="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-3 py-1.5 dark:border-neutral-800 dark:bg-neutral-900"
		>
			<span class="text-xs font-medium text-neutral-500">Your chrome, exactly as rendered</span>
		</div>
		<!-- Focusable so the horizontal overflow is reachable without a pointer
		     (axe: scrollable-region-focusable). -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<pre
			tabindex="0"
			role="region"
			aria-label="Generated markup for the current chrome"
			class="overflow-x-auto bg-neutral-50 p-4 text-[12.5px] leading-[1.7] text-[#1f2328] dark:bg-neutral-950 dark:text-[#e6edf3]"><code
				>{#each lines as tokens, i (i)}<span class="block min-h-[1.2em]"
						>{#each tokens as token, j (j)}{#if token.kind}<span class={tokenClass[token.kind]}
									>{token.text}</span
								>{:else}{token.text}{/if}{/each}</span
					>{/each}</code
			></pre>
	</div>

	<figcaption class="mt-4 text-[13px] leading-6 text-neutral-500 dark:text-neutral-400">
		Flip the switches, then open a photo. The viewer and the markup update together because they
		cannot drift apart: a piece of chrome exists exactly when you render it. The post sidebar is a
		plain <code class="text-[12px]">&lt;aside&gt;</code> with your components in it, the tooltips wrap
		every icon button in the stage, and none of it is an option. The sidebar layout is desktop-only, like
		the social apps it mimics.
	</figcaption>
</figure>
