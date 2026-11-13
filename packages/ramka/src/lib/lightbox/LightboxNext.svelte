<script lang="ts" module>
	import type { HTMLButtonAttributes } from 'svelte/elements';

	export interface LightboxNextProps extends HTMLButtonAttributes {
		ref?: HTMLButtonElement | null;
	}
</script>

<script lang="ts">
	import { getLightboxContext } from './lightbox-state.svelte';
	import { accessibleNameWarning } from './accessible-name-warning';

	let { ref = $bindable(null), onclick, children, ...rest }: LightboxNextProps = $props();

	const lightbox = getLightboxContext();

	/** Auto-disables at the boundary unless the Root loops. */
	const disabled = $derived(!lightbox.loop && lightbox.activeIndex >= lightbox.itemCount - 1);
</script>

<button
	bind:this={ref}
	{@attach accessibleNameWarning('Lightbox.Next')}
	type="button"
	{...rest}
	{disabled}
	data-ramka-next=""
	data-disabled={disabled ? '' : undefined}
	onclick={(event) => {
		onclick?.(event);
		if (event.defaultPrevented || disabled) return;
		const count = lightbox.itemCount;
		lightbox.navigate(
			lightbox.loop
				? (lightbox.activeIndex + 1) % count
				: Math.min(lightbox.activeIndex + 1, count - 1),
			'button'
		);
	}}
>
	{@render children?.()}
</button>
