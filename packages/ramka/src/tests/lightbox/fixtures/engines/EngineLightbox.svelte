<!--
	The minimal `TestLightbox` of engine-warm-up.test.tsx and
	lazy-runtime-failure.test.tsx: one plain Trigger and a Content, nothing that
	would pull an engine in on its own.
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';

	let { viewTransition = true }: { viewTransition?: boolean } = $props();
</script>

<Lightbox.Root {viewTransition}>
	<Lightbox.Trigger index={0} data-testid="trigger">Open</Lightbox.Trigger>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Test lightbox">Content</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
