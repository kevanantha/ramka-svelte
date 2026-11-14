<!-- A clip inside the lightbox: plays while the viewer is open and any part of
     the video is on screen (snug neighbours peek in). -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import { mutedPlayback } from './video';

	let {
		src,
		poster,
		enabled,
		width,
		height
	}: {
		src: string;
		poster: string;
		/** The lightbox is open — still gated by viewport intersection. */
		enabled: boolean;
		width: number;
		height: number;
	} = $props();

	// Optimistic true so open doesn't hitch waiting for the first IO callback.
	let inView = $state(true);

	function observeView(el: HTMLElement) {
		const io = new IntersectionObserver(
			([entry]) => {
				inView = entry?.isIntersecting ?? false;
			},
			{ root: null, threshold: 0 }
		);
		io.observe(el);
		return () => io.disconnect();
	}
</script>

<Lightbox.Zoom>
	<Lightbox.Media {width} {height} class="overflow-hidden rounded-none md:rounded-lg">
		<video
			{@attach observeView}
			{@attach mutedPlayback(enabled && inView)}
			{src}
			{poster}
			{width}
			{height}
			muted
			playsinline
			autoplay
			loop
			preload="auto"
			disableremoteplayback
			aria-label="Muted video"
			class="object-cover"
		></video>
	</Lightbox.Media>
</Lightbox.Zoom>
