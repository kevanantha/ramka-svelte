<!--
  An iMessage-style attachment stack: one Trigger wraps all three photos and
  morphTo="origin" closes back onto the stack from any slide.
  Port of the original docs' app/(docs)/examples/lightbox/text-message.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import ExampleShell from '#lib/components/ExampleShell.svelte';
	import LightboxGallery from '#lib/components/LightboxGallery.svelte';
	import { triggerFocusClass } from '#lib/components/chrome.js';
	import type { GalleryItem } from '#lib/photos.js';

	function message(name: string, alt: string): GalleryItem {
		return {
			src: `/photos/${name}.jpg`,
			thumb: `/photos/thumbs/${name}.jpg`,
			width: 1200,
			height: 1600,
			alt,
			caption: alt
		};
	}

	const messageImages = [
		message('msg1', 'Screenshot of a changelog notification'),
		message('msg2', 'Screenshot of a code review discussion'),
		message('msg3', 'Screenshot of a pull request overview')
	];

	const stackRotations = [0, 2, -6];
	const stackOffsets = [
		{ x: 0, y: 0 },
		{ x: 10, y: -4 },
		{ x: -12, y: 8 }
	];

	const code = 'rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800';
</script>

<ExampleShell title="Text message">
	{#snippet description()}
		A single <code class={code}>Lightbox.Trigger</code>
		wraps an entire stack of attachments. Paired with
		<code class={code}>morphTo="origin"</code>, the close animation always returns to the stack no
		matter which attachment is active.
	{/snippet}

	<div
		class="flex min-h-[80vh] items-end justify-end rounded-2xl bg-neutral-100 p-6 dark:bg-neutral-900"
	>
		<Lightbox.Root morphTo="origin">
			<div class="flex max-w-[300px] flex-col items-end gap-3">
				<span class="text-[10px] font-medium tracking-[0.05em] text-neutral-500 uppercase">
					Today at 11:11 AM
				</span>

				<div
					class="rounded-[20px] rounded-br-[4px] bg-blue-500 px-4 py-2 text-sm font-medium text-white"
				>
					some imgs
				</div>

				<Lightbox.Trigger
					index={0}
					crossfade="close"
					class="relative block h-80 w-[260px] cursor-pointer rounded-2xl border-none bg-transparent p-0 {triggerFocusClass}"
				>
					{#snippet children({ morph, image })}
						<div class="absolute -inset-5">
							{#each messageImages as img, i (img.src)}
								{@const offset = stackOffsets[i] ?? { x: 0, y: 0 }}
								<!-- Only the top of the stack is the morph source and placeholder. -->
								<img
									src={img.thumb}
									alt={img.alt}
									width={img.width}
									height={img.height}
									loading="lazy"
									decoding="async"
									{@attach i === 0 ? morph : null}
									{@attach i === 0 ? image : null}
									class="absolute block h-[280px] w-[200px] rounded-2xl object-cover shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
									style:left="50%"
									style:top="50%"
									style:transform="translate(-50%, -50%) translate({offset.x}px, {offset.y}px)
									rotate({stackRotations[i] ?? 0}deg)"
									style:z-index={messageImages.length - i}
								/>
							{/each}
						</div>
					{/snippet}
				</Lightbox.Trigger>

				<div class="flex items-center gap-2 text-xs text-neutral-500">
					<svg
						aria-hidden="true"
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						class="opacity-40"
					>
						<rect
							x="1"
							y="3"
							width="6"
							height="5"
							rx="1"
							stroke="currentColor"
							stroke-width="1.2"
						/>
						<rect
							x="5"
							y="1"
							width="6"
							height="5"
							rx="1"
							stroke="currentColor"
							stroke-width="1.2"
							fill="currentColor"
							fill-opacity="0"
						/>
						<rect
							x="9"
							y="3"
							width="6"
							height="5"
							rx="1"
							stroke="currentColor"
							stroke-width="1.2"
							fill="currentColor"
							fill-opacity="0"
						/>
						<rect
							x="3"
							y="8"
							width="10"
							height="7"
							rx="1.5"
							stroke="currentColor"
							stroke-width="1.2"
							fill="currentColor"
							fill-opacity="0"
						/>
					</svg>
					<span>{messageImages.length} attachments</span>
				</div>
			</div>

			<LightboxGallery items={messageImages} ariaLabel="Message attachments" />
		</Lightbox.Root>
	</div>
</ExampleShell>
