<script lang="ts">
	import DocsDemo from '#lib/components/docs/DocsDemo.svelte';
	import DocsLink from '#lib/components/docs/DocsLink.svelte';
	import DocsPager from '#lib/components/docs/DocsPager.svelte';
	import DocsSection from '#lib/components/docs/DocsSection.svelte';
	import DocsShell from '#lib/components/docs/DocsShell.svelte';
	import PageMeta from '#lib/components/docs/PageMeta.svelte';
	import type { DocsTocItem } from '#lib/components/docs/types.js';
	import NonImageTriggerDemo from '#lib/components/guides/sveltekit-image/NonImageTriggerDemo.svelte';
	import PlusNDemo from '#lib/components/guides/sveltekit-image/PlusNDemo.svelte';
	import TriggerBlurDemo from '#lib/components/guides/sveltekit-image/TriggerBlurDemo.svelte';
	import { lightboxApiHref as api, lightboxDocsPages as pages } from '#lib/content/docs-pages.js';
	import enhancedImgDo from 'excerpt:excerpts/enhanced-img-do.svelte';
	import enhancedImgDont from 'excerpt:excerpts/enhanced-img-dont.svelte';
	import enhancedImgNonImageTrigger from 'excerpt:excerpts/enhanced-img-non-image-trigger.svelte';
	import enhancedImgPlusN from 'excerpt:excerpts/enhanced-img-plus-n.svelte';

	const toc: DocsTocItem[] = [
		{ id: 'rule', title: 'When to blur' },
		{ id: 'do', title: 'Do' },
		{ id: 'dont', title: 'Don’t' },
		{ id: 'no-trigger-image', title: 'No trigger image' },
		{ id: 'checklist', title: 'Checklist' }
	];

	const strong = 'font-medium text-neutral-800 dark:text-neutral-200';
</script>

<PageMeta
	title="SvelteKit image lightbox"
	description="Use @sveltejs/enhanced-img inside a Svelte lightbox: responsive images, when blurred LQIP placeholders help and when they hurt, and morphing view transitions with enhanced:img."
/>

{#snippet description()}
	Use <code class="text-xs">@sveltejs/enhanced-img</code> with Ramka. Lightbox-side blur depends on
	whether that item has a trigger image. Part of
	<DocsLink href={pages.overview.href}>Lightbox</DocsLink>.
{/snippet}

<DocsShell title="SvelteKit images" {description} {toc}>
	<div
		class="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
	>
		The demos on this page intentionally delay every full-size lightbox image by ~500ms and bypass
		the browser cache on each open, so you can watch the placeholder mechanisms work on every open —
		no DevTools throttling needed.
	</div>

	<DocsSection id="rule" title="When to blur">
		<p>
			<code class="text-xs">&lt;enhanced:img&gt;</code> has no built-in blur, so these demos paint a
			tiny inlined LQIP (<code class="text-xs">?w=8&amp;format=webp&amp;inline</code>) behind the
			image with the same blur filter as next/image — a two-line helper you can copy from the
			samples. Decide <strong class={strong}>per item index</strong>, not per gallery. Ramka paints
			an open bridge only when that index has a registered trigger image (the
			<code class="text-xs">image</code> attachment).
		</p>
		<div class="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
			<table class="w-full text-left text-sm">
				<thead class="bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
					<tr>
						<th class="px-3 py-2 font-medium">Image</th>
						<th class="px-3 py-2 font-medium">Blur LQIP</th>
						<th class="px-3 py-2 font-medium">Why</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-neutral-200 dark:divide-neutral-800">
					<tr>
						<td class="px-3 py-2 text-neutral-700 dark:text-neutral-300">
							Image inside <code class="text-xs">Lightbox.Trigger</code>
						</td>
						<td class="px-3 py-2">Yes</td>
						<td class="px-3 py-2">
							A regular page image — the LQIP covers its own load. Ramka never paints a placeholder
							here.
						</td>
					</tr>
					<tr>
						<td class="px-3 py-2 text-neutral-700 dark:text-neutral-300">
							Image inside <code class="text-xs">Lightbox.Thumbnail</code>
						</td>
						<td class="px-3 py-2">Yes</td>
						<td class="px-3 py-2">
							Same as a trigger: a regular page image. Ramka bridges only the destination media,
							never strip thumbnails, so the LQIP is the only thing covering the thumb’s own load.
						</td>
					</tr>
					<tr>
						<td class="px-3 py-2 text-neutral-700 dark:text-neutral-300">
							Lightbox image, index <em>has</em> a trigger image (<code class="text-xs">image</code>
							attachment)
						</td>
						<td class="px-3 py-2">No</td>
						<td class="px-3 py-2">
							While the full-size image loads, Ramka paints the trigger’s image — already decoded
							and on screen — onto a canvas <em>behind</em> the lightbox image. The LQIP renders as a
							background on the lightbox image itself, in front of that canvas, so blur here hides a sharp
							placeholder behind a blurry one.
						</td>
					</tr>
					<tr>
						<td class="px-3 py-2 text-neutral-700 dark:text-neutral-300">
							Lightbox image, index has <em>no</em> trigger image
						</td>
						<td class="px-3 py-2">Yes</td>
						<td class="px-3 py-2">
							Ramka has no trigger image to paint, so the LQIP is the only loading placeholder (see
							<DocsLink href="#no-trigger-image">No trigger image</DocsLink>).
						</td>
					</tr>
				</tbody>
			</table>
		</div>
		<p class="mt-4">
			<strong class={strong}>One exception:</strong>
			pages that server-render the lightbox already open (deep links). The bridge is painted on gesture
			opens — a server-rendered open has no gesture, and before hydration nothing is decoded to paint
			from — while the inlined LQIP is in the server HTML itself. For those visits, destination blur is
			the only placeholder that can exist on first paint: enable it for the deep-link visit and keep destinations
			clean for regular visits (decide once per mount, like the portal container). See the URL-synced
			state example.
		</p>
	</DocsSection>

	<DocsSection id="do" title="Do">
		<p>
			Import the same asset with <code class="text-xs">?enhanced</code> for trigger and destination,
			plus its LQIP. Blur the trigger; leave the destination clean. Square trigger crop is CSS only
			— keep source aspect matched to Media. See
			<DocsLink href="{pages.viewTransitions.href}#source-aspect"
				>View transitions → Source aspect</DocsLink
			>
			for a live Do / Don't.
		</p>
		<DocsDemo excerpt={enhancedImgDo}>
			<TriggerBlurDemo kind="do" />
		</DocsDemo>
	</DocsSection>

	<DocsSection id="dont" title="Don’t">
		<p>
			A blur LQIP on a lightbox image whose index has a trigger image covers Ramka’s bridge while
			the full image loads.
		</p>
		<DocsDemo excerpt={enhancedImgDont}>
			<TriggerBlurDemo kind="dont" />
		</DocsDemo>
	</DocsSection>

	<DocsSection id="no-trigger-image" title="No trigger image">
		<p>
			If an index has no trigger <code class="text-xs">image</code> attachment, Ramka has nothing to paint.
			Use a destination blur LQIP for those items only — not for siblings that still have a trigger image.
		</p>

		<h3 class="mt-8 text-sm font-semibold text-neutral-900 dark:text-neutral-100">+N extras</h3>
		<p class="mt-2">
			Open the +N tile, then swipe past the triggered photos. Overflow slides show the LQIP; indexes
			0–1 stay on Ramka’s trigger-image bridge. Close uses
			<DocsLink href="{pages.viewTransitions.href}#morph-to">morphTo="closest"</DocsLink>.
		</p>
		<div class="mt-4">
			<DocsDemo excerpt={enhancedImgPlusN}>
				<PlusNDemo />
			</DocsDemo>
		</div>

		<h3 class="mt-10 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
			Non-image trigger
		</h3>
		<p class="mt-2">
			Initials / swatches have a Trigger but no trigger image. Blur on the lightbox image is the
			loading placeholder.
		</p>
		<div class="mt-4">
			<DocsDemo excerpt={enhancedImgNonImageTrigger}>
				<NonImageTriggerDemo />
			</DocsDemo>
		</div>
	</DocsSection>

	<DocsSection id="checklist" title="Checklist">
		<ul class="list-disc space-y-2 pl-5">
			<li>
				Per index: trigger image → no destination blur; no trigger image → destination blur OK
			</li>
			<li>
				Match Media <code class="text-xs">width</code>/<code class="text-xs">height</code> to the
				image source aspect (<code class="text-xs">photo.img.w</code> /
				<code class="text-xs">photo.img.h</code>)
			</li>
			<li>
				Trigger and destination must share that intrinsic aspect (CSS-crop the tile; don't serve a
				differently-cropped file) —
				<DocsLink href="{pages.viewTransitions.href}#source-aspect">Source aspect</DocsLink>
			</li>
			<li>
				Trigger: <code class="text-xs">{'{@attach image}'}</code> (or
				<DocsLink href={api.getTriggerContext}>getLightboxTriggerContext</DocsLink>); blur OK on the
				trigger image
			</li>
			<li>
				<code class="text-xs">ThumbnailStrip</code> thumbs are regular images — blur OK, same as triggers
			</li>
			<li>
				Prefer <code class="text-xs">fetchpriority="high"</code> on the open destination — see
				<DocsLink href={pages.viewTransitions.href}>View transitions</DocsLink>
			</li>
			<li><code class="text-xs">sizes="100vw"</code> for fullscreen</li>
			<li>
				Skip <code class="text-xs">size-full</code> — Media already fills a direct image child
			</li>
		</ul>
	</DocsSection>

	<DocsPager prev={pages.composition} next={pages.viewTransitions} />
</DocsShell>
