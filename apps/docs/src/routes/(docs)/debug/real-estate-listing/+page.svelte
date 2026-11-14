<!--
  Debug: a property page in the style of Airbnb or Zillow — a hero grid for
  the first five photos, then an "all photos" grid below. The lightbox shows
  all 10 photos in one swipeable Lightbox.Slides viewport, and
  `scrollTriggerIntoView` is instant on close so the morph target is always
  on screen. Port of the original docs' app/(docs)/debug/real-estate-listing.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import ExampleShell from '#lib/components/ExampleShell.svelte';
	import LightboxGallery from '#lib/components/LightboxGallery.svelte';
	import { triggerFocusClass } from '#lib/components/chrome.js';
	import { propertyPhotos } from '#lib/photos.js';

	const amenities = [
		'Central Air Conditioning',
		'Heated Floors',
		'Smart Home System',
		'Wine Cellar',
		'EV Charger',
		'Security System',
		'Elevator Access',
		'Guest Suite',
		'Outdoor Kitchen',
		'Fire Pit',
		'Sauna',
		'Fiber Internet'
	];

	// Per-cell outer corners. The 5-cell grid: index 0 is the tall left
	// column, then top-middle (1), top-right (2), bottom-middle (3),
	// bottom-right (4). Only the outer corners are rounded so the composition
	// reads as one rounded rectangle, but each <img> carries its own radius so
	// the morph snapshot inherits the right curve from the morph target.
	const heroCornerClass = ['rounded-l-xl', '', 'rounded-tr-xl', '', 'rounded-br-xl'];

	const stats = [
		{ value: '5', label: 'Bedrooms' },
		{ value: '4.5', label: 'Bathrooms' },
		{ value: '4,850', label: 'Sq Ft' },
		{ value: '0.8', label: 'Acres' }
	];

	// The original's shadcn Button (size default) and Badge, as plain classes.
	const button =
		'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border bg-clip-padding px-2.5 text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px';
	const buttonDefault = `${button} border-transparent bg-primary text-primary-foreground`;
	const buttonOutline = `${button} border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50`;
	const badge =
		'inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap';
</script>

<svelte:head>
	<title>Real estate listing — ramka-svelte</title>
</svelte:head>

{#snippet description()}
	A property page in the style of Airbnb or Zillow: a hero grid for the first five photos, then an
	&quot;all photos&quot; gallery below. The lightbox opens a horizontally-snapping
	<code class="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">Lightbox.Slides</code
	>
	viewport over all 10 photos, with
	<code class="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800"
		>scrollTriggerIntoView</code
	>
	set to instant on close so the morph target is always on screen.
{/snippet}

<ExampleShell title="Real estate listing" {description}>
	<Lightbox.Root loop scrollTriggerIntoView={{ type: 'onClose', behavior: 'instant' }}>
		<div class="max-w-5xl py-4 pb-12">
			<div class="grid aspect-[2.2/1] grid-cols-[2fr_1fr_1fr] grid-rows-2 gap-1">
				{#each propertyPhotos.slice(0, 5) as photo, i (photo.id)}
					<Lightbox.Trigger
						index={i}
						class="{i === 0
							? 'row-span-2'
							: ''} block cursor-pointer border-none bg-transparent p-0 {triggerFocusClass} {heroCornerClass[
							i
						]}"
					>
						{#snippet children({ image })}
							<img
								{@attach image}
								src={photo.thumb}
								alt={photo.alt}
								width={photo.width}
								height={photo.height}
								class="block size-full object-cover {heroCornerClass[i]}"
							/>
						{/snippet}
					</Lightbox.Trigger>
				{/each}
			</div>

			<div class="mt-6 flex flex-wrap items-start justify-between gap-6">
				<div class="min-w-[320px] flex-1">
					<div class="mb-1 flex items-baseline gap-2">
						<span class="{badge} bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
							Active
						</span>
						<span class="text-xs text-muted-foreground">Listed 3 days ago</span>
					</div>

					<h1 class="mb-1 text-3xl font-semibold tracking-tight">The Olive Grove Residence</h1>
					<p class="mb-4 text-sm text-muted-foreground">742 Hillcrest Drive, Montecito, CA 93108</p>

					<div class="flex gap-6 border-y border-border py-4">
						{#each stats as stat (stat.label)}
							<div class="text-center">
								<div class="text-xl leading-none font-bold">{stat.value}</div>
								<div class="mt-1 text-xs text-muted-foreground">{stat.label}</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="flex w-[280px] shrink-0 flex-col gap-3 rounded-xl border border-border p-4">
					<div class="text-3xl leading-none font-bold">$4,250,000</div>
					<div class="text-xs text-muted-foreground">Est. $18,420/mo with 20% down</div>
					<div class="h-px w-full shrink-0 bg-border" role="separator"></div>
					<div class="flex items-center gap-3">
						<span
							class="relative flex size-10 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten"
						>
							<img
								src="/photos/agent-claire.jpg"
								alt="Claire Rousseau"
								class="aspect-square size-full rounded-full object-cover"
							/>
						</span>
						<div>
							<div class="text-sm font-semibold">Claire Rousseau</div>
							<div class="text-xs text-muted-foreground">Montecito Luxury Realty</div>
						</div>
					</div>
					<button type="button" class={buttonDefault}>Contact Agent</button>
					<button type="button" class={buttonOutline}>Schedule Tour</button>
				</div>
			</div>

			<div class="mt-8">
				<h3 class="mb-3 text-xl font-semibold tracking-tight">About This Property</h3>
				<p class="mb-3 text-sm leading-relaxed">
					Perched on a sun-drenched hillside with unobstructed ocean and mountain views, The Olive
					Grove Residence is a masterful blend of contemporary architecture and Mediterranean
					warmth. Designed by acclaimed architect Rafael Mendes, the home flows seamlessly between
					indoor and outdoor living through walls of retractable glass that frame the Santa Ynez
					Mountains to the north and the Pacific to the south.
				</p>
				<p class="mb-3 text-sm leading-relaxed">
					The open-plan living and dining area features 12-foot ceilings, white oak floors, and a
					sculptural fireplace that anchors the space. The chef&apos;s kitchen is outfitted with
					Gaggenau appliances, a waterfall marble island, and a butler&apos;s pantry with wine
					refrigeration. Five bedroom suites are spread across two levels, with the primary
					occupying the entire upper wing.
				</p>
			</div>

			<div class="mt-8">
				<h3 class="mb-3 text-xl font-semibold tracking-tight">Features &amp; Amenities</h3>
				<div class="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
					{#each amenities as a (a)}
						<div class="flex items-center gap-2 text-sm">
							<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"></span>
							{a}
						</div>
					{/each}
				</div>
			</div>

			<div class="my-8 h-px w-full shrink-0 bg-border" role="separator"></div>

			<div>
				<h3 class="mb-4 text-xl font-semibold tracking-tight">All Photos</h3>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
					{#each propertyPhotos.slice(5) as photo, i (photo.id)}
						<Lightbox.Trigger
							index={i + 5}
							crossfade="both"
							class="block rounded-lg bg-transparent p-0 {triggerFocusClass}"
						>
							{#snippet children({ image, morph })}
								<div {@attach morph} class="relative overflow-hidden rounded-lg">
									<img
										{@attach image}
										src={photo.thumb}
										alt={photo.alt}
										width={photo.width}
										height={photo.height}
										class="block aspect-[3/2] w-full object-cover"
									/>
									<div
										class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pt-4 pb-2"
									>
										<span class="text-xs font-medium text-white">{photo.label}</span>
									</div>
								</div>
							{/snippet}
						</Lightbox.Trigger>
					{/each}
				</div>
			</div>

			<div class="mt-8 text-center text-xs text-muted-foreground">
				{propertyPhotos.length} photos · Listing courtesy of Montecito Luxury Realty
			</div>
		</div>

		<LightboxGallery items={propertyPhotos} ariaLabel="Property photos" backdrop="solid" />
	</Lightbox.Root>
</ExampleShell>
