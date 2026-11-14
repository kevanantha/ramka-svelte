<!--
  Debug: controlled View Transition motion test. A single real photo on a
  non-scrollable page with a real close button — the minimal real-world case
  for recording and comparing morph trajectories on devices.
  Port of the original docs' app/debug/vt-motion.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import X from '@lucide/svelte/icons/x';
	import { chromeButton } from '#lib/components/chrome.js';

	const PHOTO = {
		src: '/photos/ramka-vt-motion.jpg',
		thumb: '/photos/thumbs/ramka-vt-motion.jpg',
		width: 1200,
		height: 800,
		alt: 'Motion test photo'
	};
</script>

<svelte:head>
	<title>VT motion — ramka-svelte</title>
</svelte:head>

<div
	class="fixed inset-0 flex flex-col items-center justify-center gap-10 overflow-hidden bg-background"
>
	<!-- One-tap variant switching for on-device A/B recording sessions. -->
	<div class="flex gap-4 text-lg">
		<a class="rounded border px-4 py-2" href="/debug/vt-motion?vtab=q7">Variant Q7</a>
		<a class="rounded border px-4 py-2" href="/debug/vt-motion?vtab=k2">Variant K2</a>
	</div>

	<Lightbox.Root viewTransition>
		<Lightbox.Trigger index={0}>
			{#snippet children({ image })}
				<img
					{@attach image}
					src={PHOTO.thumb}
					alt={PHOTO.alt}
					width={240}
					height={160}
					loading="eager"
					draggable="false"
					class="rounded-lg select-none"
				/>
			{/snippet}
		</Lightbox.Trigger>

		<Lightbox.Portal>
			<Lightbox.Backdrop class="lightbox-demo-backdrop fixed inset-0" />
			<Lightbox.Content
				aria-label="VT motion debug"
				class="lightbox-demo-content fixed inset-0 flex flex-col overscroll-contain outline-none"
			>
				<Lightbox.Slides aria-label="Images" class="lightbox-demo-slides flex-1">
					<Lightbox.Slide class="h-full">
						<Lightbox.Item index={0}>
							<Lightbox.Zoom>
								<Lightbox.Media width={PHOTO.width} height={PHOTO.height}>
									<img
										src={PHOTO.src}
										alt={PHOTO.alt}
										width={PHOTO.width}
										height={PHOTO.height}
										loading="eager"
										draggable="false"
										class="select-none"
									/>
								</Lightbox.Media>
							</Lightbox.Zoom>
						</Lightbox.Item>
					</Lightbox.Slide>
				</Lightbox.Slides>

				<div class="absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] right-3 z-30">
					<Lightbox.Close class={chromeButton} aria-label="Close">
						<X aria-hidden="true" class="h-[18px] w-[18px]" strokeWidth={2.25} />
					</Lightbox.Close>
				</div>
			</Lightbox.Content>
		</Lightbox.Portal>
	</Lightbox.Root>
</div>
