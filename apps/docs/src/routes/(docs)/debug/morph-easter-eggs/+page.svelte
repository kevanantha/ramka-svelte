<!--
  Debug playground: five candidate easter eggs for the landing page's
  "Morph view transitions" bento card. Each variant is the same card wired to
  a different custom lightbox, so the concepts can be compared before one
  ships. The card itself is the Trigger (the trigger root is the default
  morph source), and each viewer marks its own destination with the Item's
  `morph` attachment. Port of the original docs' app/(docs)/debug/morph-easter-eggs.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import { chromeButton } from '#lib/components/chrome.js';
	import { ramkaE } from '#lib/photos.js';
	import CardTrigger from './CardTrigger.svelte';
	import EggViewer from './EggViewer.svelte';
	import GoldFrame from './GoldFrame.svelte';
	import MuseumArt from './MuseumArt.svelte';
	import Placard from './Placard.svelte';
	import RecursionLevel from './RecursionLevel.svelte';
	import SoloSlide from './SoloSlide.svelte';

	const MUSEUM_EXHIBITS = [
		{
			id: 'flip',
			title: 'FLIP animation, take three (2025)',
			lines: [
				'Mixed media: translate, scale, and tears.',
				'Abandoned when the artist discovered View Transitions.'
			]
		},
		{
			id: 'emulation',
			title: 'Scroll emulation (rejected)',
			lines: [
				'The artist refused to fake physics.',
				'Slides ride real CSS scroll snapping to this day.'
			]
		},
		{
			id: 'glass',
			title: 'Untitled (broken glass)',
			lines: ['From the artist’s early period.', 'See also: the quote hanging downstairs.']
		}
	] as const;

	// V4's listing, as [class, text] tokens per line (the Svelte form of the
	// original's JSX sample).
	const tag = 'text-[#7fdbca]';
	const attr = 'text-[#addb67]';
	const str = 'text-[#ecc48d]';
	const dim = 'text-[#637777]';
	const CODE: [string, string][][] = [
		[[dim, '// the morph you just watched:']],
		[[tag, '<Lightbox.Root>']],
		[
			['', '  '],
			[tag, '<Lightbox.Trigger'],
			['', ' '],
			[attr, 'index'],
			['', '={'],
			[str, '0'],
			['', '}'],
			[tag, '>']
		],
		[
			['', '    {#snippet '],
			[attr, 'children'],
			['', '({ '],
			[attr, 'image'],
			['', ' })}'],
			[tag, '<img'],
			['', ' {@attach '],
			[str, 'image'],
			['', '} '],
			[attr, 'src'],
			['', '={'],
			[str, 'thumb'],
			['', '} /'],
			[tag, '>'],
			['', '{/snippet}']
		],
		[
			['', '  '],
			[tag, '</Lightbox.Trigger>']
		],
		[
			['', '  '],
			[dim, '<!-- portal, slides, media… -->']
		],
		[[tag, '</Lightbox.Root>']],
		[],
		[[dim, '// that’s it. viewTransition is the default.']]
	];
	const VARIANTS = [
		{
			id: 'v1',
			name: 'V1 · The card gets framed',
			pitch:
				'The card morphs into a gilded museum frame with a placard. ramka is Polish for frame; the feature literally gets framed.',
			egg: framedExhibitEgg
		},
		{
			id: 'v2',
			name: 'V2 · Lightboxes all the way down',
			pitch:
				'The card opens a circular photo, which contains a rectangular lightbox, which contains a square one. Every level morphs into a different shape, until the management objects.',
			egg: recursionEgg
		},
		{
			id: 'v3',
			name: 'V3 · A tiny museum wing',
			pitch:
				'Three framed exhibits of ramka lore: the FLIP diagram, the rejected scroll emulation, the broken glass. Swipe between them, then close from slide three and watch it morph back to the card.',
			egg: museumWingEgg
		},
		{
			id: 'v4',
			name: 'V4 · The code that did it',
			pitch: 'The card morphs into the ten lines of code powering the morph you just experienced.',
			egg: codeEgg
		},
		{
			id: 'v5',
			name: 'V5 · Darkroom print',
			pitch:
				'The card morphs into a photographic print that develops under a red safelight on every open.',
			egg: darkroomEgg
		}
	];
</script>

<svelte:head>
	<title>Morph card easter eggs — ramka-svelte</title>
</svelte:head>

<!-- V1 — the card gets framed. -->
{#snippet framedExhibitEgg()}
	<Lightbox.Root>
		<CardTrigger crossfade="both" />
		<EggViewer ariaLabel="Morph view transitions, framed">
			<SoloSlide>
				{#snippet children({ morph })}
					<div class="flex max-h-full flex-col items-center">
						<GoldFrame {morph} class="max-w-lg">
							<div class="px-8 py-12 text-center md:px-12 md:py-16">
								<Sparkles
									aria-hidden="true"
									class="mx-auto size-6 text-[#d9b854]"
									strokeWidth={1.5}
								/>
								<p
									class="mt-5 text-2xl font-semibold tracking-tight text-balance text-[#f5f3ec] md:text-3xl"
								>
									Morph view transitions
								</p>
								<p class="mx-auto mt-4 max-w-xs text-sm leading-6 text-pretty text-[#a8a69d]">
									You just watched a flat white card become a gilded frame. That was the feature.
									This is the exhibit.
								</p>
							</div>
						</GoldFrame>
						<Placard
							title="Morph view transition (2026)"
							lines={[
								'CSS, View Transitions API, and stubbornness on canvas.',
								'On loan from the ramka collection.'
							]}
						/>
					</div>
				{/snippet}
			</SoloSlide>
		</EggViewer>
	</Lightbox.Root>
{/snippet}

<!-- V3 — a tiny museum wing. -->
{#snippet museumWingEgg()}
	<Lightbox.Root morphTo="closest">
		<CardTrigger crossfade="both" />
		<EggViewer ariaLabel="The ramka museum wing">
			<Lightbox.Slides
				aria-label="Exhibits"
				aria-roledescription="carousel"
				class="flex-1 [&::-webkit-scrollbar]:hidden"
			>
				{#each MUSEUM_EXHIBITS as exhibit, i (exhibit.id)}
					<Lightbox.Slide class="h-full min-w-full flex-[0_0_100%]">
						<Lightbox.Item
							index={i}
							aria-roledescription="slide"
							aria-label="{i + 1} of {MUSEUM_EXHIBITS.length}"
							class="flex h-full w-full items-center justify-center px-6 py-14"
						>
							{#snippet children({ morph })}
								<div class="flex max-h-full flex-col items-center">
									<GoldFrame {morph} class="w-full max-w-lg">
										<div class="aspect-[8/5] w-full p-3 md:p-4"><MuseumArt id={exhibit.id} /></div>
									</GoldFrame>
									<Placard title={exhibit.title} lines={[...exhibit.lines]} />
								</div>
							{/snippet}
						</Lightbox.Item>
					</Lightbox.Slide>
				{/each}
			</Lightbox.Slides>
			<div class="lightbox-demo-chrome-hide absolute start-4 top-4 z-30">
				<Lightbox.Counter
					class="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white tabular-nums backdrop-blur"
				/>
			</div>
			<div
				class="lightbox-demo-chrome-hide absolute inset-y-0 start-4 z-30 hidden items-center md:flex"
			>
				<Lightbox.Previous class={chromeButton} aria-label="Previous exhibit">
					<ChevronLeft aria-hidden="true" class="h-5 w-5" strokeWidth={2.25} />
				</Lightbox.Previous>
			</div>
			<div
				class="lightbox-demo-chrome-hide absolute inset-y-0 end-4 z-30 hidden items-center md:flex"
			>
				<Lightbox.Next class={chromeButton} aria-label="Next exhibit">
					<ChevronRight aria-hidden="true" class="h-5 w-5" strokeWidth={2.25} />
				</Lightbox.Next>
			</div>
		</EggViewer>
	</Lightbox.Root>
{/snippet}

<!-- V4 — the code that did it. -->
{#snippet codeEgg()}
	<Lightbox.Root>
		<CardTrigger crossfade="both" />
		<EggViewer ariaLabel="The code behind the morph">
			<SoloSlide>
				{#snippet children({ morph })}
					<div class="flex max-h-full w-full max-w-xl flex-col items-center">
						<div
							{@attach morph}
							class="w-full overflow-hidden rounded-xl border border-white/10 bg-[#0b1120] shadow-2xl"
						>
							<div class="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
								<span class="size-2.5 rounded-full bg-[#ff5f57]"></span>
								<span class="size-2.5 rounded-full bg-[#febc2e]"></span>
								<span class="size-2.5 rounded-full bg-[#28c840]"></span>
								<span class="ml-3 text-[11px] text-neutral-400">gallery.svelte</span>
							</div>
							<pre
								class="overflow-x-auto p-5 text-[12.5px] leading-6 text-[#d6deeb] md:text-[13px]"><code
									>{#each CODE as line, l (l)}{#each line as [cls, text], t (t)}{#if cls}<span
													class={cls}>{text}</span
												>{:else}{text}{/if}{/each}{#if l < CODE.length - 1}{'\n'}{/if}{/each}</code
								></pre>
						</div>
						<p class="mt-5 text-center text-sm text-white/70">
							That&rsquo;s the whole trick. No keyframes, no FLIP math, no cloned DOM.
						</p>
					</div>
				{/snippet}
			</SoloSlide>
		</EggViewer>
	</Lightbox.Root>
{/snippet}

<!-- V5 — darkroom print. The develop animation restarts on every open
     because the portal subtree unmounts on close (keepMounted is off). -->
{#snippet darkroomEgg()}
	<Lightbox.Root>
		<CardTrigger crossfade="both" />
		<EggViewer ariaLabel="Darkroom print">
			<SoloSlide>
				{#snippet children({ morph })}
					<div class="flex max-h-full flex-col items-center">
						<div
							{@attach morph}
							class="relative w-full max-w-md rotate-[-1.2deg] bg-[#f7f4ec] p-3 pb-14 shadow-[0_2px_6px_rgba(0,0,0,0.45),0_28px_56px_-16px_rgba(0,0,0,0.6)]"
						>
							<div class="relative overflow-hidden">
								<img
									src={ramkaE.src}
									alt="Fog rolling over dark hills, developing like a darkroom print"
									width={ramkaE.width}
									height={ramkaE.height}
									draggable="false"
									class="block w-full [animation:egg-develop_3s_ease-out_0.35s_both] select-none motion-reduce:animate-none"
								/>
								<div
									aria-hidden="true"
									class="pointer-events-none absolute inset-0 [animation:egg-safelight_3s_ease-out_0.35s_both] bg-[radial-gradient(120%_120%_at_20%_0%,rgba(211,47,47,0.5),rgba(211,47,47,0.15)_55%,transparent_80%)] mix-blend-screen motion-reduce:hidden"
								></div>
							</div>
							<p
								class="absolute inset-x-0 bottom-4 text-center font-serif text-sm text-neutral-500 italic"
							>
								every open is a fresh print
							</p>
						</div>
						<p class="mt-6 text-center text-sm text-white/70">
							Straight out of the darkroom. Close it and print another.
						</p>
					</div>
				{/snippet}
			</SoloSlide>
		</EggViewer>
	</Lightbox.Root>
{/snippet}

{#snippet recursionEgg()}
	<RecursionLevel depth={1} />
{/snippet}

<div class="mx-auto flex w-full max-w-3xl flex-col gap-12 px-6 py-12">
	<header>
		<p
			class="text-[11px] font-semibold tracking-widest text-amber-700 uppercase dark:text-amber-400"
		>
			Debug · development only
		</p>
		<h1 class="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
			Morph card easter eggs
		</h1>
		<p class="mt-3 max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
			Five candidates for what the &ldquo;Morph view transitions&rdquo; bento card opens. Same card,
			five different lightboxes. Click each Try me and pick a winner.
		</p>
	</header>

	{#each VARIANTS as variant (variant.id)}
		<section>
			<h2 class="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
				{variant.name}
			</h2>
			<p class="mt-1 max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
				{variant.pitch}
			</p>
			<div class="mt-4">{@render variant.egg()}</div>
		</section>
	{/each}
</div>

<style>
	@keyframes -global-egg-develop {
		0% {
			filter: brightness(2.6) sepia(0.75) contrast(0.25) saturate(0.4);
		}
		55% {
			filter: brightness(1.5) sepia(0.45) contrast(0.6) saturate(0.65);
		}
		100% {
			filter: none;
		}
	}
	@keyframes -global-egg-safelight {
		0%,
		70% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
</style>
