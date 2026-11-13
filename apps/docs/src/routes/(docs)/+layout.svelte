<!-- Docs shell: floating sidebar (md+), sticky mobile nav, page column.
     Pages under (docs) bring their own frame (DocsShell, ExampleShell, …). -->
<script lang="ts">
	import type { LayoutProps } from './$types';
	import MobileNav from '#lib/components/docs/MobileNav.svelte';
	import Sidebar from '#lib/components/docs/Sidebar.svelte';

	let { children }: LayoutProps = $props();
</script>

<div class="isolate flex min-h-screen">
	<Sidebar />
	<div class="flex min-w-0 flex-1 flex-col">
		<MobileNav />
		<main class="min-w-0 flex-1">{@render children()}</main>
	</div>
</div>
