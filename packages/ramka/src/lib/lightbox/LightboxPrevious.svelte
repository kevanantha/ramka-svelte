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
	{disabled}
	data-disabled={disabled ? '' : undefined}
	{...rest}
	data-ramka-previous=""
	onclick={(event) => {
		onclick?.(event);
		// The element's own state, so a consumer's `disabled` holds too (React
		// never calls onClick on a disabled button; a dispatched click here would).
		if (disabled || event.currentTarget.disabled) return;
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
