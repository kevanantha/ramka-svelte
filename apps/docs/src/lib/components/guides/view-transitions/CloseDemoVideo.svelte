<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';

	let {
		src,
		poster,
		ready,
		width,
		height
	}: { src: string; poster: string; ready: boolean; width: number; height: number } = $props();

	let video = $state<HTMLVideoElement | null>(null);

	// Play once the open settles; rewind when the lightbox starts closing.
	$effect(() => {
		if (!video) return;
		if (ready) {
			video.play().catch(() => {});
		} else {
			video.pause();
			video.currentTime = 0;
		}
	});
</script>

<Lightbox.Zoom>
	<Lightbox.Media {width} {height} class="overflow-hidden rounded-xl">
		<video
			bind:this={video}
			{src}
			{poster}
			{width}
			{height}
			controls
			playsinline
			muted
			preload="metadata"
			class="object-cover"
		></video>
	</Lightbox.Media>
</Lightbox.Zoom>
