<!--
  App-level demo, not part of the copy-paste package.

  A horizontally scrolling story tray. Each circle is a `Lightbox.Trigger`
  showing the author’s portrait. `crossfade="both"`: the face is not the
  9:16 frame, so a geometry morph would look wrong. Closing from a story
  whose trigger has scrolled off-screen recenters it for the close.
-->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import Gallery, { pauseStoryVideos, type StoryItem } from './Gallery.svelte';

	function mixkit(id: number): string {
		return `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`;
	}

	/** Mixkit’s first generated 720p still — matches the opening frame of `${id}-720.mp4`. */
	function mixkitPoster(id: number): string {
		return `https://assets.mixkit.co/videos/${id}/${id}-thumb-720-0.jpg`;
	}

	function portrait(gender: 'women' | 'men', n: number): string {
		return `https://randomuser.me/api/portraits/${gender}/${n}.jpg`;
	}

	function story(
		id: string,
		name: string,
		time: string,
		avatar: string,
		mixkitId: number
	): StoryItem {
		return {
			id,
			name,
			time,
			avatar,
			poster: mixkitPoster(mixkitId),
			video: mixkit(mixkitId),
			alt: `${name}’s story`,
			width: 720,
			height: 1280
		};
	}

	const stories: StoryItem[] = [
		story('maya', 'Maya', '2h', portrait('women', 44), 40065),
		story('julian', 'Julian', '5h', portrait('men', 32), 43000),
		story('noor', 'Noor', '8h', portrait('women', 68), 43785),
		story('eli', 'Eli', '12h', portrait('men', 75), 40064),
		story('sam', 'Sam', '1d', portrait('men', 22), 44852),
		story('priya', 'Priya', '1d', portrait('women', 21), 50000),
		story('tomas', 'Tomás', '2d', portrait('men', 11), 44600),
		story('aisha', 'Aisha', '2d', portrait('women', 17), 40066)
	];
</script>

<div class="w-full max-w-xl">
	<!-- The avatar is a different image from the 9:16 frame, so every trigger
	     crossfades: skip the decode wait so the dissolve starts immediately.
	     The tray is a horizontal scroller: recenter the active circle between
	     snapshot captures so the close dissolve lands on-screen. -->
	<Lightbox.Root
		loop
		viewTransition="snappy"
		awaitImageDecode={false}
		onBeforeClose={pauseStoryVideos}
		scrollTriggerIntoView={[
			{ type: 'onOpenComplete', behavior: 'instant', inline: 'nearest' },
			{ type: 'onChange', behavior: 'instant', inline: 'nearest' }
		]}
	>
		<p class="px-1 text-[13px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
			Stories
		</p>
		<ul class="mt-3 flex snap-x snap-proximity scrollbar-none gap-4 overflow-x-auto px-1 pb-1">
			{#each stories as item, i (item.id)}
				<li class="flex w-16 shrink-0 snap-center scroll-mx-4 flex-col items-center gap-1.5">
					<Lightbox.Trigger
						index={i}
						class="stl-trigger"
						aria-label="{item.name}’s story"
						crossfade="both"
					>
						{#snippet children({ image })}
							<img
								{@attach image}
								src={item.avatar}
								alt=""
								width={56}
								height={56}
								class="block size-14 rounded-full object-cover"
								draggable="false"
							/>
						{/snippet}
					</Lightbox.Trigger>
					<span
						class="w-full truncate text-center text-[11px] leading-tight text-neutral-600 dark:text-neutral-400"
					>
						{item.name}
					</span>
				</li>
			{/each}
		</ul>

		<Gallery items={stories} ariaLabel="Stories" />
	</Lightbox.Root>
</div>
