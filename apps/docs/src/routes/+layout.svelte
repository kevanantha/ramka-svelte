<script lang="ts">
	import './layout.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<title>ramka-svelte — The lightbox for Svelte</title>
	<meta
		name="description"
		content="Headless Svelte lightbox with View Transitions morph animations and native scroll swiping. Unstyled, accessible image gallery primitives. A port of ramka."
	/>
</svelte:head>

{@render children()}
