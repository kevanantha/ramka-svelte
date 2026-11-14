<!--
  A Three.js product grid: each tile morphs into an orbitable model.
  Port of the original docs' app/(docs)/examples/lightbox/3d-models.
-->
<script lang="ts">
	import ExampleShell from '#lib/components/ExampleShell.svelte';
	import ProductLightbox from './ProductLightbox.svelte';
	import { products } from './products';

	const code = 'rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800';
</script>

<ExampleShell
	title="3D models"
	docsHref="/docs/lightbox/state-lifecycle#before-open"
	docsLabel="State & lifecycle · onBeforeOpen"
>
	{#snippet description()}
		Each tile is its own
		<code class={code}>Lightbox.Root</code>
		with a single-item gallery — Three.js canvases in the trigger and
		<code class={code}>Lightbox.Media</code>.
		<code class={code}>onBeforeOpen</code>
		waits for the prepared lightbox canvas to paint a synced frame before the morph (spin stays live,
		like close). Rotate only (no zoom); orbit stays in sync with the grid tile.
		<code class={code}>pullToClose={'{false}'}</code>
		so vertical drag stays with orbit.
	{/snippet}

	<div class="max-w-3xl">
		<div class="py-5">
			<div
				class="text-xs font-medium tracking-[0.08em] text-neutral-500 uppercase dark:text-neutral-400"
			>
				Object studio
			</div>
			<h2 class="mt-1 text-2xl font-semibold tracking-tight">Khronos sample assets</h2>
			<p class="mt-2 max-w-md text-sm text-neutral-500 dark:text-neutral-400">
				Open any model. Orbit stays in sync with the grid tile.
			</p>
		</div>

		<div class="grid grid-cols-2 gap-5">
			{#each products as product (product.id)}
				<ProductLightbox {product} />
			{/each}
		</div>
	</div>
</ExampleShell>
