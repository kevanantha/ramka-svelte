<script lang="ts">
	import DocsDemo from '#lib/components/docs/DocsDemo.svelte';
	import DocsLink from '#lib/components/docs/DocsLink.svelte';
	import DocsPager from '#lib/components/docs/DocsPager.svelte';
	import DocsSection from '#lib/components/docs/DocsSection.svelte';
	import DocsShell from '#lib/components/docs/DocsShell.svelte';
	import PageMeta from '#lib/components/docs/PageMeta.svelte';
	import type { DocsTocItem } from '#lib/components/docs/types.js';
	import CreateHandleDemo from '#lib/components/guides/CreateHandleDemo.svelte';
	import ControlledStateDemo from '#lib/components/guides/ControlledStateDemo.svelte';
	import LifecycleCallbacksDemo from '#lib/components/guides/LifecycleCallbacksDemo.svelte';
	import { lightboxApiHref as api, lightboxDocsPages as pages } from '#lib/content/docs-pages.js';
	import controlledState from 'excerpt:excerpts/controlled-state.svelte';
	import createHandle from 'excerpt:excerpts/create-handle.svelte';
	import lifecycleCallbacks from 'excerpt:excerpts/lifecycle-callbacks.svelte';

	const toc: DocsTocItem[] = [
		{ id: 'controlled', title: 'Controlled state' },
		{ id: 'imperative', title: 'Imperative API' },
		{ id: 'lifecycle', title: 'Lifecycle callbacks' },
		{ id: 'before-open', title: 'onBeforeOpen' },
		{ id: 'before-close', title: 'onBeforeClose' }
	];
</script>

<PageMeta
	title="State and lifecycle"
	description="Controlled and uncontrolled lightbox state in Svelte: bindable open and value props, imperative handles with createHandle, and lifecycle callbacks like onBeforeOpen."
/>

{#snippet description()}
	Control open state and the active index from Svelte,
	<code class="text-xs">createHandle()</code>, or both — and know when callbacks fire. Part of
	<DocsLink href={pages.overview.href}>Lightbox</DocsLink>.
{/snippet}

<DocsShell title="State & lifecycle" {description} {toc}>
	<DocsSection id="controlled" title="Controlled state">
		<p>
			Bind <code class="text-xs">open</code> and <code class="text-xs">value</code> on
			<DocsLink href={api.root}>Root</DocsLink> (<code class="text-xs">bind:open</code>,
			<code class="text-xs">bind:value</code>) to drive the lightbox from URL params, a store, or
			sibling UI, or pass <code class="text-xs">onOpenChange</code> /
			<code class="text-xs">onValueChange</code> to observe it. Omit them for uncontrolled defaults
			(or pass a plain <code class="text-xs">open</code> / <code class="text-xs">value</code>
			without
			<code class="text-xs">bind:</code> as the initial state).
		</p>
		<DocsDemo excerpt={controlledState}>
			<ControlledStateDemo />
		</DocsDemo>
	</DocsSection>

	<DocsSection id="imperative" title="Imperative API">
		<p>
			<DocsLink href={api.createHandle}>Lightbox.createHandle()</DocsLink> lets Triggers and Root live
			apart — pass the same handle to both. Call
			<code class="text-xs">open(index, {'{ triggerId }'})</code> from any button so the open still
			morphs from the matching <DocsLink href={api.trigger}>Trigger</DocsLink>.
		</p>
		<DocsDemo excerpt={createHandle}>
			<CreateHandleDemo />
		</DocsDemo>
	</DocsSection>

	<DocsSection id="lifecycle" title="Lifecycle callbacks">
		<p>
			<code class="text-xs">onOpenChange</code> fires immediately when open flips — use it to sync
			URL or external state. <code class="text-xs">onOpenChangeComplete</code> fires after
			enter/exit motion settles — use it for cleanup and focus.
			<code class="text-xs">onValueChange</code>
			reports the new index plus a
			<DocsLink href={api.types}>NavigationSource</DocsLink> (including
			<code class="text-xs">imperative</code> for handle navigation).
		</p>
		<DocsDemo excerpt={lifecycleCallbacks}>
			<LifecycleCallbacksDemo />
		</DocsDemo>
	</DocsSection>

	<DocsSection id="before-open" title="onBeforeOpen">
		<p>
			When View Transitions are on, open is
			<em>prepare → optional image decode → optional onBeforeOpen → morph</em>. Use
			<DocsLink href={api.root}>Root</DocsLink>’s <code class="text-xs">onBeforeOpen</code> to delay
			the morph until custom media is ready (iframe <code class="text-xs">load</code>, video, WebGL,
			…). It runs after the lightbox is mounted hidden — so destination nodes exist — and before
			<code class="text-xs">startViewTransition</code>.
		</p>
		<p>
			Keep <code class="text-xs">awaitImageDecode</code> for photos (default
			<code class="text-xs">true</code>). For non-image destinations, pass
			<code class="text-xs">awaitImageDecode={'{false}'}</code> and wait in
			<code class="text-xs">onBeforeOpen</code>. Bound your own timeout;
			<code class="text-xs">ctx.signal</code> aborts if a newer open/close wins. See
			<DocsLink href="/examples/lightbox/3d-models">3D models</DocsLink>.
		</p>
	</DocsSection>

	<DocsSection id="before-close" title="onBeforeClose">
		<p>
			<code class="text-xs">onBeforeClose</code> fires synchronously when close begins — and, with
			View Transitions, <em>before</em> the old snapshot is captured. Use it to freeze custom media
			(<code class="text-xs">video.pause()</code>, stop a rAF loop) so the close morph isn’t a
			mid-frame. Unlike <code class="text-xs">onBeforeOpen</code>, it cannot delay close.
			<code class="text-xs">onOpenChange(false)</code> is too late for this: it runs inside the transition
			callback, after the snapshot.
		</p>
	</DocsSection>

	<DocsPager prev={pages.overview} next={pages.composition} />
</DocsShell>
