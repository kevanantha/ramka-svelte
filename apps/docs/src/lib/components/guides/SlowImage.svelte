<!--
  Destination image for the guide demos. It loads through /api/slow-image
  (~500ms, uncached) so placeholders and morph handoffs show on every open.
-->
<script lang="ts">
	const LOAD_DELAY_MS = 500;

	let {
		src,
		alt,
		width,
		height,
		style,
		priority = true
	}: {
		src: string;
		alt: string;
		width: number;
		height: number;
		/** e.g. a blur LQIP background, only when the index has no trigger image. */
		style?: string;
		/** Eager for the open slide; lazy keeps preload neighbors from fetching early. */
		priority?: boolean;
	} = $props();

	const nonce = $props.id();
	// Built assets are absolute URLs on the client (root-relative on the
	// server); the proxy only serves same-origin paths.
	const path = $derived(new URL(src, 'http://local').pathname);
	// Like next/image's blur placeholder, the LQIP background goes once the
	// full image has loaded.
	let loaded = $state(false);
</script>

<img
	src="/api/slow-image?ms={LOAD_DELAY_MS}&url={encodeURIComponent(path)}&n={encodeURIComponent(
		nonce
	)}"
	{alt}
	{width}
	{height}
	sizes="100vw"
	fetchpriority={priority ? 'high' : undefined}
	loading={priority ? undefined : 'lazy'}
	draggable="false"
	class="select-none"
	style={loaded ? undefined : style}
	onload={() => (loaded = true)}
/>
