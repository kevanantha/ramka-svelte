<!-- React's `Frame`: a nested wrapper that attaches Stage's `morph` through context. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getLightboxStageContext } from '../../../../lib/lightbox/LightboxStage.svelte';

	let { children }: { children?: Snippet } = $props();

	const stage = getLightboxStageContext();
</script>

<div {@attach (node) => stage?.morph(node)} data-testid="frame">
	{@render children?.()}
</div>
