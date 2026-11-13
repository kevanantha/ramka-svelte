<!--
  Debug: the composition most galleries actually ship — a morphing,
  swipeable, zoomable viewer with chrome. It leaves out only the parts that
  are genuinely optional (Backdrop, Stage, Caption, thumbnails), so it is the
  realistic floor for a full-featured lightbox rather than a stripped demo.
  Port of the original docs' app/(docs)/debug/minimal-composition.

  When the lazy engines land differs per engine. The morph is warmed from a
  Root effect at browser idle, so it is on the wire shortly after first
  paint: it has to be resident before the click, because the morph starts
  inside the click handler. Zoom and pull-to-dismiss are deferred: zoom on
  hover / focus / press of a trigger (and again at open), pull when Content
  mounts. The zoom check compares the chunk's resource timing against the
  moment the trigger first saw intent.

  The audit scans for every `data-ramka-*` marker in
  `LIGHTBOX_PART_IDENTITY_ATTRIBUTES`, so a part mounting something extra
  shows up as a failing check rather than quietly changing this page.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import { lightboxImages } from '#lib/photos.js';

	/** Explicit rather than relying on the Slides default, so the audit can check it. */
	const PRELOAD = 1;

	/** Root renders no host element, so it has no marker to scan for. */
	const COMPOSITION: string[] = [
		Lightbox.LightboxTriggerDataAttributes.trigger,
		Lightbox.LightboxPortalDataAttributes.portal,
		Lightbox.LightboxContentDataAttributes.content,
		Lightbox.LightboxSlidesDataAttributes.slides,
		Lightbox.LightboxSlideDataAttributes.slide,
		Lightbox.LightboxItemDataAttributes.item,
		Lightbox.LightboxMediaDataAttributes.media,
		Lightbox.LightboxZoomDataAttributes.host,
		Lightbox.LightboxZoomInDataAttributes.zoomIn,
		Lightbox.LightboxZoomOutDataAttributes.zoomOut,
		Lightbox.LightboxPreviousDataAttributes.previous,
		Lightbox.LightboxNextDataAttributes.next,
		Lightbox.LightboxCounterDataAttributes.counter,
		Lightbox.LightboxCloseDataAttributes.close
	];

	const partName = (attribute: string) => attribute.replace('data-ramka-', '');

	// The three lazily-imported engines, named after the modules the loaders
	// `import()` — see lightbox-{morph,zoom,pull}-loader.ts. Pull is tracked only
	// so the request list below is not silently incomplete.
	const MORPH_CHUNK = /lightbox-morph-runtime/;
	const ZOOM_CHUNK = /lightbox-zoom-runtime/;
	const ENGINE_CHUNK = /lightbox-(morph|zoom|pull)-runtime/;

	interface Check {
		id: string;
		label: string;
		/** `null` when the environment cannot answer — neither pass nor fail. */
		pass: boolean | null;
		detail: string;
	}

	interface Audit {
		counts: { attribute: string; count: number }[];
		engineRequests: string[];
		checks: Check[];
		failed: number;
	}

	interface EngineRequest {
		label: string;
		startTime: number;
	}

	// `startTime` makes the warm-up policy observable rather than asserted:
	// both it and performance.now() are measured from timeOrigin, so a request
	// can be placed before or after the moment the trigger first saw intent.
	function engineRequests(): EngineRequest[] {
		return performance
			.getEntriesByType('resource')
			.filter((entry) => ENGINE_CHUNK.test(entry.name))
			.map((entry) => ({
				// Production: `_app/immutable/chunks/…`; dev: the library source path.
				label: new URL(entry.name).pathname.replace(/^.*\/(?=_app\/|lightbox\/)/, ''),
				startTime: entry.startTime
			}));
	}

	const describeRequests = (requests: EngineRequest[]) =>
		requests.map((r) => `${r.label} @ ${Math.round(r.startTime)}ms`).join(', ');

	function runAudit(itemCount: number, activeIndex: number, firstIntentAt: number | null): Audit {
		const count = (attribute: string) => document.querySelectorAll(`[${attribute}]`).length;
		const counts = Lightbox.LIGHTBOX_PART_IDENTITY_ATTRIBUTES.map((attribute) => ({
			attribute: attribute as string,
			count: count(attribute)
		}));

		const present = counts.filter((c) => c.count > 0).map((c) => c.attribute);
		const unexpected = present.filter((a) => !COMPOSITION.includes(a));
		const missing = COMPOSITION.filter((a) => !present.includes(a));

		const content = document.querySelector(`[${Lightbox.LightboxContentDataAttributes.content}]`);
		const counter = document.querySelector(`[${Lightbox.LightboxCounterDataAttributes.counter}]`);
		const activeItem = document.querySelector(
			`[${Lightbox.LightboxItemDataAttributes.item}][${Lightbox.LightboxItemDataAttributes.active}]`
		);

		const role = activeItem?.getAttribute('role') ?? '';
		const roleDescription = activeItem?.getAttribute('aria-roledescription') ?? '';
		const itemLabel = activeItem?.getAttribute('aria-label') ?? '';
		const contentName =
			content?.getAttribute('aria-label') ?? content?.getAttribute('aria-labelledby') ?? '';

		const requests = engineRequests();
		const morphFetched = requests.filter((r) => MORPH_CHUNK.test(r.label));
		const zoomFetched = requests.filter((r) => ZOOM_CHUNK.test(r.label));

		// Only meaningful once *some* engine chunk has been seen — otherwise this
		// build does not surface them as separate resources and the absence of a
		// morph request proves nothing.
		const enginesVisible = requests.length > 0;

		const isDisabled = (part: string, flag: string) =>
			Boolean(document.querySelector(`[${part}][${flag}]`));
		const prevDisabled = isDisabled(
			Lightbox.LightboxPreviousDataAttributes.previous,
			Lightbox.LightboxPreviousDataAttributes.disabled
		);
		const nextDisabled = isDisabled(
			Lightbox.LightboxNextDataAttributes.next,
			Lightbox.LightboxNextDataAttributes.disabled
		);
		const zoomInDisabled = isDisabled(
			Lightbox.LightboxZoomInDataAttributes.zoomIn,
			Lightbox.LightboxZoomInDataAttributes.disabled
		);
		const zoomOutDisabled = isDisabled(
			Lightbox.LightboxZoomOutDataAttributes.zoomOut,
			Lightbox.LightboxZoomOutDataAttributes.disabled
		);

		const slideBoxes = count(Lightbox.LightboxSlideDataAttributes.slide);
		const mountedItems = count(Lightbox.LightboxItemDataAttributes.item);
		const withinPreload = Array.from({ length: itemCount }, (_, i) => i).filter(
			(i) => Math.abs(i - activeIndex) <= PRELOAD
		).length;

		const checks: Check[] = [
			{
				id: 'only-composition',
				label: 'No part outside the composition is mounted',
				pass: unexpected.length === 0,
				detail:
					unexpected.length === 0
						? `${present.length} of ${counts.length} markers present`
						: `unexpected: ${unexpected.map(partName).join(', ')}`
			},
			{
				id: 'all-present',
				label: `All ${COMPOSITION.length} DOM-rendering parts are mounted (Root is context-only)`,
				pass: missing.length === 0,
				detail:
					missing.length === 0
						? COMPOSITION.map(partName).join(', ')
						: `missing: ${missing.map(partName).join(', ')}`
			},
			{
				id: 'morph-fetch',
				label: 'The morph engine was warmed at browser idle, because viewTransition is on',
				pass: enginesVisible ? morphFetched.length > 0 : null,
				detail: enginesVisible
					? morphFetched.length > 0
						? describeRequests(morphFetched)
						: 'no morph chunk seen — unsupported browser, a low-end device, or stale patterns'
					: 'this build does not emit engines as separate resources'
			},
			{
				id: 'zoom-fetch',
				label: 'The zoom engine waited for intent — it is not part of the idle warm-up',
				pass: enginesVisible
					? zoomFetched.length > 0 &&
						firstIntentAt != null &&
						zoomFetched.every((r) => r.startTime >= firstIntentAt)
					: null,
				detail: enginesVisible
					? zoomFetched.length === 0
						? 'no zoom chunk seen — the patterns above may be stale'
						: firstIntentAt == null
							? 'opened without touching a trigger, so there is no intent to compare against'
							: `${describeRequests(zoomFetched)}; first trigger intent at ${Math.round(firstIntentAt)}ms`
					: 'this build does not emit engines as separate resources'
			},
			{
				id: 'slides-preload',
				label: 'Slides keeps every slide box mounted but only preloads neighbours',
				pass: slideBoxes === itemCount && mountedItems === withinPreload,
				detail: `${slideBoxes} slide boxes, ${mountedItems} items mounted (preload ${PRELOAD} around index ${activeIndex} → ${withinPreload})`
			},
			{
				id: 'item-aria',
				label: 'Item is a standalone carousel slide, not an orphaned tabpanel',
				pass: role === 'group' && roleDescription === 'slide' && /^\d+ of \d+$/.test(itemLabel),
				detail: activeItem
					? `role=${role || '—'} roledescription=${roleDescription || '—'} label=${itemLabel || '—'}`
					: 'no active item in the DOM'
			},
			{
				id: 'dialog',
				label: 'Content is a modal dialog with an accessible name',
				pass:
					content?.getAttribute('role') === 'dialog' &&
					content?.getAttribute('aria-modal') === 'true' &&
					contentName.length > 0,
				detail: content
					? `role=${content.getAttribute('role') ?? '—'} aria-modal=${content.getAttribute('aria-modal') ?? '—'} name=${contentName || '—'}`
					: 'Content not in the DOM'
			},
			{
				id: 'nav-bounds',
				label: 'Previous / Next disable themselves at the ends',
				pass:
					prevDisabled === (activeIndex === 0) && nextDisabled === (activeIndex === itemCount - 1),
				detail: `index ${activeIndex} of ${itemCount - 1} — previous ${prevDisabled ? 'disabled' : 'enabled'}, next ${nextDisabled ? 'disabled' : 'enabled'}`
			},
			{
				id: 'counter',
				label: 'Counter tracks the active index and announces politely',
				pass:
					counter?.textContent?.trim() === `${activeIndex + 1} / ${itemCount}` &&
					counter?.getAttribute('aria-live') === 'polite',
				detail: counter
					? `"${counter.textContent?.trim()}" aria-live=${counter.getAttribute('aria-live') ?? '—'}`
					: 'Counter not in the DOM'
			},
			{
				id: 'zoom-bounds',
				label: 'ZoomOut is disabled at rest, ZoomIn is available',
				pass: zoomOutDisabled && !zoomInDisabled,
				detail: `zoom-in ${zoomInDisabled ? 'disabled' : 'enabled'}, zoom-out ${zoomOutDisabled ? 'disabled' : 'enabled'} — chrome tracks the active slide's Zoom`
			}
		];

		return {
			counts,
			engineRequests: requests.map((r) => describeRequests([r])),
			checks,
			failed: checks.filter((c) => c.pass === false).length
		};
	}

	const BUTTON =
		'grid size-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white data-disabled:pointer-events-none data-disabled:opacity-30';
	const EDGE_BUTTON = `absolute z-10 ${BUTTON}`;

	/**
	 * State the audit reads. The zoom chrome starts disabled and enables itself
	 * once the lazy engine registers as the active zoom, so a single scan after
	 * open would race it — observing these keeps the panel correct without
	 * guessing a delay, and keeps it live while swiping and zooming.
	 */
	const AUDITED_ATTRIBUTES = ['data-disabled', 'data-active', 'data-active-index'];

	let open = $state(false);
	let value = $state(0);
	let audit = $state<Audit | null>(null);
	/** When a trigger first saw hover, focus or a press. */
	let firstIntentAt: number | null = null;

	// Capture phase on the document, so this always runs before the trigger's
	// own warm-up handlers start the fetch; otherwise the audit's comparison
	// could lose by a fraction of a millisecond.
	$effect(() => {
		const types = ['pointerenter', 'pointerdown', 'focusin'] as const;
		const record = (event: Event) => {
			if (firstIntentAt != null) return;
			const target = event.target;
			if (
				target instanceof Element &&
				target.closest(`[${Lightbox.LightboxTriggerDataAttributes.trigger}]`)
			) {
				firstIntentAt = performance.now();
			}
		};
		for (const type of types) document.addEventListener(type, record, true);
		return () => {
			for (const type of types) document.removeEventListener(type, record, true);
		};
	});

	// The portal subtree only exists while open, so scan on open and then on
	// any mount or state-attribute change inside it, once per frame.
	$effect(() => {
		if (!open) {
			audit = null;
			return;
		}
		const index = value;
		let frame = 0;
		const schedule = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				audit = runAudit(lightboxImages.length, index, firstIntentAt);
			});
		};
		schedule();
		const observer = new MutationObserver(schedule);
		observer.observe(document.body, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: AUDITED_ATTRIBUTES
		});
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	});
</script>

<svelte:head>
	<title>Minimal composition — ramka-svelte</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
	<header>
		<p
			class="text-[11px] font-semibold tracking-widest text-amber-700 uppercase dark:text-amber-400"
		>
			Debug · development only
		</p>
		<h1 class="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
			Minimal composition — a full-featured viewer
		</h1>
		<p class="mt-3 max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
			Morph, swipe, zoom and chrome from {COMPOSITION.length + 1} parts — {COMPOSITION.length} of the
			{Lightbox.LIGHTBOX_PART_IDENTITY_ATTRIBUTES.length} part markers, for 16.1 KB gzipped eager. This
			is the realistic floor for a gallery you would actually ship, not a stripped demo: what is left
			out is genuinely optional.
		</p>
	</header>

	<div class="grid gap-4 sm:grid-cols-2">
		<section class="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
			<h2 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">What this costs</h2>
			<ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-600 dark:text-neutral-400">
				<li>16.1 KB gz eager — only 1.6 KB more than Root/Trigger/Portal/Content/Item/Media</li>
				<li>Slides and Slide are layout; the chrome parts render one element each</li>
				<li>
					~7.7 KB gz for the morph lands at browser idle after first paint — it has to be resident
					before the click, because the morph starts inside the click handler
				</li>
				<li>
					~11.1 KB gz for zoom and ~2.7 KB gz for pull-to-dismiss are the genuinely deferred ones:
					zoom on hover / focus / press of a trigger, pull when Content mounts. A visitor who never
					opens the gallery downloads neither.
				</li>
				<li>
					Everything the package exports would be 20.3 KB gz eager, so this is most of the library
				</li>
			</ul>
		</section>
		<section class="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
			<h2 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">What is left out</h2>
			<ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-600 dark:text-neutral-400">
				<li><strong>Backdrop</strong> — Content carries the scrim itself</li>
				<li><strong>Caption</strong> — no per-item text</li>
				<li>
					<strong>ThumbnailGroup / Thumbnail / ThumbnailStrip</strong> — which is also what keeps Item
					a slide rather than a tabpanel
				</li>
				<li><strong>Stage</strong> — Content is the interaction surface</li>
				<li>
					Drop <code class="text-xs">viewTransition</code> to
					<code class="text-xs">{'{false}'}</code> and the morph engine never reaches the network either,
					leaving no engine code on page load at all
				</li>
			</ul>
		</section>
	</div>

	<div
		class={audit == null
			? 'rounded-lg border border-neutral-200 px-4 py-3 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400'
			: audit.failed === 0
				? 'rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100'
				: 'rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100'}
	>
		{#if audit == null}
			Open the lightbox to audit the mounted parts.
		{:else}
			<div class="space-y-2">
				<p class="font-medium">
					{audit.failed === 0 ? 'All checks passing' : `${audit.failed} check(s) failing`}
				</p>
				<ul class="space-y-1">
					{#each audit.checks as c (c.id)}
						<li class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
							<span
								class={c.pass === null
									? 'text-neutral-500'
									: c.pass
										? 'text-emerald-700 dark:text-emerald-300'
										: 'text-red-700 dark:text-red-300'}
							>
								{c.pass === null ? '–' : c.pass ? '✓' : '✗'}
							</span>
							<span>{c.label}</span>
							<span class="text-xs opacity-70">{c.detail}</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>

	{#if audit}
		<details class="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800">
			<summary class="cursor-pointer text-sm font-medium text-neutral-900 dark:text-neutral-100">
				Part identity scan ({Lightbox.LIGHTBOX_PART_IDENTITY_ATTRIBUTES.length} markers) and engine requests
				({audit.engineRequests.length})
			</summary>
			<ul class="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
				{#each audit.counts as { attribute, count } (attribute)}
					<li class="flex items-baseline justify-between gap-2 text-xs">
						<code
							class={count > 0
								? 'text-neutral-900 dark:text-neutral-100'
								: 'text-neutral-400 dark:text-neutral-600'}
						>
							{partName(attribute)}
						</code>
						<span
							class={count > 0
								? 'text-neutral-600 tabular-nums dark:text-neutral-400'
								: 'text-neutral-300 tabular-nums dark:text-neutral-700'}
						>
							{count}
						</span>
					</li>
				{/each}
			</ul>
			{#if audit.engineRequests.length > 0}
				<ul class="mt-3 space-y-1 border-t border-neutral-200 pt-3 dark:border-neutral-800">
					{#each audit.engineRequests as name (name)}
						<li class="truncate text-xs text-neutral-600 dark:text-neutral-400">
							<code>{name}</code>
						</li>
					{/each}
				</ul>
			{/if}
		</details>
	{/if}

	<!-- `viewTransition` is left at its default (on), so opening morphs from the
	     trigger. The trigger's `image` attachment is what makes that morph clean
	     — without it the library warns and the first frame can flash blank. -->
	<Lightbox.Root bind:open bind:value>
		<div class="grid grid-cols-3 gap-3 sm:grid-cols-6">
			{#each lightboxImages as photo, i (photo.src)}
				<Lightbox.Trigger
					index={i}
					class="overflow-hidden rounded-lg outline-offset-2 focus-visible:outline-2 focus-visible:outline-sky-500"
				>
					{#snippet children({ image })}
						<img
							{@attach image}
							src={photo.thumb}
							alt="Photo {i + 1}"
							width={photo.width}
							height={photo.height}
							loading="lazy"
							class="aspect-square size-full cursor-pointer object-cover"
						/>
					{/snippet}
				</Lightbox.Trigger>
			{/each}
		</div>

		<Lightbox.Portal>
			<!-- No Backdrop part — Content carries the scrim itself. -->
			<Lightbox.Content
				aria-label="Minimal composition photo viewer"
				class="fixed inset-0 flex flex-col bg-neutral-950/95 outline-none"
			>
				<!-- Slides bakes in the scroller (flex, overflow, snap); the consumer
				     owns sizing. Slide is the snap box and needs the scrollport width. -->
				<Lightbox.Slides
					preload={PRELOAD}
					aria-label="Photos"
					class="flex-1 scrollbar-none [&::-webkit-scrollbar]:hidden"
				>
					{#each lightboxImages as photo, i (photo.src)}
						<Lightbox.Slide
							class="h-full min-w-full flex-[0_0_100%] px-4 pt-16 pb-24 sm:px-20 sm:pt-20"
						>
							<Lightbox.Item index={i}>
								<Lightbox.Zoom>
									<Lightbox.Media width={photo.width} height={photo.height}>
										<!-- draggable="false" is required: the Zoom host sets
										     `user-select: none`, but that does not suppress native
										     image drag-and-drop, which would hijack the mouse pan. -->
										<img
											src={photo.src}
											alt="Photo {i + 1}"
											width={photo.width}
											height={photo.height}
											loading={i === 0 ? 'eager' : 'lazy'}
											fetchpriority={i === 0 ? 'high' : undefined}
											draggable="false"
										/>
									</Lightbox.Media>
								</Lightbox.Zoom>
							</Lightbox.Item>
						</Lightbox.Slide>
					{/each}
				</Lightbox.Slides>

				<!-- Chrome sits beside Slides and targets the active slide's Zoom. -->
				<Lightbox.Counter
					class="absolute top-4 left-4 z-10 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white tabular-nums backdrop-blur"
				/>
				<Lightbox.Close aria-label="Close" class="{EDGE_BUTTON} top-4 right-4">
					<X class="size-5" aria-hidden="true" />
				</Lightbox.Close>
				<Lightbox.Previous
					aria-label="Previous"
					class="{EDGE_BUTTON} top-1/2 left-4 -translate-y-1/2"
				>
					<ChevronLeft class="size-6" aria-hidden="true" />
				</Lightbox.Previous>
				<Lightbox.Next aria-label="Next" class="{EDGE_BUTTON} top-1/2 right-4 -translate-y-1/2">
					<ChevronRight class="size-6" aria-hidden="true" />
				</Lightbox.Next>

				<div class="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
					<Lightbox.ZoomOut aria-label="Zoom out" class={BUTTON}>
						<Minus class="size-5" aria-hidden="true" />
					</Lightbox.ZoomOut>
					<Lightbox.ZoomIn aria-label="Zoom in" class={BUTTON}>
						<Plus class="size-5" aria-hidden="true" />
					</Lightbox.ZoomIn>
				</div>
			</Lightbox.Content>
		</Lightbox.Portal>
	</Lightbox.Root>

	<p class="text-sm text-neutral-500 dark:text-neutral-500">
		Open a thumbnail and it morphs from that thumbnail; closing morphs back. Then swipe or drag the
		carousel, use the buttons or ← → / Home / End, pinch or ctrl-scroll or +/− to zoom, and Escape
		to close. The audit re-runs on every index change and on any part mounting or changing state.
	</p>
</div>
