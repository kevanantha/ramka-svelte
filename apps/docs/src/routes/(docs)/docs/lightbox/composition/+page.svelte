<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import CodeBlock from '#lib/components/docs/CodeBlock.svelte';
	import DocsLink from '#lib/components/docs/DocsLink.svelte';
	import DocsPager from '#lib/components/docs/DocsPager.svelte';
	import DocsSection from '#lib/components/docs/DocsSection.svelte';
	import DocsShell from '#lib/components/docs/DocsShell.svelte';
	import Kbd from '#lib/components/docs/Kbd.svelte';
	import KbdGroup from '#lib/components/docs/KbdGroup.svelte';
	import PageMeta from '#lib/components/docs/PageMeta.svelte';
	import type { DocsTocItem } from '#lib/components/docs/types.js';
	import { lightboxApiHref as api, lightboxDocsPages as pages } from '#lib/content/docs-pages.js';
	import chromeComposition from 'excerpt:excerpts/chrome-composition.svelte';
	import stageMorph from 'excerpt:excerpts/stage-morph.svelte';
	import stageSidePanel from 'excerpt:excerpts/stage-side-panel.svelte';
	import mediaFitBox from 'excerpt:excerpts/media-fit-box.svelte';
	import slideTrack from 'excerpt:excerpts/slide-track.css';
	import slidesNesting from 'excerpt:excerpts/slides-nesting.svelte';
	import stylexAttrs from 'excerpt:excerpts/stylex-attrs.svelte';

	const toc: DocsTocItem[] = [
		{ id: 'slides', title: 'Slides + Zoom' },
		{ id: 'media-layout', title: 'Media layout' },
		{ id: 'stage', title: 'Stage (split layouts)' },
		{ id: 'chrome', title: 'Chrome' },
		{ id: 'stylex', title: 'Styling with StyleX' },
		{ id: 'item-count', title: 'Dynamic itemCount' }
	];
</script>

<PageMeta
	title="Composition"
	description="Compose ramka lightbox primitives into any layout: Slides with Zoom, media fill and fit-box sizing, Stage for split layouts, custom chrome, and dynamic item counts."
/>

{#snippet description()}
	Default to Slides + Zoom (swipe carousel with pinch zoom), size media to fill Content, then layer
	chrome. Part of <DocsLink href={pages.overview.href}>Lightbox</DocsLink>.
{/snippet}

<DocsShell title="Composition" {description} {toc}>
	<DocsSection id="slides" title="Slides + Zoom">
		<p>
			Prefer <DocsLink href={api.slides}>Slides</DocsLink> +
			<DocsLink href={api.slide}>Slide</DocsLink> for a swipeable snap carousel wired to the active index
			— this is the layout used by nearly every docs demo and example. Slide boxes stay mounted;
			<code class="text-xs">preload</code> gates heavy Item content.
		</p>
		<ul class="list-disc space-y-2 pl-5">
			<li>
				Nesting rule: put <code class="text-xs">Item</code> and
				<DocsLink href={api.zoom}>Zoom</DocsLink> <em>inside</em> each
				<code class="text-xs">Slide</code>. Pull transforms the item, not the snap box.
			</li>
			<li>
				User flings set an internal scroll lock so pull-to-dismiss, zoom chrome, and discrete
				prev/next do not fight the carousel mid-gesture.
			</li>
			<li>
				Scroll-driven index changes report <code class="text-xs">onValueChange</code> with
				<code class="text-xs">source: 'scroll'</code> — see
				<DocsLink href={api.types}>NavigationSource</DocsLink>.
			</li>
			<li>
				The Item <code class="text-xs">children</code> snippet's <code class="text-xs">active</code>
				is the current index (drive expensive work here). <code class="text-xs">visible</code> means the
				item is in the preload window — use it for lightweight prefetch, not video autoplay.
			</li>
		</ul>
		<CodeBlock excerpt={slidesNesting} />
		<CodeBlock excerpt={slideTrack} />
	</DocsSection>

	<DocsSection id="media-layout" title="Media layout">
		<p>
			Ramka is <em>cosmetically</em> unstyled — colors and chrome are yours — but Media may apply
			<em>structural</em> fit-box styles via <code class="text-xs">width</code>/<code
				class="text-xs">height</code
			>
			(same idea as SvelteKit's <code class="text-xs">&lt;enhanced:img&gt;</code>) so the morph
			target has a correct aspect before pixels load. Slide width is consumer CSS too —
			<DocsLink href={api.slide}>Slide</DocsLink> only bakes in snap alignment (<code
				class="text-xs">scroll-snap-align: center</code
			>, <code class="text-xs">scroll-snap-stop: always</code>); you size each snap box. For a
			full-bleed carousel, use <code class="text-xs">flex: 0 0 100%</code> and
			<code class="text-xs">min-width: 100%</code> on each slide (see snippet below). Snug /
			variable-width tracks use a different width formula — see the
			<DocsLink href="/presets/default">Default preset</DocsLink>. Item and Zoom fill the slide
			content box; size the stack so when Zoom scales past 1× the image can cover the viewport and
			is not clipped by a shorter ancestor.
		</p>
		<ul class="list-disc space-y-2 pl-5">
			<li>
				<code class="text-xs">Content</code> — fullscreen surface (<code class="text-xs"
					>fixed inset-0</code
				> / full dialog)
			</li>
			<li>
				<code class="text-xs">Slides</code> — <code class="text-xs">flex-1</code> (or equivalent stretch)
			</li>
			<li>
				<code class="text-xs">Slide</code> —
				<code class="text-xs">flex: 0 0 100%; min-width: 100%</code> for a full-bleed track;
				<code class="text-xs">h-full</code> for height; put chrome / safe-area insets here as padding
				(not on Zoom)
			</li>
			<li>
				<code class="text-xs">Item</code> — already fills the Slide (<code class="text-xs"
					>width/height: 100%</code
				>)
			</li>
			<li><code class="text-xs">Zoom</code> — already fills + centers (structural)</li>
			<li>
				<code class="text-xs">Media</code> — sized fit-box (morph + placeholder host);
				<code class="text-xs">&lt;img&gt;</code> / <code class="text-xs">&lt;video&gt;</code> inside
			</li>
		</ul>
		<p>
			Keep Close, Counter, Caption, and thumbnails as <em>absolutely positioned siblings</em> of
			Slides (see Chrome below) — not in-flow above or below Zoom. Resting insets belong on Slide
			padding / safe-area so zoomed media can still paint into that padding under chrome. Gesture
			details live in
			<DocsLink href={pages.gestures.href}>Gestures</DocsLink>.
		</p>
		<p>
			Set HTML <code class="text-xs">width</code> and <code class="text-xs">height</code> on the
			destination <code class="text-xs">&lt;img&gt;</code> (from known pixel dims or CMS metadata)
			so the box and aspect ratio exist <em>before</em> pixels load. That avoids CLS, keeps the
			morph target sized on slow networks, and prevents an unloaded
			<code class="text-xs">size: auto</code>
			image from collapsing to 0×0 (which can skip or weaken the open morph). When dimensions are unknown,
			see <DocsLink href="/examples/lightbox/url-synced-state">URL-synced state</DocsLink>. For
			mixed media (photos plus WebGL) with <DocsLink href={api.root}>onBeforeOpen</DocsLink> preheat,
			see
			<DocsLink href="/examples/lightbox/3d-models">3D models</DocsLink>.
		</p>
		<p>
			To fill the maximum available space without distorting the source aspect ratio, nest Media
			under
			<DocsLink href={api.zoom}>Lightbox.Zoom</DocsLink> (a size container for
			<code class="text-xs">cqw</code>/<code class="text-xs">cqh</code>) and pass
			<code class="text-xs">width</code>/<code class="text-xs">height</code> to
			<DocsLink href={api.media}>Lightbox.Media</DocsLink>. Media applies the inscribed fit-box (<code
				class="text-xs">min(100cqw, 100cqh × w/h)</code
			>
			+ <code class="text-xs">aspect-ratio: w / h</code>). Or put HTML
			<code class="text-xs">width</code>/<code class="text-xs">height</code> on the child image and
			omit the Media props — Media derives the box. When the box matches the source aspect, child
			<code class="text-xs">object-fit</code> is a no-op and Media’s grid stretch fills the box (no
			<code class="text-xs">size-full</code> needed on a direct media child). Put border-radius on Media
			(morph target). Leave chrome outside Media. Resting insets belong on Slide padding / safe-area so
			zoomed media can paint into that padding under chrome.
		</p>
		<CodeBlock excerpt={mediaFitBox} />
		<p>
			Live compositions: <DocsLink href="/presets/default">Default preset</DocsLink>,
			<DocsLink href="/presets/twitter">Twitter preset</DocsLink>,
			<DocsLink href="/presets/stories">Stories preset</DocsLink>,
			<DocsLink href="/examples/lightbox/photos-app">Photos app</DocsLink>.
		</p>
	</DocsSection>

	<DocsSection id="stage" title="Stage (split layouts)">
		<p>
			Use <DocsLink href={api.stage}>Lightbox.Stage</DocsLink> when Content holds more than the media
			pane — for example a thread sidebar beside the gallery. Stage is the media interaction surface:
			trackpad wheel pull-to-dismiss, Zoom pan cover geometry, and
			<KbdGroup>
				<Kbd label="Left arrow"><ArrowLeft /></Kbd>
				<Kbd label="Right arrow"><ArrowRight /></Kbd>
			</KbdGroup>
			/ <Kbd>Home</Kbd> / <Kbd>End</Kbd> gallery navigation are scoped to it. Content remains the dialog
			shell (focus trap, <Kbd>Esc</Kbd>, zoom shortcuts). Place side panels as siblings of Stage
			under Content so they keep native scroll and their own keyboard behavior. When Stage is
			omitted, Content itself is the stage (default full-bleed viewers need no change).
		</p>
		<CodeBlock excerpt={stageSidePanel} />
		<p>
			Use the Stage <code class="text-xs">morph</code> attachment when the open/close morph should capture
			the Stage surface (or a descendant) instead of the active item — a 9:16 stories frame, the slides
			track, or a custom bezel. Decode and the thumbnail placeholder stay on the item.
		</p>
		<CodeBlock excerpt={stageMorph} />
		<p>
			Live examples: <DocsLink href="/presets/twitter">Twitter preset</DocsLink>,
			<DocsLink href="/presets/stories">Stories preset</DocsLink>.
		</p>
	</DocsSection>

	<DocsSection id="chrome" title="Chrome">
		<p>
			The site default viewer is Slides + Zoom with Counter (top-left), Close / ZoomIn / ZoomOut,
			Caption, and a desktop <DocsLink href={api.thumbnailStrip}>ThumbnailStrip</DocsLink> (scroll-linked
			midline track) as siblings inside <DocsLink href={api.content}>Content</DocsLink>. Midline
			selection chrome is plain consumer markup on the strip root. Prefer
			<DocsLink href={api.thumbnailGroup}>ThumbnailGroup</DocsLink> when you want a static tablist without
			scroll-linking. Thumbnails register by <code class="text-xs">index</code> like Triggers. Put
			Backdrop and Content in <DocsLink href={api.portal}>Portal</DocsLink>. Stacking follows Base
			UI:
			<code class="text-xs">isolation: isolate</code> on the app layout root, and — when using
			<code class="text-xs">keepMounted</code> — a consumer <code class="text-xs">z-index</code> on
			the Portal host (e.g. <code class="text-xs">class="relative z-[1]"</code>). Inside the portal,
			document order keeps Backdrop under Content.
		</p>
		<CodeBlock excerpt={chromeComposition} />
		<p>Packaged as a skin: <DocsLink href="/presets/default">Default preset</DocsLink>.</p>
	</DocsSection>

	<DocsSection id="stylex" title="Styling with StyleX">
		<p>
			Parts are unstyled and pass <code class="text-xs">class</code>,
			<code class="text-xs">style</code>, and every other attribute through to their element, so
			<code class="text-xs">{'{...stylex.attrs(styles.x)}'}</code> works on every part as is. There
			is no <code class="text-xs">sx</code> prop, and ramka has no StyleX dependency. Compile StyleX
			with <code class="text-xs">@stylexjs/unplugin</code> as in StyleX's
			<DocsLink href="https://stylexjs.com/docs/learn/installation/vite/sveltekit"
				>SvelteKit guide</DocsLink
			>: its <code class="text-xs">enforce: undefined</code> makes the plugin run on compiled Svelte
			output instead of the raw <code class="text-xs">.svelte</code> source.
		</p>
		<ul class="list-disc space-y-2 pl-5">
			<li>
				Structural styles (for example Slides' <code class="text-xs">display: flex</code> and
				<code class="text-xs">scroll-snap-type</code>, or Media's fit-box) are inline, so a StyleX
				class cannot override them. Override one with <code class="text-xs">!important</code> in a global
				stylesheet.
			</li>
			<li>
				Style state through the published data attributes —
				<code class="text-xs">data-open</code> / <code class="text-xs">data-closed</code> on
				<DocsLink href={api.content}>Content</DocsLink> and
				<DocsLink href={api.backdrop}>Backdrop</DocsLink>, <code class="text-xs">data-active</code>
				on Item, and the rest in the <DocsLink href={pages.api.href}>API reference</DocsLink> — with StyleX
				conditions such as <code class="text-xs">':is([data-open])'</code>, or with a global class.
			</li>
			<li>
				To mix in a global class, pass both to <code class="text-xs">class</code>:
				<code class="text-xs">{"class={['my-class', stylex.attrs(styles.x).class]}"}</code>. A
				spread and a separate <code class="text-xs">class</code> attribute would replace one another.
			</li>
		</ul>
		<CodeBlock excerpt={stylexAttrs} />
	</DocsSection>

	<DocsSection id="item-count" title="Dynamic itemCount">
		<p>
			Items register on mount. The root <code class="text-xs">itemCount</code> is derived from
			registered items — indices do not need to be contiguous, but Counter, loop edges, and preload
			distance all use that count. Prefer dense <code class="text-xs">0…n-1</code> indexes unless you
			intentionally leave holes.
		</p>
	</DocsSection>

	<DocsPager prev={pages.stateLifecycle} next={pages.sveltekitImage} />
</DocsShell>
