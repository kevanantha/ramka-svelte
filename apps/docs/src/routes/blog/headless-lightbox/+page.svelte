<script lang="ts">
	import CodeBlock from '#lib/components/CodeBlock.svelte';
	import LandingDemo from '#lib/components/LandingDemo.svelte';
	import Article from '../Article.svelte';
	import Ext from '../Ext.svelte';
	import { heading, lead, link, prose } from '../article';
	import ChromeBuilder from './ChromeBuilder.svelte';

	let { data } = $props();

	const code = 'text-[13px]';
</script>

<Article
	published="2026-08-29"
	date="August 29, 2026"
	title="The case for a headless React lightbox"
	seoTitle="The case for a headless React lightbox"
	seoDescription="How a headless React lightbox turns custom buttons, captions, layouts and sidebars into ordinary JSX instead of config options. With a live composer demo."
	ldDescription="Why a composable, headless API is the lightbox feature that makes every other feature reachable: config objects versus composition, what render slots cannot fit, and a live demo that composes an image viewer piece by piece."
	keywords="headless lightbox, headless ui, react lightbox, image gallery component, unstyled components, composable api, react image viewer, radix-style primitives"
>
	{#snippet lede()}
		Here is a feature request from a popular lightbox&rsquo;s issue tracker: hide the arrow buttons
		when the gallery has a single image. A reasonable ask. It was closed the same day, and the
		resolution was not a feature. It was a workaround, and &ldquo;how do I do this&rdquo; comments
		kept arriving for the next two years.
	{/snippet}

	<div class="mt-6">
		<CodeBlock {...data.samples.workaround} title="Hiding two buttons, config-object style" />
	</div>

	<p class={prose}>
		Pass a function that renders nothing into a render slot, conditionally, remembering the keyboard
		needs its own flag. Compare the same fix in a lightbox where the buttons are elements you were
		already rendering:
	</p>

	<div class="mt-5">
		<CodeBlock {...data.samples.composedFix} title="Hiding two buttons, composition style" />
	</div>

	<p class={prose}>
		An if statement. Nobody files an issue for an if statement. That gap is what this post is about,
		and it has nothing to do with effort or code quality. The maintainer&rsquo;s
		<Ext href="https://github.com/igordanchenko/yet-another-react-lightbox/issues/17"
			>workaround</Ext
		> is clever and the library it belongs to is good. The gap comes from the shape of the API, nothing
		else: the shape decides which problems are yours to solve in an afternoon and which ones are feature
		requests to a stranger.
	</p>

	<h2 class={heading}>The three shapes of lightbox APIs</h2>
	<p class={prose}>
		Survey the popular lightbox and image gallery libraries and nearly every API is one of three
		shapes. No names here, because the point is not that these libraries are bad. They are the most
		polished versions of their pattern. The point is the ceiling each pattern builds in.
	</p>
	<p class={prose}>
		<strong class={lead}>Shape one: a selector and a config object.</strong>
		You hand the library a CSS selector and it takes the DOM from there. The markup inside the viewer
		is the library&rsquo;s, so adding your own button means serializing your UI into a string and aiming
		it with a magic number:
	</p>
	<div class="mt-5">
		<CodeBlock {...data.samples.shapeOne} title="Shape one: UI as strings, position as a number" />
	</div>
	<p class={prose}>
		Your share button is <code class={code}>html: '&lt;svg&gt;…&lt;/svg&gt;'</code>. Not a
		component. A string, positioned relative to the built-ins by knowing that the close button lives
		at order 20. If the button needs state, a tooltip from your design system, or a React portal,
		you are now managing a DOM island inside someone else&rsquo;s DOM.
	</p>
	<p class={prose}>
		<strong class={lead}>Shape two: data attributes.</strong>
		The gallery is declared in HTML — a lineage that runs straight back to
		<a href="/blog/story-of-the-lightbox" class={link}
			>2005&rsquo;s <code class={code}>rel=&quot;lightbox&quot;</code> attribute</a
		>
		— which sounds friendly until your caption is a heading and a paragraph:
	</p>
	<div class="mt-5">
		<CodeBlock
			{...data.samples.shapeTwo}
			title="Shape two: your caption is HTML in a string in an attribute"
		/>
	</div>
	<p class={prose}>
		HTML, in a string, in an attribute, waiting to be parsed and injected at open time. Everything
		else routes through the config object: the next and previous buttons are
		<code class={code}>nextHtml</code>
		and <code class={code}>prevHtml</code> option strings, translations are a
		<code class={code}>strings</code> map, and even ARIA wiring arrives as options:
	</p>
	<div class="mt-5">
		<CodeBlock {...data.samples.shapeTwoConfig} title="Shape two: everything is a setting" />
	</div>
	<p class={prose}>
		One library of this shape documents more than sixty core settings before you have installed a
		single plugin, and the plugins bring their own. That number is not bloat. It is the honest cost
		of keeping the DOM: every decision the library makes for you has to come back to you as an
		option.
	</p>
	<p class={prose}>
		<strong class={lead}>Shape three: React, but still a config object.</strong>
		The modern React take accepts arrays and maps instead of selectors and strings, which is real progress.
		But look at where your UI goes:
	</p>
	<div class="mt-5">
		<CodeBlock {...data.samples.shapeThree} title="Shape three: composition through a keyhole" />
	</div>
	<p class={prose}>
		Slides are data, features are a plugin array, words are a <code class={code}>labels</code> map,
		your components enter one at a time through named <code class={code}>render</code> slots, and styling
		gets five sanctioned customization points. This is composition through a keyhole. Each slot is real
		and each slot works, but the set of slots is finite, and it is exactly the set the author thought
		to cut. To its credit, this shape cuts generous holes — there is a slot for rendering whole custom
		slides and one for overlaying extra controls — yet each is still a named opening in the same wall,
		usable exactly where the author aimed it. The one-image workaround that opened this post lives in
		this shape, and no wonder: when rendering belongs to the library, you customize by exception.
	</p>
	<p class={prose}>
		One more thing all three shapes share: step zero of every install guide is importing the
		library&rsquo;s stylesheet. That import sets the terms for every pixel after it. Making the
		viewer look like your product means overriding someone else&rsquo;s selectors. The better
		libraries document CSS variables and class names for exactly this, but the documented list is
		one more config surface, and everything off the list is an internal you hope survives the next
		release. Dark mode has to undo their colors before applying yours. And the bytes ship
		regardless, including the ones for pixels you just repainted. A required stylesheet is the
		config object of styling: a list of decisions someone else already made, plus escape hatches.
	</p>

	<h2 class={heading}>Why config APIs grow forever</h2>
	<p class={prose}>
		None of these authors set out to build a settings museum. The options accumulate one reasonable
		request at a time. Someone needs the counter on the left. Someone needs captions under the image
		instead of over it. Someone needs the close button to say &ldquo;Schließen&rdquo;. When the
		library owns the DOM, the only way to say yes is a new option, so the options page becomes a
		list of every customization the author predicted. The requests the author did not predict become
		wrapper-div hacks, CSS fights against inline styles, forks, or that politely closed issue with a
		workaround.
	</p>
	<p class={prose}>
		The deeper problem is that a config API has to be designed twice. Once for the feature, once for
		every way someone might want the feature to differ. A rendered element needs no second design.
		If you render the counter, you can also move it, restyle it, translate it, or wrap it in a
		tooltip, and none of those verbs needed to be anticipated by anyone.
	</p>

	<h2 class={heading}>The ecosystem already voted</h2>
	<p class={prose}>
		This is not some niche philosophy. The React ecosystem already builds every other overlay this
		way. Headless primitives sit under a huge share of production dialogs, menus, and selects:
		<Ext href="https://www.npmjs.com/package/@radix-ui/react-dialog"
			>the most-installed primitive library</Ext
		>
		counts its npm downloads in the hundreds of millions per month at the time of writing, and the most-starred
		React UI project on GitHub, <Ext href="https://github.com/shadcn-ui/ui"
			>at roughly 122,000 stars</Ext
		>, is a CLI that copies composable component source into your repo so you own every line. In the
		<Ext href="https://2024.stateofreact.com/en-US/libraries/component-libraries/"
			>State of React survey</Ext
		>, its usage doubled from 20 to 42 percent in a single year. Adoption numbers are not a
		controlled study of motives, but the direction is hard to misread: offered both models,
		developers keep picking ownership.
	</p>
	<p class={prose}>
		React lightboxes mostly sat this shift out, for a defensible reason. A fullscreen image viewer
		is the hardest overlay there is: scroll physics, pinch zoom, pull to dismiss, morph transitions.
		Authors kept the DOM because handing it over risks the physics. ramka&rsquo;s bet is that the
		two concerns split cleanly: the physics live in the engine, on
		<a href="/blog/why-native-scrolling" class={link}>a real scroller the browser drives</a>, and
		the DOM lives with you, the way Radix, Base UI, and shadcn/ui trained everyone to expect.
	</p>

	<h2 class={heading}>What owning the markup buys</h2>
	<p class={prose}>
		Here is the whole API shape. It should look familiar if you have used any headless primitive:
	</p>
	<div class="mt-5">
		<CodeBlock {...data.samples.ramkaShape} title="ramka: the API is the markup" />
	</div>
	<p class={prose}>
		Every visible piece of chrome in the viewer is one you rendered — the library&rsquo;s own
		additions are plumbing, like the focus guards and the portal host, never a button or a pixel of
		UI — so every element can carry whatever your app needs it to carry. An
		<code class={code}>aria-label</code> in your user&rsquo;s language rather than
		<a href="/blog/lightbox-accessibility" class={link}>a hard-coded English string</a>. The tooltip
		component the rest of your product uses. A <code class={code}>data-testid</code>
		for the end-to-end suite, an analytics attribute for the click tracker. Your
		<code class={code}>Image</code> component as the slide, with its own
		<code class={code}>srcset</code> logic and placeholders. None of that is a feature of ramka. It is
		what falls out of the library not standing between you and your own elements.
	</p>
	<p class={prose}>
		Styling follows the same rule. There is no <code class={code}>ramka.css</code>, so there is
		nothing to import, nothing to override, and no specificity contest to win. The primitives apply
		only the functional styles they cannot work without, like the scroll and snap geometry on
		Slides; every visual decision waits for you. Every part takes a <code class={code}>class</code> like
		any element you wrote, whether that means Tailwind, scoped styles, or your design tokens; every viewer
		on this site is styled with plain Tailwind against these same primitives. And an upgrade cannot break
		your styles by renaming a private selector or reshuffling an internal DOM you were forced to target,
		because your styles were never attached to either.
	</p>
	<p class={prose}>
		Do not take the claim on faith. Below is a viewer in the split, social-app layout, media pane
		plus post thread, built from the same primitives. Toggle its pieces and watch the markup follow:
	</p>

	<ChromeBuilder />

	<p class="mt-6 text-[15px] leading-7">
		<a href="/docs/lightbox/composition" class={link}
			>Build this yourself with ramka&rsquo;s composition guide&nbsp;&rarr;</a
		>
	</p>

	<h2 class={heading}>What a keyhole can never fit</h2>
	<p class={prose}>
		Render slots cover the customizations the author predicted, and predictions run out fast. The
		requests that end as wontfix in config lightboxes are the ones where your UI is not replacing a
		built-in piece but adding structure the config schema has no word for. A comment thread beside
		the photo, say, the pattern every social app uses:
	</p>
	<div class="mt-5">
		<CodeBlock {...data.samples.sidebar} title="Structure no config schema has a word for" />
	</div>
	<p class={prose}>
		In ramka that is a grid with an <code class={code}>aside</code> in it, because the viewer is
		your markup and
		<a href="/docs/lightbox/composition" class={link}>Stage scopes the gestures</a>
		to the media pane. It is the exact structure the &ldquo;Post sidebar&rdquo; switch was toggling in
		the demo above. In a config lightbox the nearest escape hatch is a slot for overlaying absolutely
		positioned elements on top of the viewer, which is not the same as giving the photo a neighbor: a
		comment sidebar drags in layout, scrolling, focus, forms, and state that no options object can describe.
		The same logic covers the
		<a href="/docs/lightbox/view-transitions" class={link}>morph</a>
		targeting any element you choose via the <code class={code}>morph</code> attachment, the counter rendering
		wherever the design puts it, and video or a canvas or a diagram as a slide. Not because ramka shipped
		a feature for each, but because there is nothing to ask permission from.
	</p>

	<h2 class={heading}>What config APIs do better</h2>
	<p class={prose}>
		Honesty section, as usual. The config shapes won their popularity for a reason: a working viewer
		in three lines is a genuinely great pitch, and composition cannot match it. A headless lightbox
		hands you a blank page, and a blank page is a real cost. You will write markup on day one that a
		config library would have given you for free.
	</p>
	<p class={prose}>
		The answer is the same one shadcn/ui gave for every other component: start from source you own.
		ramka&rsquo;s
		<a href="/presets/default" class={link}>presets</a>
		are complete, styled viewers, photos, stories, a Twitter-style feed, that you copy into your project
		and edit like code you wrote, because from that moment it is. Day one costs a paste. And the first
		time you need anything the options page would not have listed, the trade flips: your gnarliest customization
		is an if statement, a class name, or an <code class={code}>aside</code>, in markup you already
		own.
	</p>

	<h2 class={heading}>Feel it in a real photo gallery</h2>
	<p class={prose}>
		The gallery below is the composed result: morph open, native swipe, pinch zoom, pull to dismiss,
		and every visible element, buttons, counter, caption, thumbnails, is consumer markup styled with
		Tailwind. The library shipped the behavior and zero pixels of the chrome.
	</p>

	<div class="mt-8">
		<LandingDemo eager={false} />
	</div>

	<p class={prose}>
		That is the whole pitch: ramka is a headless React lightbox. The behavior ships in the library;
		the visible structure and styling live in your codebase; the presets keep day one cheap. The
		<a href="/docs/lightbox/composition" class={link}>composition guide</a>
		is a ten-minute tour of the markup, and the
		<a href="/docs/lightbox" class={link}>lightbox docs</a>
		go from install to first viewer. ramka is free under the MIT License. Bring your own buttons.
	</p>
</Article>
