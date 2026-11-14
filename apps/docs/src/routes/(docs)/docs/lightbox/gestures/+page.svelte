<script lang="ts">
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Command from '@lucide/svelte/icons/command';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import CodeBlock from '#lib/components/docs/CodeBlock.svelte';
	import DocsLink from '#lib/components/docs/DocsLink.svelte';
	import DocsPager from '#lib/components/docs/DocsPager.svelte';
	import DocsSection from '#lib/components/docs/DocsSection.svelte';
	import DocsShell from '#lib/components/docs/DocsShell.svelte';
	import Kbd from '#lib/components/docs/Kbd.svelte';
	import KbdGroup from '#lib/components/docs/KbdGroup.svelte';
	import PageMeta from '#lib/components/docs/PageMeta.svelte';
	import PropSectionTitle from '#lib/components/docs/PropSectionTitle.svelte';
	import type { DocsTocItem } from '#lib/components/docs/types.js';
	import { lightboxApiHref as api, lightboxDocsPages as pages } from '#lib/content/docs-pages.js';
	import openCloseCss from 'excerpt:styles/open-close.css';
	import pullProgressCss from 'excerpt:styles/pull-progress.css';
	import zoomBridge from 'excerpt:excerpts/zoom-bridge.svelte';

	const toc: DocsTocItem[] = [
		{ id: 'pull', title: 'Pull-to-dismiss' },
		{ id: 'zoom', title: 'Zoom' },
		{ id: 'keyboard', title: 'Keyboard & focus' },
		{ id: 'matrix', title: 'Interaction matrix' }
	];

	const matrix = [
		['Idle, zoom = 1', 'Allowed', 'Allowed', 'Allowed'],
		['Zoomed > 1', 'Blocked', 'Allowed', 'Arrows pan; buttons still navigate'],
		['Slides flinging', 'Blocked', 'Blocked', 'Blocked until settle'],
		['Pulling', 'Active', 'Should idle', 'Should idle']
	];
</script>

<PageMeta
	title="Gestures and pull to dismiss"
	description="Swipe navigation and pull to dismiss in the ramka Svelte lightbox: native scroll snapping, pull progress CSS variables, snap-back timing, and open/close fades."
/>

{#snippet description()}
	Pull-to-dismiss, zoom/pan, and keyboard ownership. Part of
	<DocsLink href={pages.overview.href}>Lightbox</DocsLink>. For the usual gallery chrome (pull,
	zoom, keyboard) see the <DocsLink href="/presets/default">Default preset</DocsLink>.
{/snippet}

{#snippet pullTitle()}
	<PropSectionTitle partHref={api.content} part="Content" prop="pullToClose" sectionId="pull" />
{/snippet}

<DocsShell title="Gestures" {description} {toc}>
	<DocsSection id="pull" title={pullTitle}>
		<p>
			Content enables pull-to-dismiss by default (<code class="text-xs">pullToClose</code>). Drag
			down (touch) or wheel-dismiss (trackpad) scales the surface and sets
			<code class="text-xs">data-pulling</code> /
			<code class="text-xs">data-pull-dismissing</code> plus
			<code class="text-xs">--lightbox-pull-progress</code> (0→1).
		</p>
		<ul class="list-disc space-y-2 pl-5">
			<li>
				Hit target is Stage-wide (or Content when Stage is omitted) — letterbox and empty Stage area
				can start a pull, matching trackpad wheel. Interactive controls (buttons, links, inputs,
				<code class="text-xs">[data-ramka-no-pull]</code>) keep their press. Side panels outside
				Stage do not start a pull.
			</li>
			<li>
				Disabled while zoomed above 1×, and while Slides is scrolling until <code class="text-xs"
					>scrollend</code
				>
				(so a gallery swipe that turns vertical cannot pull mid-gesture).
			</li>
			<li>
				Backdrop is optional — when used, nest it inside <DocsLink href={api.portal}
					>Portal</DocsLink
				>
				beside Content. Pull still works if you omit Backdrop.
			</li>
		</ul>
		<p>
			Open/close fades live on <code class="text-xs">.lightbox-demo-backdrop</code> /
			<code class="text-xs">.lightbox-demo-content</code> (<code class="text-xs"
				>src/lib/styles/open-close.css</code
			>). Pull then modulates the open scrim (media stays opaque) via
			<code class="text-xs">pull-progress.css</code>.
		</p>
		<p>
			When a pull is released short of the threshold, the surface springs back and the library
			publishes
			<code class="text-xs">--lightbox-pull-snap-duration</code> /
			<code class="text-xs">--lightbox-pull-snap-easing</code> for the duration of that spring.
			Reference them in your <code class="text-xs">transition</code> (with your open/close values as
			the fallbacks, as below) and anything keyed to
			<code class="text-xs">--lightbox-pull-progress</code> — backdrop opacity, chrome, blur — eases back
			on the exact same curve and duration as the item, automatically.
		</p>
		<CodeBlock excerpt={openCloseCss} />
		<CodeBlock excerpt={pullProgressCss} />
	</DocsSection>

	<DocsSection id="zoom" title="Zoom">
		<p>
			Wrap media in <DocsLink href={api.zoom}>Zoom</DocsLink> (inside Item, typically inside Slide). Prefer
			<DocsLink href={api.media}>Media</DocsLink> inside Zoom so pan / maxZoom use the sized content box.
			Supports pinch, pan, double-tap, ctrl/meta+wheel (or
			<code class="text-xs">scrollToZoom</code>), and keyboard pan when focused.
		</p>
		<p>
			Zoomed media can cover the full Content surface only if Slide → Item → Zoom → Media fill that
			box — see
			<DocsLink href="{pages.composition.href}#media-layout">Composition → Media layout</DocsLink>.
		</p>
		<p>
			<DocsLink href={api.zoomIn}>ZoomIn</DocsLink> /
			<DocsLink href={api.zoomOut}>ZoomOut</DocsLink> can sit in toolbar chrome outside Zoom — they target
			the <em>active</em> slide via Root’s active-zoom bridge. Content reflects
			<code class="text-xs">data-zooming</code> / <code class="text-xs">data-zoomed</code> for styling.
		</p>
		<CodeBlock excerpt={zoomBridge} />
	</DocsSection>

	<DocsSection id="keyboard" title="Keyboard & focus">
		<p><DocsLink href={api.content}>Content</DocsLink> is the keyboard authority while open:</p>
		<ul class="list-disc space-y-2 pl-5">
			<li><Kbd>Esc</Kbd> — close</li>
			<li>
				<KbdGroup>
					<Kbd label="Left arrow"><ArrowLeft /></Kbd>
					<Kbd label="Right arrow"><ArrowRight /></Kbd>
					<Kbd label="Up arrow"><ArrowUp /></Kbd>
					<Kbd label="Down arrow"><ArrowDown /></Kbd>
				</KbdGroup>
				— pan when zoomed, otherwise previous/next
			</li>
			<li>
				<Kbd label="Plus"><Plus /></Kbd> / <Kbd label="Minus"><Minus /></Kbd> /
				<Kbd>0</Kbd> — zoom in / out / reset (active Zoom)
			</li>
		</ul>
		<p>
			Image zoom uses unmodified keys only:
			<KbdGroup>
				<Kbd label="Command"><Command /></Kbd>
				<Kbd label="Plus"><Plus /></Kbd>
			</KbdGroup>
			/
			<KbdGroup>
				<Kbd>Ctrl</Kbd>
				<Kbd label="Plus"><Plus /></Kbd>
			</KbdGroup>
			and the other modified combos are left to the browser, so page zoom (WCAG 1.4.4 text resize) keeps
			working while the dialog is open.
		</p>
		<p>
			Focus is trapped in the dialog; closing restores focus to the opening Trigger. Native page
			pinch-zoom is blocked while Content is mounted so it does not fight
			<code class="text-xs">Lightbox.Zoom</code>.
		</p>
	</DocsSection>

	<DocsSection id="matrix" title="Interaction matrix">
		<div class="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
			<table class="w-full text-left text-sm">
				<thead class="bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
					<tr>
						<th class="px-3 py-2 font-medium">State</th>
						<th class="px-3 py-2 font-medium">Pull</th>
						<th class="px-3 py-2 font-medium">Zoom chrome / buttons</th>
						<th class="px-3 py-2 font-medium">Prev / Next</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-neutral-200 dark:divide-neutral-800">
					{#each matrix as [state, ...cells] (state)}
						<tr>
							<td class="px-3 py-2 text-neutral-700 dark:text-neutral-300">{state}</td>
							{#each cells as cell, i (i)}<td class="px-3 py-2">{cell}</td>{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</DocsSection>

	<DocsPager prev={pages.viewTransitions} next={pages.zoom} />
</DocsShell>
