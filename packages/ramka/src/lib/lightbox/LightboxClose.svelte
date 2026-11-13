<script lang="ts" module>
	import type { HTMLButtonAttributes } from 'svelte/elements';

	export interface LightboxCloseProps extends HTMLButtonAttributes {
		ref?: HTMLButtonElement | null;
	}
</script>

<script lang="ts">
	import { getLightboxContext } from './lightbox-state.svelte';
	import { accessibleNameWarning } from './accessible-name-warning';

	let { ref = $bindable(null), onclick, children, ...rest }: LightboxCloseProps = $props();

	const lightbox = getLightboxContext();
</script>

<button
	bind:this={ref}
	{@attach accessibleNameWarning('Lightbox.Close')}
	type="button"
	{...rest}
	data-ramka-close=""
	onclick={(event) => {
		onclick?.(event);
		if (event.defaultPrevented) return;
		// `detail === 0` — activated by keyboard, so return focus with a ring.
		lightbox.setOpen(false, { focusVisible: event.detail === 0 });
	}}
>
	{@render children?.()}
</button>
