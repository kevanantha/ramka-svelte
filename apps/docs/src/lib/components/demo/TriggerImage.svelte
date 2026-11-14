<!--
  Trigger thumbnail that registers itself as the trigger's image through
  getLightboxTriggerContext(), so it becomes the flash-free placeholder for
  the item it opens without threading the children snippet's arguments.
-->
<script lang="ts">
	import { getLightboxTriggerContext } from 'ramka-svelte';

	let {
		src,
		alt,
		width,
		height,
		class: className = 'block h-28 w-full rounded-2xl object-cover'
	}: { src: string; alt: string; width?: number; height?: number; class?: string } = $props();

	const trigger = getLightboxTriggerContext();
</script>

<img {@attach trigger?.image} {src} {alt} {width} {height} class={className} />
