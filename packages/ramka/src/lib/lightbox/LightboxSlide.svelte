<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	/** One snap position in `Lightbox.Slides`. Size it with your own CSS. */
	export interface LightboxSlideProps extends HTMLAttributes<HTMLDivElement> {
		ref?: HTMLDivElement | null;
	}
</script>

<script lang="ts">
	let { ref = $bindable(null), style, children, ...rest }: LightboxSlideProps = $props();
</script>

<div
	bind:this={ref}
	{...rest}
	style="scroll-snap-align: center; scroll-snap-stop: always; overflow: visible; position: relative;{style ??
		''}"
	data-ramka-slide=""
>
	{@render children?.()}
</div>
