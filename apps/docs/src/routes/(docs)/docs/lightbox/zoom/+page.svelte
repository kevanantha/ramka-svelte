<script lang="ts">
	import Command from '@lucide/svelte/icons/command';
	import DocsLink from '#lib/components/docs/DocsLink.svelte';
	import DocsPager from '#lib/components/docs/DocsPager.svelte';
	import DocsSection from '#lib/components/docs/DocsSection.svelte';
	import DocsShell from '#lib/components/docs/DocsShell.svelte';
	import Kbd from '#lib/components/docs/Kbd.svelte';
	import PageMeta from '#lib/components/docs/PageMeta.svelte';
	import { docsLinkClass, strongClass as strong, table } from '#lib/components/docs/classes.js';
	import type { DocsTocItem } from '#lib/components/docs/types.js';
	import { lightboxApiHref as api, lightboxDocsPages as pages } from '#lib/content/docs-pages.js';

	const toc: DocsTocItem[] = [
		{ id: 'desktop-conventions', title: 'Desktop conventions' },
		{ id: 'desktop-ramka', title: 'ramka on desktop' },
		{ id: 'mobile-conventions', title: 'Mobile conventions' },
		{ id: 'mobile-ramka', title: 'ramka on mobile' },
		{ id: 'heuristics', title: 'UX heuristics' },
		{ id: 'wcag', title: 'WCAG conformance' }
	];

	// Table A: how mainstream desktop viewers map zoom/pan.
	const appRows = [
		['macOS Preview', 'Pan / scroll', 'Zoom (pinch)', 'Smart-zoom toggle', 'Pan'],
		['Apple Photos (Mac)', '—', 'Zoom (pinch)', 'Toggle 1×↔zoom', 'Pan'],
		['Windows Photos', 'Navigate', 'Zoom (Ctrl+wheel)', 'Toggle', 'Pan'],
		['Google Photos (web)', 'Zoom to cursor', 'Zoom', 'Toggle', 'Pan'],
		['Google Maps', 'Zoom to cursor', 'Zoom', 'Zoom-in step', 'Pan'],
		['PhotoSwipe v5', 'Opt-in (wheelToZoom)', 'Zoom (pinch)', 'Toggle', 'Pan'],
		['OpenSeadragon', 'Zoom to cursor', 'Zoom', 'Zoom-in step', 'Pan'],
		['Lightroom', 'Zoom', 'Zoom', 'Toggle 1:1', 'Pan'],
		['Figma / Miro (canvas)', 'Pan', 'Zoom to cursor', '—', 'Pan (space)']
	];

	// Table B: ramka vs the consensus, per interaction.
	const ramkaRows = [
		[
			'Trackpad pinch',
			'Zooms to cursor (Safari GestureEvent; Chrome/FF via ctrlKey+wheel); elastic past bounds, snaps back',
			'Zoom to cursor',
			'Match, cross-browser'
		],
		[
			'Ctrl / ⌘ + wheel',
			'Zooms, focal at cursor; hard-clamped at min/max (not a rubber-band pinch)',
			'Zoom to cursor',
			'Match'
		],
		[
			'Bare scroll wheel',
			'Off by default (scrollToZoom=false): no-op at 1×, pans when zoomed',
			'Split — media viewers zoom, canvas apps pan',
			'Defensible default; opt-in covers the other'
		],
		['Double-click', 'Toggles zoom, focal at cursor', 'Toggle, focal', 'Match'],
		['Drag to pan', 'Yes — grab / grabbing cursor, elastic + momentum', 'Universal', 'Match'],
		['Wheel to pan (zoomed)', 'Yes (deltaX / deltaY)', 'Common', 'Match'],
		['Zoom buttons', 'ZoomIn / ZoomOut, step ×2', 'Common', 'Zooms about center, not cursor'],
		[
			'Keyboard zoom',
			'+ = − _ and 0 to reset (⌘/Ctrl combos stay browser page zoom)',
			'Expected',
			'Match'
		],
		['Keyboard pan', 'Arrows pan (50px) when zoomed', 'Expected', 'Match'],
		[
			'Max zoom',
			"Auto-capped to image's native resolution (fallback 4×)",
			'Best practice (avoids blur)',
			'Better than many'
		],
		[
			'Cursor at 1×',
			'No zoom-in affordance (consumer CSS)',
			'Some apps show a zoom-in cursor',
			'Minor discoverability gap'
		]
	];

	// Table D: how mainstream mobile viewers map zoom/pan.
	const mobileAppRows = [
		[
			'iOS Photos',
			'Focal, rubber-band',
			'Toggle at tap',
			'1-finger drag',
			'Yes + overscroll',
			'Dismiss'
		],
		[
			'Android Google Photos',
			'Focal, rubber-band',
			'Toggle at tap',
			'1-finger drag',
			'Yes',
			'Dismiss'
		],
		['Instagram', 'Focal (peek), snaps back', 'Like (not zoom)', 'While pinched', 'No', 'Dismiss'],
		['Mobile Safari (page)', 'Focal', 'Toggle (smart)', '1-finger drag', 'Yes', '—'],
		[
			'PhotoSwipe (mobile)',
			'Focal, rubber-band',
			'Toggle at tap',
			'1-finger drag',
			'Yes',
			'Dismiss'
		],
		['Telegram / WhatsApp', 'Focal', 'Toggle at tap', '1-finger drag', 'Yes', 'Dismiss']
	];

	// Table E: ramka on touch vs the consensus, per interaction.
	const mobileRamkaRows = [
		[
			'Pinch to zoom',
			'Focal at pinch midpoint; image follows the centroid (pinch + pan together); elastic past bounds, snaps back with haptic tick',
			'Focal + rubber-band',
			'Match'
		],
		[
			'Double-tap',
			'Toggles zoom, focal at tap; commit deferred to pointerup so a flick never misfires',
			'Toggle at tap',
			'Match (robust detection)'
		],
		['1-finger pan (zoomed)', 'Elastic drag; velocity tracked', 'Universal', 'Match'],
		[
			'2-finger pan (zoomed)',
			'Centroid pans immediately; zoom stays frozen until fingers actually pinch (iOS-style recognizer slop), then scale rebases so jitter never pops',
			'iOS Photos / pinch-pan',
			'Match'
		],
		[
			'Release with velocity',
			'Momentum pan (decelerates, clamps to bounds)',
			'iOS/Android inertia',
			'Match'
		],
		[
			'Swipe left / right',
			'Navigates via Slides snap carousel (only at 1×)',
			'Navigate photos',
			'Match'
		],
		['Swipe down', 'Pull-to-dismiss; blocked while zoomed > 1×', 'Dismiss', 'Match'],
		[
			'touch-action',
			'none when zoomed; pan-x pan-y at 1× (lets Slides + page own the swipe)',
			'Guard native gestures',
			'Correct'
		],
		[
			'Native page pinch-zoom',
			'Suppressed while Content is open so it never fights Lightbox.Zoom',
			'Prevent conflict',
			'Match'
		],
		['Haptics', 'Light tick on snap-back', 'iOS rubber-band feel', 'Better than many']
	];

	// Table C: WCAG 2.2 criteria that govern zoom/pan.
	const wcag = 'https://www.w3.org/WAI/WCAG22/Understanding';
	const wcagRows = [
		{
			sc: '2.5.1 Pointer Gestures',
			href: `${wcag}/pointer-gestures.html`,
			level: 'A',
			applies:
				'Pinch (touch + trackpad) is a multipoint gesture — needs a single-pointer alternative.',
			verdict: 'Pass.',
			status: 'Double-tap / double-click and the ZoomIn / ZoomOut buttons are all single-pointer.'
		},
		{
			sc: '2.5.7 Dragging Movements',
			href: `${wcag}/dragging-movements.html`,
			level: 'AA',
			applies:
				'Pan is drag-based and ramka implements its own pan (preventDefaults wheel), so the author-content clause applies.',
			verdict: 'Partial.',
			status:
				'Keyboard arrows + wheel-pan exist, but a strict single-pointer, non-drag pan alternative (e.g. pan controls) is not built in. See note below.'
		},
		{
			sc: '2.1.1 Keyboard',
			href: `${wcag}/keyboard.html`,
			level: 'A',
			applies: 'All zoom/pan must be reachable by keyboard.',
			verdict: 'Pass.',
			status: '+/−/0 and arrows route through the active-zoom bridge in Content.'
		},
		{
			sc: '2.5.8 Target Size (Minimum)',
			href: `${wcag}/target-size-minimum.html`,
			level: 'AA',
			applies: 'Zoom / close controls should be ≥24×24 CSS px (44 px is the touch norm).',
			verdict: 'Consumer.',
			status: 'Sizing is your CSS in a headless library — a guidance item, not a library defect.'
		}
	];
</script>

<PageMeta
	title="Pinch to zoom and accessibility"
	description="Pinch to zoom UX in the ramka Svelte lightbox: trackpad pinch, ctrl + wheel, double-click zoom, and pan, compared against desktop and mobile viewer conventions, with WCAG conformance notes."
/>

{#snippet description()}
	How ramka’s zoom &amp; pan — on desktop and on touch — lines up with mainstream image viewers, and
	how it maps to WCAG 2.2. For the wiring and gesture ownership, see
	<DocsLink href={pages.gestures.href}>Gestures</DocsLink>.
{/snippet}

{#snippet cmd()}<Kbd label="Command"><Command /></Kbd>{/snippet}

{#snippet externalLink(href: string, text: string)}
	<a {href} target="_blank" rel="noreferrer" class={docsLinkClass}>{text}</a>
{/snippet}

{#snippet dataTable(headers: string[], rows: string[][])}
	<div class={table.wrap}>
		<table class="w-full text-left text-sm">
			<thead class={table.head}>
				<tr>
					{#each headers as h, i (i)}
						<th class={table.th}>
							{#if h === 'modifier'}<Kbd>Ctrl</Kbd>/{@render cmd()}+wheel · pinch{:else}{h}{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody class="divide-y divide-neutral-200 dark:divide-neutral-800">
				{#each rows as [label, ...cells] (label)}
					<tr>
						<td class={table.tdLabel}>{label}</td>
						{#each cells as cell, i (i)}<td class={table.td}>{cell}</td>{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/snippet}

<DocsShell title="Zoom & a11y" {description} {toc}>
	<DocsSection id="desktop-conventions" title="Desktop conventions">
		<p>
			Desktop image viewers split into two families, depending on whether the surface is treated as
			a
			<em>media viewer</em> or a <em>canvas / document</em>:
		</p>
		<ul class="list-disc space-y-2 pl-5">
			<li>
				<strong class={strong}>Media-viewer model</strong>
				(Google Photos, Lightroom, PhotoSwipe, OpenSeadragon): a bare scroll wheel zooms toward the cursor;
				drag pans.
			</li>
			<li>
				<strong class={strong}>Canvas / document model</strong>
				(Figma, macOS Preview, Google Maps on trackpad): a bare scroll pans, and zoom is gated behind
				a modifier (<Kbd>Ctrl</Kbd> / {@render cmd()}) or a trackpad pinch — so it never hijacks the
				user’s scroll.
			</li>
		</ul>
		<p>
			Regardless of family, four things are near-universal: <strong class={strong}>drag pans</strong
			>
			when zoomed, <strong class={strong}>wheel/pinch zoom is focal</strong>
			(zooms toward the pointer), <strong class={strong}>double-click toggles</strong>
			zoom, and
			<strong class={strong}
				><Kbd>Ctrl</Kbd>/{@render cmd()}+wheel and trackpad pinch always zoom</strong
			>. The only real disagreement is whether a <em>bare</em> wheel zooms or pans.
		</p>
		{@render dataTable(['App', 'Bare scroll', 'modifier', 'Double-click', 'Drag'], appRows)}
	</DocsSection>

	<DocsSection id="desktop-ramka" title="ramka on desktop">
		<p>
			ramka defaults to the canvas model: <Kbd>Ctrl</Kbd>/{@render cmd()}+wheel and trackpad pinch
			zoom to the cursor, a bare wheel is a no-op at 1× (and pans when zoomed), and
			<code class="text-xs">scrollToZoom</code> on <DocsLink href={api.zoom}>Zoom</DocsLink>
			opts into the media-viewer behavior. That is the more embed-friendly default — a lightbox often
			lives inside a scrollable page, so bare-wheel zoom risks trapping the user’s scroll.
		</p>
		{@render dataTable(['Interaction', 'ramka', 'Consensus', 'Verdict'], ramkaRows)}
		<p>
			The one intentional inconsistency: <DocsLink href={api.zoomIn}>ZoomIn</DocsLink> /
			<DocsLink href={api.zoomOut}>ZoomOut</DocsLink> zoom about the center rather than the cursor. That
			is standard — buttons have no pointer position — and matches Google Maps / OpenSeadragon button
			behavior.
		</p>
	</DocsSection>

	<DocsSection id="mobile-conventions" title="Mobile conventions">
		<p>
			Touch is far more uniform than desktop — every mainstream photo viewer converges on the same
			model, set by iOS Photos and Android’s Google Photos:
		</p>
		<ul class="list-disc space-y-2 pl-5">
			<li>
				<strong class={strong}>Pinch to zoom</strong>, focal at the pinch midpoint — the image stays
				glued to the centroid, so spreading and sliding two fingers zoom and pan as one gesture —
				with a <em>rubber-band</em> overshoot past the min/max that snaps back on release.
			</li>
			<li>
				<strong class={strong}>Double-tap</strong>
				toggles between fit and a zoomed level, centered on the tap point.
			</li>
			<li>
				<strong class={strong}>One- or two-finger drag pans</strong>
				while zoomed, with <strong class={strong}>inertia / momentum</strong>
				on release.
			</li>
			<li>
				At fit, a <strong class={strong}>horizontal swipe navigates</strong>
				and a <strong class={strong}>downward swipe dismisses</strong>
				the viewer.
			</li>
		</ul>
		<p>
			The subtle-but-critical part is arbitration: pinch, pan, swipe-to-navigate, and
			swipe-to-dismiss all start from the same finger, so a viewer has to decide which gesture owns
			a given touch without misfiring.
		</p>
		{@render dataTable(
			['App', 'Pinch', 'Double-tap', 'Pan', 'Momentum', 'Swipe down'],
			mobileAppRows
		)}
	</DocsSection>

	<DocsSection id="mobile-ramka" title="ramka on mobile">
		<p>
			ramka implements the full iOS/Android touch model, including the arbitration details that make
			it feel native — deferred double-tap commit (so a flick that starts near the last tap never
			zooms by mistake), elastic overscroll on both pinch and pan, momentum with bound-clamping, and
			a haptic tick on snap-back. Pull-to-dismiss and zoom/pan share a
			<DocsLink href="{pages.gestures.href}#matrix">navigation lock</DocsLink> so an in-flight Slides
			fling can’t be hijacked mid-scroll.
		</p>
		{@render dataTable(['Interaction', 'ramka', 'Consensus', 'Verdict'], mobileRamkaRows)}
		<p>
			The touch model is where ramka is strongest — it matches the platform viewers point-for-point
			and adds haptics that most web lightboxes skip. Note that Instagram-style
			<em>pinch-to-peek</em> (zoom only holds while fingers are down, then springs back to fit) is a deliberate
			product choice, not the default; ramka keeps the zoom level after release like Photos, which is
			the right behavior for a general-purpose viewer.
		</p>
	</DocsSection>

	<DocsSection id="heuristics" title="UX heuristics">
		<ul class="list-disc space-y-2 pl-5">
			<li>
				<strong class={strong}>Zoom to the cursor.</strong>
				The single most important pointer-zoom heuristic. ramka honors it for wheel, pinch, and double-click.
			</li>
			<li>
				<strong class={strong}>Don’t hijack bare scroll by default.</strong>
				Keeping <code class="text-xs">scrollToZoom</code> off is the safer default for embedded lightboxes;
				enable it for full-bleed, single-image viewers.
			</li>
			<li>
				<strong class={strong}>Signal zoomability at rest.</strong>
				Consider a <code class="text-xs">zoom-in</code> cursor over the image at 1× so mouse-only
				users discover double-click / Ctrl-wheel zoom. ramka leaves this to your CSS — the
				<DocsLink href={api.zoom}>Zoom</DocsLink> surface exposes
				<code class="text-xs">data-zoom</code> only while scaled past 1×. Set
				<code class="text-xs">cursor: zoom-in</code> on your Zoom class — ramka’s inline cursor (grab
				/ grabbing) wins once scaled:
			</li>
		</ul>
		<pre
			class="overflow-x-auto rounded-lg bg-neutral-900 p-4 text-xs leading-relaxed text-neutral-100 dark:bg-neutral-950"><code
				>{`/* .my-zoom is the class you pass to Lightbox.Zoom */
.my-zoom {
  cursor: zoom-in;
}`}</code
			></pre>
		<ul class="list-disc space-y-2 pl-5">
			<li>
				<strong class={strong}>Never steal swipe-to-dismiss.</strong>
				On touch, pan must only take over <em>after</em> the image is zoomed; at fit, the vertical
				swipe belongs to pull-to-dismiss and the horizontal swipe to navigation. ramka gates this
				with
				<code class="text-xs">touch-action</code> and the navigation lock.
			</li>
			<li>
				<strong class={strong}>Rubber-band, don’t hard-stop.</strong>
				Elastic overscroll on pinch and pan (plus a haptic tick on snap-back) is what makes zoom feel
				native rather than mechanical.
			</li>
			<li>
				<strong class={strong}>Size touch controls for fingers.</strong>
				Give <DocsLink href={api.zoomIn}>ZoomIn</DocsLink> /
				<DocsLink href={api.zoomOut}>ZoomOut</DocsLink> and
				<DocsLink href={api.close}>Close</DocsLink> a hit area of at least 44×44 px on touch (WCAG 2.5.8
				asks ≥24 px; 44 px is the platform norm).
			</li>
		</ul>
	</DocsSection>

	<DocsSection id="wcag" title="WCAG conformance">
		<p>
			These are the WCAG 2.2 success criteria that govern zoom &amp; pan. ramka ships the pointer
			and keyboard alternatives the criteria expect:
		</p>
		<div class={table.wrap}>
			<table class="w-full text-left text-sm">
				<thead class={table.head}>
					<tr>
						<th class={table.th}>Success criterion</th>
						<th class={table.th}>Level</th>
						<th class={table.th}>Applies to</th>
						<th class={table.th}>ramka</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-neutral-200 dark:divide-neutral-800">
					{#each wcagRows as r (r.sc)}
						<tr>
							<td class={table.tdLabel}>{@render externalLink(r.href, r.sc)}</td>
							<td class={table.td}>{r.level}</td>
							<td class={table.td}>{r.applies}</td>
							<td class={table.td}><strong class={strong}>{r.verdict}</strong> {r.status}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p>
			<strong class={strong}>Note on 2.5.7.</strong>
			Pan-by-drag has a keyboard alternative (arrows), which satisfies
			{@render externalLink(`${wcag}/keyboard.html`, '2.1.1 Keyboard')}, but 2.5.7 specifically
			wants a <em>single-pointer, non-drag</em> alternative — keyboard does not count for it. If you
			must meet AA strictly, add pointer pan controls (e.g. edge/arrow buttons) alongside
			<DocsLink href={api.zoomIn}>ZoomIn</DocsLink> /
			<DocsLink href={api.zoomOut}>ZoomOut</DocsLink>. Many shipping viewers do not either, but for
			enterprise targets it is worth flagging.
		</p>
	</DocsSection>

	<DocsPager prev={pages.gestures} next={pages.rtl} />
</DocsShell>
