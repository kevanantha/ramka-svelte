<!--
	Test-only Slides host (ramka's `SlidesHost`): renders `count` slides, each
	wrapping `children(index)`, and installs jsdom geometry after mount so
	discrete navigation does not fight a zeroed scroller. React's version wraps
	each child element in a Slide; a snippet has no children to split, so the
	slide index is the snippet's argument instead.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Lightbox from '../../../lib/lightbox';
	import type { LightboxSlidesProps } from '../../../lib/lightbox';
	import type { TextDirection } from '../../../lib/lightbox/lightbox-direction';
	import { applySlideGeometry, SLIDE_TEST_WIDTH } from '../slides-test-utils';

	let {
		count = 1,
		slideCount,
		dir = 'ltr',
		ref = $bindable(null),
		children,
		...props
	}: Omit<LightboxSlidesProps, 'children'> & {
		/** Slides to render. @default 1 */
		count?: number;
		/** Geometry slide count, when it differs from `count`. */
		slideCount?: number;
		/** Lay the mocked geometry out for this direction (match Root's `dir`). */
		dir?: TextDirection;
		children?: Snippet<[number]>;
	} = $props();

	$effect(() => {
		if (ref) applySlideGeometry(ref, slideCount ?? count, SLIDE_TEST_WIDTH, dir);
	});
</script>

<Lightbox.Slides bind:ref {...props}>
	{#each { length: count }, i (i)}
		<Lightbox.Slide>{@render children?.(i)}</Lightbox.Slide>
	{/each}
</Lightbox.Slides>
