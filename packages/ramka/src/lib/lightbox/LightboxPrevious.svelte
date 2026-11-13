<script lang="ts" module>
	import type { HTMLButtonAttributes } from 'svelte/elements';

	export interface LightboxPreviousProps extends HTMLButtonAttributes {
		ref?: HTMLButtonElement | null;
	}
</script>

<script lang="ts">
	import { getLightboxContext } from './lightbox-state.svelte';
	import { accessibleNameWarning } from './accessible-name-warning';

	let { ref = $bindable(null), onclick, children, ...rest }: LightboxPreviousProps = $props();

	const lightbox = getLightboxContext();

	/** Auto-disables at the boundary unless the Root loops. */
	const disabled = $derived(!lightbox.loop && lightbox.activeIndex <= 0);
</script>

<button
	bind:this={ref}
	{@attach accessibleNameWarning('Lightbox.Previous')}
	type="button"
	{...rest}
	{disabled}
	data-ramka-previous=""
	data-disabled={disabled ? '' : undefined}
	onclick={(event) => {
		onclick?.(event);
		if (event.defaultPrevented || disabled) return;
		const count = lightbox.itemCount;
		lightbox.navigate(
			lightbox.loop
				? (lightbox.activeIndex - 1 + count) % count
				: Math.max(lightbox.activeIndex - 1, 0),
			'button'
		);
	}}
>
	{@render children?.()}
</button>
