<script lang="ts">
	import CodeBlock from '#lib/components/docs/CodeBlock.svelte';
	import DocsDemo from '#lib/components/docs/DocsDemo.svelte';
	import DocsLink from '#lib/components/docs/DocsLink.svelte';
	import DocsPager from '#lib/components/docs/DocsPager.svelte';
	import DocsSection from '#lib/components/docs/DocsSection.svelte';
	import DocsShell from '#lib/components/docs/DocsShell.svelte';
	import PageMeta from '#lib/components/docs/PageMeta.svelte';
	import PropSectionTitle from '#lib/components/docs/PropSectionTitle.svelte';
	import type { DocsTocItem } from '#lib/components/docs/types.js';
	import AspectDemo from '#lib/components/guides/view-transitions/AspectDemo.svelte';
	import CrossfadeDemos from '#lib/components/guides/view-transitions/CrossfadeDemos.svelte';
	import MorphToDemos from '#lib/components/guides/view-transitions/MorphToDemos.svelte';
	import { lightboxApiHref as api, lightboxDocsPages as pages } from '#lib/content/docs-pages.js';
	import crossfadeBoth from 'excerpt:excerpts/crossfade-both.svelte';
	import minimalMorph from 'excerpt:excerpts/minimal-morph.svelte';
	import morphAspectDo from 'excerpt:excerpts/morph-aspect-do.svelte';
	import morphAspectDont from 'excerpt:excerpts/morph-aspect-dont.svelte';
	import morphToClosest from 'excerpt:excerpts/morph-to-closest.svelte';
	import scrollTriggerIntoView from 'excerpt:excerpts/scroll-trigger-into-view.svelte';
	import viewTransitionPreset from 'excerpt:excerpts/view-transition-preset.svelte';

	const toc: DocsTocItem[] = [
		{ id: 'enable', title: 'Morph attachments' },
		{ id: 'source-aspect', title: 'Source aspect' },
		{ id: 'crossfade', title: 'Trigger crossfade' },
		{ id: 'morph-to', title: 'Root morphTo' },
		{ id: 'scroll-trigger', title: 'scrollTriggerIntoView' },
		{ id: 'programmatic', title: 'Programmatic open' },
		{ id: 'styling', title: 'Styling' },
		{ id: 'timing-presets', title: 'Timing presets' },
		{ id: 'injected-css', title: 'Injected CSS' }
	];

	const strong = 'font-medium text-neutral-800 dark:text-neutral-200';
</script>

<PageMeta
	title="Morph view transitions"
	description="Shared element View Transitions in a Svelte lightbox: morph attachments, trigger crossfade, source aspect handling, morphTo, scrollTriggerIntoView, and programmatic opens."
/>

{#snippet description()}
	Morph open/close between a trigger and the active item with the browser View Transitions API. Part
	of <DocsLink href={pages.overview.href}>Lightbox</DocsLink>. Unsupported browsers, reduced-motion,
	and low-end devices fall back to a plain fade.
{/snippet}

{#snippet crossfadeTitle()}
	<PropSectionTitle partHref={api.trigger} part="Trigger" prop="crossfade" sectionId="crossfade" />
{/snippet}
{#snippet morphToTitle()}
	<PropSectionTitle partHref={api.root} part="Root" prop="morphTo" sectionId="morph-to" />
{/snippet}
{#snippet scrollTriggerTitle()}
	<PropSectionTitle
		partHref={api.root}
		part="Root"
		prop="scrollTriggerIntoView"
		sectionId="scroll-trigger"
	/>
{/snippet}

<DocsShell title="View transitions" {description} {toc}>
	<DocsSection id="enable" title="Morph attachments">
		<p>
			Morph is on by default (<code class="text-xs">viewTransition</code> on
			<DocsLink href={api.root}>Root</DocsLink>). Pass
			<code class="text-xs">viewTransition={'{false}'}</code> to opt out. Recommended destination
			shape: <DocsLink href={api.media}>Lightbox.Media</DocsLink> around the
			<code class="text-xs">&lt;img&gt;</code> / <code class="text-xs">&lt;video&gt;</code> (sized
			fit-box = morph target + placeholder host). On
			<DocsLink href={api.trigger}>Trigger</DocsLink>, take the attachments from its
			<code class="text-xs">children</code> snippet:
		</p>
		<ul class="list-disc space-y-2 pl-5">
			<li>
				<code class="text-xs">image</code> — <code class="text-xs">{'{@attach image}'}</code> on the
				Trigger thumb <code class="text-xs">&lt;img&gt;</code> whose pixels bridge the morph. Media auto-discovers
				the destination image (or video poster). Lets open reuse an already-decoded bitmap so the transition
				doesn’t flash empty space.
			</li>
			<li>
				<code class="text-xs">morph</code> — optional escape hatch when morph bounds should differ from
				Media / the image (tile with overlay, swatch + label).
			</li>
		</ul>
		<p>
			Nested wrappers can use
			<DocsLink href={api.getTriggerContext}>getLightboxTriggerContext</DocsLink> /
			<DocsLink href={api.getItemContext}>getLightboxItemContext</DocsLink> instead of threading the snippet
			arguments. Use <code class="text-xs">awaitImageDecode</code> on
			<DocsLink href={api.root}>Root</DocsLink> when you want a short wait for the destination image before
			the morph starts (default ~200ms cap).
		</p>
		<CodeBlock excerpt={minimalMorph} />
	</DocsSection>

	<DocsSection id="source-aspect" title="Source aspect">
		<p>
			The morph snapshots whatever pixels are on the trigger <code class="text-xs">&lt;img&gt;</code
			>
			and interpolates them into the destination Media box. That only looks like one photo when both sides
			share the <em>same intrinsic aspect ratio</em> — the same file, or srcset candidates of that
			file. A square tile is fine; crop it with CSS (<code class="text-xs">object-fit: cover</code
			>), not by baking <code class="text-xs">w=h&amp;fit=crop</code> into a different image.
		</p>
		<p>
			A CDN-cropped 1∶1 thumb against a 3∶2 lightbox image will reframe mid-animation: Ramka paints
			the square thumb into the landscape box, then the full file lands with a different crop.
			Element boxes may differ. Intrinsic aspect must not.
		</p>
		<p>These demos delay the lightbox image by ~500ms so the handoff is visible on every open.</p>
		<DocsDemo excerpt={morphAspectDo}>
			<AspectDemo kind="do" />
		</DocsDemo>
		<div class="mt-4">
			<DocsDemo excerpt={morphAspectDont}>
				<AspectDemo kind="dont" />
			</DocsDemo>
		</div>
	</DocsSection>

	<DocsSection id="crossfade" title={crossfadeTitle}>
		<p>
			Controls whether the morph <em>dissolves</em> between trigger and item snapshots or hard-cuts geometry
			only.
		</p>
		<ul class="list-disc space-y-2 pl-5">
			<li>
				<strong class={strong}>Omit (default)</strong>
				— hard-cut. Best when trigger and item show the <em>same</em> picture at the
				<em>same intrinsic aspect</em> (a CSS <code class="text-xs">object-cover</code> window or a
				smaller srcset is fine; a CDN-baked crop that changes the aspect is not — see
				<DocsLink href="#source-aspect">Source aspect</DocsLink>). Leaves
				<code class="text-xs">data-ramka-crossfade</code> unset on
				<code class="text-xs">&lt;html&gt;</code> during the transition.
			</li>
			<li>
				<code class="text-xs">both</code> — dissolve on open and close (stack → single photo, +N overlay
				tile, etc.).
			</li>
			<li>
				<code class="text-xs">open</code> / <code class="text-xs">close</code> — dissolve in one
				direction only (e.g. poster → live video often wants <code class="text-xs">close</code>).
			</li>
		</ul>
		<p>
			Keep trigger and item images on <code class="text-xs">object-fit: cover</code> (or the same
			fit) so crops stay coherent. Put border-radius on the morph target itself — the library
			interpolates
			<code class="text-xs">--lightbox-morph-border-radius-from/to</code> on
			<code class="text-xs">&lt;html&gt;</code>.
		</p>
		<DocsDemo excerpt={crossfadeBoth}>
			<CrossfadeDemos />
		</DocsDemo>
	</DocsSection>

	<DocsSection id="morph-to" title={morphToTitle}>
		<p>Picks which trigger receives the <em>close</em> morph:</p>
		<ul class="list-disc space-y-2 pl-5">
			<li>
				<code class="text-xs">active</code> (default) — trigger for the current active index. No morph
				if that index has no trigger.
			</li>
			<li>
				<code class="text-xs">origin</code> — always the trigger that opened the lightbox (one tile opens
				many items).
			</li>
			<li>
				<code class="text-xs">closest</code> — active index if registered, otherwise the nearest registered
				trigger.
			</li>
		</ul>
		<DocsDemo excerpt={morphToClosest}>
			<MorphToDemos />
		</DocsDemo>
	</DocsSection>

	<DocsSection id="scroll-trigger" title={scrollTriggerTitle}>
		<p>
			When the page scrolls while the lightbox is open, the close morph can land off-screen. Use
			<code class="text-xs">scrollTriggerIntoView</code> to keep the target trigger in view:
		</p>
		<ul class="list-disc space-y-2 pl-5">
			<li>
				<code class="text-xs">onChange</code> — scroll to the active trigger as the index changes (preemptive).
			</li>
			<li>
				<code class="text-xs">onOpenComplete</code> — reposition once open settles (invisible under
				the overlay; <code class="text-xs">instant</code> recommended).
			</li>
			<li>
				<code class="text-xs">onClose</code> — scroll just before the close morph (visible jump at close
				start).
			</li>
		</ul>
		<p>
			Pass one option or an array. Each option also accepts
			<code class="text-xs">block</code> / <code class="text-xs">inline</code> alignment (defaults
			<code class="text-xs">nearest</code>) — use
			<code class="text-xs">inline: 'center'</code> for horizontal snap strips with variable-width
			tiles. Pair with <code class="text-xs">morphTo</code> so the scrolled element is the same one that
			receives the morph.
		</p>
		<CodeBlock excerpt={scrollTriggerIntoView} />
	</DocsSection>

	<DocsSection id="programmatic" title="Programmatic open">
		<p>
			Prefer
			<DocsLink href={api.createHandle}>createHandle()</DocsLink>:
			<code class="text-xs">open(index, {'{ triggerId }'})</code> associates a Trigger that declared
			that <code class="text-xs">id</code> so the open morph can use that element. Without a
			registered trigger (or <code class="text-xs">triggerId</code>), the open falls back to the
			fade path. Trigger clicks still morph. Demo:
			<DocsLink href="{pages.stateLifecycle.href}#imperative"
				>State & lifecycle → Imperative API</DocsLink
			>.
		</p>
	</DocsSection>

	<DocsSection id="styling" title="Styling">
		<p>
			You write <strong class={strong}>zero</strong>
			view-transition CSS: the library injects the structural
			<code class="text-xs">::view-transition-*</code> rules itself (see
			<DocsLink href="#injected-css">Injected CSS</DocsLink>) and writes document hooks during a
			morph so your own skin CSS can react — e.g. keep Backdrop/Content fades on the morph's clock.
			Attribute / CSS-variable tables live under
			<DocsLink href={api.documentVt}>Document (view transitions)</DocsLink>. Hooks:
		</p>
		<ul class="list-disc space-y-2 pl-5">
			<li>
				<code class="text-xs">data-ramka-view-transition</code> —
				<code class="text-xs">opening</code> | <code class="text-xs">closing</code>
			</li>
			<li>
				<code class="text-xs">data-ramka-crossfade</code> — dissolve path (present when Trigger
				<code class="text-xs">crossfade</code> is active for this phase; absent for hard-cut)
			</li>
			<li>
				<code class="text-xs">--lightbox-morph-border-radius-from/to</code>,
				<code class="text-xs">--lightbox-morph-old/new-opacity</code>
			</li>
			<li>
				<code class="text-xs">data-ramka-vt-preset</code>,
				<code class="text-xs">--lightbox-vt-duration</code>,
				<code class="text-xs">--lightbox-vt-easing</code>,
				<code class="text-xs">--lightbox-vt-crossfade-close-easing</code>,
				<code class="text-xs">--lightbox-vt-root-easing</code> — the active timing preset, written
				by the library (see <DocsLink href="#timing-presets">Timing presets</DocsLink>)
			</li>
			<li>
				<DocsLink href={api.trigger}>Trigger</DocsLink>
				<code class="text-xs">data-morph-target</code> /
				<DocsLink href={api.item}>Item</DocsLink>
				<code class="text-xs">data-skip-fade</code> — hide the live morph source and suppress entrance
				fades on the destination while the VT layer is up
			</li>
		</ul>
		<p>
			Motion splits into
			<strong class={strong}>timing</strong>
			(a preset picked on Root — see below) and
			<strong class={strong}>structure</strong>
			(injected by the library). Your CSS only handles cosmetics — and reads the library-written contract
			vars where it wants to stay in sync.
		</p>
	</DocsSection>

	<DocsSection id="timing-presets" title="Timing presets">
		<p>
			Morph duration and easing are chosen with the
			<code class="text-xs">viewTransition</code> prop on
			<DocsLink href={api.root}>Root</DocsLink> — pass a preset name instead of
			<code class="text-xs">true</code>:
		</p>
		<ul class="list-disc space-y-2 pl-5">
			<li>
				<code class="text-xs">"default"</code> — 360ms, sheet curve with a tamed launch (what
				<code class="text-xs">true</code> runs)
			</li>
			<li><code class="text-xs">"snappy"</code> — 340ms, hotter launch; reads quicker</li>
			<li><code class="text-xs">"relaxed"</code> — 400ms, softer launch and longer settle</li>
			<li>
				<code class="text-xs">"spring"</code> — 450ms, critically damped spring; Photos-style settle
			</li>
		</ul>
		<CodeBlock excerpt={viewTransitionPreset} />
		<p>
			Timing is preset-based rather than free-form CSS on purpose: each preset is vetted on-device
			to stay smooth and skip-safe on iOS Safari (including Low Power Mode) and Android, where
			arbitrary curves stutter or teleport. The library publishes the preset timing as
			<code class="text-xs">--lightbox-vt-duration</code> /
			<code class="text-xs">--lightbox-vt-easing</code> /
			<code class="text-xs">--lightbox-vt-root-easing</code> in two places: always on the
			<DocsLink href={api.portal}>Portal</DocsLink> host, and — together with
			<code class="text-xs">data-ramka-vt-preset</code> — on
			<code class="text-xs">documentElement</code> for the duration of a morph. Read those vars in
			your own CSS as the skin's single motion clock (e.g.
			<code class="text-xs">transition: opacity var(--lightbox-vt-duration, 360ms) ease-out</code>
			on Backdrop/Content): during a morph the fades stay in lockstep with it, and on the non-morph paths
			(unsupported browsers, reduced motion, low-end fallback) they still run on the preset's timing;
			do not set the vars yourself.
		</p>
	</DocsSection>

	<DocsSection id="injected-css" title="Injected CSS">
		<p>
			On first <DocsLink href={api.root}>Root</DocsLink> mount the library injects one stylesheet with
			everything a morph structurally needs — no copy-paste block to maintain, and multiple skins on one
			page can never fight over it:
		</p>
		<ul class="list-disc space-y-2 pl-5">
			<li>
				<strong class={strong}>Name isolation</strong>
				— <code class="text-xs">startViewTransition</code> snapshots the whole document, so any page
				element with its own <code class="text-xs">view-transition-name</code> would paint
				<em>over</em> the lightbox. Every name is cleared while
				<code class="text-xs">data-ramka-view-transition</code> is set; the morph target re-applies
				its name inline with <code class="text-xs">!important</code> and stays the only captured group.
			</li>
			<li>
				<strong class={strong}>Morph group</strong>
				— clipping + border-radius interpolation (put radius on the morph target element; JS writes
				<code class="text-xs">--lightbox-morph-border-radius-from/to</code>), timed by the active
				preset.
			</li>
			<li>
				<strong class={strong}>Snapshots</strong>
				— hard-cut by default (<code class="text-xs">object-fit: cover</code>, no UA dissolve); when
				Trigger <code class="text-xs">crossfade</code> sets
				<code class="text-xs">data-ramka-crossfade</code>, the dissolve path (UA fade,
				<code class="text-xs">plus-lighter</code>, <code class="text-xs">object-fit: fill</code>)
				runs on the same preset clock. Open uses the morph ease-out so the destination appears
				promptly; both phases run that complementary dissolve on a shorter window so the outgoing
				snapshot is gone before the size settle (`plus-lighter` stays opaque).
			</li>
			<li>
				<strong class={strong}>Root snapshot</strong>
				— the page-behind crossfade, kept as a <em>single</em> root group (promoting Backdrop /
				Content into named groups tanks Safari). Fade scrim and chrome with live
				<code class="text-xs">opacity</code> transitions instead.
			</li>
			<li>
				<strong class={strong}>Morph-target hide</strong>
				— <code class="text-xs">[data-morph-target]</code> gets
				<code class="text-xs">opacity: 0</code> with a 200ms fade-back (disabled during the transition
				so it can't be captured mid-flight), so the live trigger never shows doubled under the morphing
				snapshot.
			</li>
			<li>
				<strong class={strong}>Thumb-jump crossfade</strong>
				— the element-scoped Slides transition started by ThumbnailStrip's
				<code class="text-xs">selectViewTransition</code>, tunable via
				<code class="text-xs">--lightbox-select-vt-duration/easing</code> on Slides.
			</li>
		</ul>
		<p>
			Everything except name isolation is gated under
			<code class="text-xs">prefers-reduced-motion: no-preference</code>. The stylesheet is inserted
			at the <em>start</em> of <code class="text-xs">&lt;head&gt;</code>, so your own stylesheets
			cascade after it — overriding any injected rule takes an ordinary declaration of equal
			specificity, no <code class="text-xs">!important</code> needed.
		</p>
		<p>
			Lifecycle timing for your own CSS: Content/Backdrop stay <code class="text-xs">mounted</code>
			through exit animations; while a VT open is preparing they may be
			<code class="text-xs">visibility: hidden</code> so the morph layer owns the pixels. Prefer
			<code class="text-xs">onOpenChangeComplete</code> for post-motion work — see
			<DocsLink href="{pages.stateLifecycle.href}#lifecycle"
				>State & lifecycle → Lifecycle callbacks</DocsLink
			>.
		</p>
	</DocsSection>

	<DocsPager prev={pages.sveltekitImage} next={pages.gestures} />
</DocsShell>
