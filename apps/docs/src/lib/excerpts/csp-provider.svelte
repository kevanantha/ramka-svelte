<!-- @docs-excerpt-title src/routes/+layout.svelte -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import type { Snippet } from 'svelte'; // @docs-replace import type { LayoutProps } from './$types';

	// The same per-request value your hook put in the CSP header,
	// returned from +layout.server.ts.
	let { data, children }: { data: { nonce?: string }; children: Snippet } = $props(); // @docs-replace let { data, children }: LayoutProps = $props();
</script>

<Lightbox.CSPProvider nonce={data.nonce}>
	{@render children()}
</Lightbox.CSPProvider>
