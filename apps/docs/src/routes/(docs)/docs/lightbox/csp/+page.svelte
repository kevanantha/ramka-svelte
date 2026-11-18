<script lang="ts">
	import CodeBlock from '#lib/components/docs/CodeBlock.svelte';
	import DocsLink from '#lib/components/docs/DocsLink.svelte';
	import DocsPager from '#lib/components/docs/DocsPager.svelte';
	import DocsSection from '#lib/components/docs/DocsSection.svelte';
	import DocsShell from '#lib/components/docs/DocsShell.svelte';
	import PageMeta from '#lib/components/docs/PageMeta.svelte';
	import { extLinkClass as extLink } from '#lib/components/docs/classes.js';
	import type { DocsTocItem } from '#lib/components/docs/types.js';
	import { lightboxApiHref as api, lightboxDocsPages as pages } from '#lib/content/docs-pages.js';
	import cspHeader from 'excerpt:excerpts/csp-header.txt';
	import cspHook from 'excerpt:excerpts/csp-hook.ts';
	import cspProvider from 'excerpt:excerpts/csp-provider.svelte';

	const toc: DocsTocItem[] = [
		{ id: 'injects', title: 'What the library injects' },
		{ id: 'nonce', title: 'Passing a nonce' },
		{ id: 'server', title: 'Server rendering' },
		{ id: 'attributes', title: 'Inline style attributes' },
		{ id: 'hashes', title: 'Hash-based policies' }
	];
</script>

<PageMeta
	title="Content Security Policy"
	description="Running the lightbox under a strict CSP: what the library injects, what degrades without a nonce, and how CSPProvider wires one in."
/>

{#snippet description()}
	Running the lightbox on pages with a strict <code class="text-xs">style-src</code>. Part of
	<DocsLink href={pages.overview.href}>Lightbox</DocsLink>.
{/snippet}

<DocsShell title="Content Security Policy" {description} {toc}>
	<DocsSection id="injects" title="What the library injects">
		<p>
			The library is headless — your chrome, your CSS — but its structural rules have to come from
			somewhere, and they arrive through two channels. Almost everything goes through
			<a
				class={extLink}
				href="https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet"
				target="_blank"
				rel="noreferrer">constructed stylesheets</a
			>
			created at runtime, which CSP does not police at all: a page that allows no inline styles whatsoever
			still gets every rule delivered this way, with no configuration.
		</p>
		<p>
			The exception is three small <code class="text-xs">&lt;style&gt;</code> tags with constant
			text that must exist in the markup itself, because they style the <em>first paint</em> of a
			page that server-renders an open lightbox — before any runtime code has run. They make media
			fill its fit-box, hide the active item's trigger, and position the initial slide.
			<DocsLink href={api.root}>Root</DocsLink> renders them into
			<code class="text-xs">&lt;svelte:head&gt;</code> only when it is open at creation, so closed
			galleries add nothing. A strict <code class="text-xs">style-src</code> refuses them unless you allow
			them, and the degradation is deliberately soft: the constructed-stylesheet copies take over after
			hydration, so everything works — only those first-paint niceties on server-rendered-open pages are
			lost.
		</p>
	</DocsSection>

	<DocsSection id="nonce" title="Passing a nonce">
		<p>
			The standard way to allow specific inline styles is a
			<a
				class={extLink}
				href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src#unsafe_inline_styles"
				target="_blank"
				rel="noreferrer">nonce</a
			>: the server generates a random value per request, puts it in the header, and any
			<code class="text-xs">&lt;style&gt;</code> carrying the same value is allowed. Wrap
			<DocsLink href={api.cspProvider}>CSPProvider</DocsLink> around everything that renders lightbox
			parts and pass it that value — it stamps every inline tag the library renders.
		</p>
		<CodeBlock excerpt={cspProvider} />
		<p>
			Put it in the root layout, not around one gallery. The nonce travels through context, and the
			tags are rendered by whichever <DocsLink href={api.root}>Root</DocsLink> is open on the server —
			one provider at the top covers every Root on every page, including ones you add later.
		</p>
	</DocsSection>

	<DocsSection id="server" title="Server rendering">
		<p>
			SvelteKit server-renders the tags with the nonce already on them, so the deep-link pages that
			server-render an open viewer keep their first-paint styling under a strict policy as soon as
			the provider has a value. The value has to be one you mint: SvelteKit's own
			<code class="text-xs">kit.csp</code> nonce is written into
			<code class="text-xs">app.html</code> (<code class="text-xs">%sveltekit.nonce%</code>) and
			never reaches components. Generate it in a <code class="text-xs">handle</code> hook, send the
			header yourself, and return it from the root
			<code class="text-xs">+layout.server.ts</code> as <code class="text-xs">data.nonce</code>:
		</p>
		<CodeBlock excerpt={cspHook} />
		<p>
			Opens after the page has loaded need nothing: a Root that starts closed renders no inline
			<code class="text-xs">&lt;style&gt;</code> at all, since its rules arrive as constructed stylesheets.
		</p>
	</DocsSection>

	<DocsSection id="attributes" title="Inline style attributes">
		<p>
			Separate from <code class="text-xs">&lt;style&gt;</code> elements, CSP also governs
			<code class="text-xs">style="…"</code> attributes — and nonces cannot be applied to attributes
			at all. The library's structural styles ride on inline attributes (as do Svelte's own
			<code class="text-xs">style:</code> directives), which only matters for markup parsed from
			server HTML: styles set from JavaScript after hydration are not policed. If you server-render
			lightbox pages under a policy stricter than <code class="text-xs">style-src</code> alone,
			split the directives and keep <code class="text-xs">'unsafe-inline'</code> on the attribute half:
		</p>
		<CodeBlock excerpt={cspHeader} />
		<p>
			This is the industry-standard shape. Style <em>attributes</em>
			cannot exfiltrate data or execute code the way style elements can, so allowing them is a far smaller
			concession than <code class="text-xs">'unsafe-inline'</code> on elements.
		</p>
	</DocsSection>

	<DocsSection id="hashes" title="Hash-based policies">
		<p>
			Statically hosted sites (<code class="text-xs">adapter-static</code>, prerendered pages) have
			no server to mint a per-request nonce. CSP's alternative is a hash source: allow exactly these
			style blocks by their SHA-256. That is normally impractical for component libraries —
			CSS-in-JS output varies per page — but the library's three tags have <em>constant</em> text by
			design, so their hashes are stable for a given release. The quickest way to collect them is
			the browser itself: load a page with the policy enforced and copy the three
			<code class="text-xs">sha256-…</code> values Chrome prints in the console violation messages
			into
			<code class="text-xs">style-src</code>. Re-collect them when you upgrade the package — rule
			text can change between releases.
		</p>
	</DocsSection>

	<DocsPager prev={pages.rtl} next={pages.api} />
</DocsShell>
