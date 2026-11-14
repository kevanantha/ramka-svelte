<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Command from '@lucide/svelte/icons/command';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import CodeBlock from '#lib/components/CodeBlock.svelte';
	import Kbd from '#lib/components/Kbd.svelte';
	import KbdGroup from '#lib/components/KbdGroup.svelte';
	import LandingDemo from '#lib/components/LandingDemo.svelte';
	import Article from '../Article.svelte';
	import Ext from '../Ext.svelte';
	import { heading, link, prose } from '../article';
	import FocusTrapDemo from './FocusTrapDemo.svelte';
	import SrSimulator from './SrSimulator.svelte';

	let { data } = $props();

	const code = 'text-[13px]';
</script>

{#snippet arrows()}
	<KbdGroup>
		<Kbd label="Left arrow"><ArrowLeft /></Kbd>
		<Kbd label="Right arrow"><ArrowRight /></Kbd>
	</KbdGroup>
{/snippet}
{#snippet plus()}<Kbd label="Plus"><Plus /></Kbd>{/snippet}
{#snippet minus()}<Kbd label="Minus"><Minus /></Kbd>{/snippet}
{#snippet cmdPlus()}
	<KbdGroup>
		<Kbd label="Command"><Command /></Kbd>
		<Kbd label="Plus"><Plus /></Kbd>
	</KbdGroup>
{/snippet}

<Article
	published="2026-08-29"
	date="August 29, 2026"
	title="A lightbox screen readers can actually use"
	seoTitle="Lightbox accessibility: focus, screen readers and WCAG"
	seoDescription="Learn how an accessible React lightbox handles focus traps, screen reader announcements, keyboard navigation, inert slides and reduced motion. With live demos."
	ldDescription="What an accessible React lightbox actually requires: focus trapping and restoration, live regions for slide changes, inert slides, reduced motion, and honest notes on what remains hard. With interactive demos."
	keywords="accessible lightbox, accessible image gallery, react lightbox, photo gallery accessibility, focus trap, aria-live, screen reader, WCAG, modal dialog, aria-modal"
>
	{#snippet lede()}
		Turn on VoiceOver and open a photo in a typical web lightbox. You hear &ldquo;image&rdquo;,
		maybe. Swipe to the next photo: nothing. Try to leave: <Kbd>Esc</Kbd> does nothing, and the close
		button announces itself as &ldquo;clickable&rdquo;.
		<a href="/blog/why-native-scrolling" class={link}>The last post</a>
		was about what your thumb knows. This one is about what a screen reader hears.
	{/snippet}

	<p class={prose}>
		The scale of the problem is measured annually.
		<Ext href="https://webaim.org/projects/million/">WebAIM&rsquo;s 2026 scan</Ext> of the top million
		homepages found automatically detectable WCAG 2 failures on 95.9 percent of them, averaging 56.1 errors
		per page. (An automated scan only catches the machine-testable failures, so the true rate is higher,
		not lower.) The same report repeats its most uncomfortable correlation: pages that use ARIA average
		significantly more detected errors than pages that don&rsquo;t, 59.1 versus 42. Correlation is not
		a verdict on ARIA, but it is a measure of how often ARIA is applied wrong, and wrong ARIA builds barriers
		plain HTML never had.
	</p>

	<p class={prose}>
		The same scan breaks its results down by the JavaScript libraries it detected, and the gallery
		scripts cluster at the bad end of that table. Home pages running
		<a href="/blog/story-of-the-lightbox" class={link}>the original 2005 Lightbox script</a>
		averaged 25.7 percent more errors than the million-page mean; Slick 26.4 percent more, Swiper 31.8
		percent more, FancyBox 60.3 percent more. A detected library is not proof it caused those errors,
		sites that reach for a carousel plugin differ in a hundred other ways. But the pattern you are reading
		about keeps company at the wrong end of the distribution. It also has money attached: at the time
		of writing, UsableNet&rsquo;s
		<Ext
			href="https://info.usablenet.com/hubfs/Remediated%20-%202025_Year-End_Digital_Accessibility_Lawsuit_Report_FINAL.pdf"
			>year-end report</Ext
		>
		counts more than 5,000 ADA-related digital accessibility lawsuits filed in the US during 2025, and
		puts e-commerce, exactly where image galleries live, at about 70 percent of the industry breakdown.
		(Counts of filings, not a statement about who wins, and nothing here is legal advice.)
	</p>

	<p class={prose}>
		None of this is because dialogs are mysterious. The
		<Ext href="https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/"
			>W3C&rsquo;s dialog pattern</Ext
		> spells out the contract. An accessible React lightbox just happens to sit on the intersection of
		three hard things at once: it is a fullscreen modal dialog, an image carousel, and a gesture surface.
		Let&rsquo;s take them in order.
	</p>

	<h2 class={heading}>Watch focus fall out of the dialog</h2>
	<p class={prose}>
		Start with the modal part, and with the failure you can see. When a lightbox opens, keyboard
		focus must move into it, stay inside while it is open, and return to the element that opened it
		when it closes. Skip the middle requirement and Tab walks straight out of the overlay into the
		page behind it, where a keyboard user is now operating invisible controls.
	</p>

	<FocusTrapDemo />

	<p class={prose}>
		The trap itself is less code than its reputation suggests. ramka brackets the dialog with two
		invisible focus guards, the same sentinel technique Radix and Base UI use. Tab past the last
		control and the guard catches focus and hands it to the first one; Shift+Tab past the first and
		it lands on the last:
	</p>
	<div class="mt-5">
		<CodeBlock {...data.samples.guards} title="The sentinel trap" />
	</div>
	<p class={prose}>
		The subtler half of the contract is the exit. When the lightbox closes, focus must return to the
		trigger, and here ramka does something I have not seen elsewhere: it remembers how you closed.
		Close with <Kbd>Esc</Kbd> or the keyboard and the trigger gets its focus ring back, because a keyboard
		user needs to see where they are. Close by clicking the backdrop or pulling the photo away and focus
		still returns, but without forcing a ring onto a screen where nobody is keyboarding. Modality-aware
		focus restoration, three lines of bookkeeping, and it makes both kinds of users feel like the thing
		was built for them.
	</p>

	<h2 class={heading}>What a screen reader hears</h2>
	<p class={prose}>
		Focus is the failure you can see. The other one is silence. A lightbox built from divs announces
		nothing when it opens, nothing when the slide changes, and nothing when it closes; a screen
		reader user gets a click that appears to do nothing at all. The fix has two parts: real
		semantics on the container, and a live region for the thing that changes.
	</p>

	<SrSimulator />

	<p class={prose}>
		The container part is the dialog contract again: <code class={code}>role="dialog"</code>,
		<code class={code}>aria-modal</code>, and an accessible name, so opening announces
		&ldquo;Photos, dialog&rdquo; instead of nothing. The changing part is the interesting one.
		Swiping to the next slide moves a scroller; no focus changes, so nothing announces itself.
		ramka&rsquo;s
		<code class={code}>Counter</code> primitive is the fix: it renders the &ldquo;2 of 9&rdquo; you
		can see, and it is also an <code class={code}>aria-live="polite"</code> region, so every slide
		change speaks. <code class={code}>Caption</code> announces the same way, and because both
		regions are polite they queue rather than interrupt: with both mounted, a slide change reads as
		the position, then the caption. If you would rather have a single voice, pass
		<code class={code}>aria-live="off"</code> to the one you want visual-only; your props win. Mount the
		Counter and navigation narrates itself; leave it out and it is silent, which is exactly what the demo
		above shows.
	</p>
	<p class={prose}>
		The docs chrome uses a trick worth stealing: on desktop, the thumbnail strip already shows
		position, so a visible counter would be noise. Instead of unmounting it, the counter collapses
		to
		<code class={code}>sr-only</code> and keeps announcing:
	</p>
	<div class="mt-5">
		<CodeBlock {...data.samples.counter} title="The counter you hear but do not see" />
	</div>
	<p class={prose}>
		Off-screen slides get the opposite treatment. Every inactive slide is
		<code class={code}>inert</code> and <code class={code}>aria-hidden</code>, so a screen reader
		exploring the dialog finds one photo, not nine, and keyboard focus physically cannot wander into
		a slide you cannot see. ramka goes a step further and makes the zoom surface non-focusable
		precisely so that a slide being deactivated mid-gesture can never strand focus inside an inert
		subtree. That is the kind of edge case you only find by testing, and the kind a library should
		own so you never think about it.
	</p>
	<p class={prose}>
		Two smaller pieces of the same structure are easy to miss. Thumbnails are a real
		<Ext href="https://www.w3.org/WAI/ARIA/apg/patterns/tabs/">tabs pattern</Ext>: a
		<code class={code}>tablist</code> of <code class={code}>tab</code>s with roving tabindex,
		{@render arrows()}, <Kbd>Home</Kbd> and <Kbd>End</Kbd>, and the selection tracked from the
		active slide rather than from DOM focus, so swiping can never desync what the keyboard thinks is
		selected. And a refinement the dialog pattern does not require but disclosure buttons taught us
		to appreciate: the trigger that opened the lightbox carries
		<code class={code}>aria-haspopup="dialog"</code> and
		<code class={code}>aria-expanded</code>, on that specific element, so a screen reader user
		browsing a grid of twenty thumbnails can tell which one is currently open.
	</p>

	<h2 class={heading}>Why ramka ships no English</h2>
	<p class={prose}>
		One thing ramka deliberately does not do: bake in default labels. There is no built-in
		<code class={code}>aria-label="Close"</code> on the close button, no &ldquo;carousel&rdquo;
		roledescription hard-coded on the slides. A comment in the source explains why: an English
		string baked into a primitive is wrong for most of the world. The numbers sketch who that world
		is. In
		<Ext href="https://webaim.org/projects/screenreadersurvey10/"
			>WebAIM&rsquo;s tenth screen reader survey</Ext
		>
		(2024), NVDA leads in every surveyed region outside North America and Australia — Europe, Africa and
		the Middle East, and Asia — and 91.3 percent of respondents use a screen reader on a phone, where
		70.6 percent of them reach for VoiceOver. Market share says nothing about the languages those users
		prefer; what it says is that a React primitive ships to a global, mostly mobile audience. A built-in
		English &ldquo;Close&rdquo; is wrong the moment the interface around it is not in English, and a primitive
		cannot know that. The application can. So ramka owns the semantic requirement, the button must have
		a name, and leaves the localized words to the application.
	</p>
	<p class={prose}>
		So the words are yours, and the structure is the library&rsquo;s. In development, ramka warns
		when a dialog or an icon button has no accessible name, which keeps the contract visible without
		shipping anyone&rsquo;s locale. Passing it is a few attributes, following the
		<Ext href="https://www.w3.org/WAI/ARIA/apg/patterns/carousel/">APG carousel pattern</Ext>:
	</p>
	<p class={prose}>
		Notice what makes this possible at all: every element in the viewer is one you render, so there
		is nothing you cannot label, describe, or hang a tooltip on. A config-object lightbox inverts
		that. You get whatever escape hatches its author remembered to expose, an
		<code class={code}>ariaLabelledby</code>
		option here, a <code class={code}>strings</code> map there, and anything they forgot is
		unfixable without a fork.
		<a href="/blog/headless-lightbox" class={link}>The case for a headless lightbox</a>
		makes that argument in full.
	</p>
	<div class="mt-5">
		<CodeBlock {...data.samples.naming} title="Naming the carousel, your words" />
	</div>

	<h2 class={heading}>Keyboard and motion</h2>
	<p class={prose}>
		The rest of the keyboard contract: <Kbd>Esc</Kbd> closes,
		{@render arrows()}
		move between slides, <Kbd>Home</Kbd> and <Kbd>End</Kbd> jump to the ends,
		{@render plus()}
		and
		{@render minus()}
		zoom, and <Kbd>0</Kbd> resets. Two details are easy to get wrong. When the photo is zoomed in, ramka&rsquo;s
		arrow keys stop navigating and start panning, because &ldquo;move within the thing I am looking at&rdquo;
		is what arrows mean everywhere else in an OS. And every shortcut steps aside when focus is in an input
		or textarea, so a comment field inside a lightbox does not eat your arrow keys.
	</p>
	<p class={prose}>
		Keyboard zoom is where testing gets almost comic. While writing this post I tried the two most
		popular lightbox libraries: in both,
		{@render plus()}
		and
		{@render minus()}
		do nothing at all. Muscle memory then reaches for
		{@render cmdPlus()}, and the browser does what that shortcut has always done: it zooms the page.
		The entire UI inflates, thumbnails included, and in one of the two the enlarged thumbnail strip
		claims so much of the viewport that the photo you were trying to zoom into gets
		<em>smaller</em>. ramka&rsquo;s answer is to give the image its own keyboard zoom without taking
		the browser&rsquo;s away: unmodified
		{@render plus()},
		{@render minus()}
		and <Kbd>0</Kbd> operate the photo, while the
		{@render cmdPlus()}
		family stays with the browser. Page zoom is how low-vision users resize text, WCAG 1.4.4 in practice,
		so a viewer that swallows it is fixing one zoom by breaking another. Keeping both means you can enlarge
		the viewer&rsquo;s controls and captions independently of the photo.
	</p>
	<p class={prose}>
		Motion is an accessibility setting too. Vestibular disorders make large moving surfaces
		genuinely nauseating, and the OS-level reduced motion toggle is how people say so. ramka treats
		that setting as a hard gate on the
		<a href="/docs/lightbox/view-transitions" class={link}>morph transition</a>: if it is on, the
		morph simply is not attempted, and open and close fall back to a plain fade. Gesture springs
		collapse to instant snaps the same way.
	</p>
	<div class="mt-5">
		<CodeBlock {...data.samples.reducedMotion} title="Reduced motion as a gate, not a theme" />
	</div>

	<h2 class={heading}>Every input, its native idiom</h2>
	<p class={prose}>
		Most lightboxes navigate by pointer drag: press the photo, pull it sideways, release. It works,
		and it is the least accessible input on the menu. Dragging is the hardest pointer operation
		there is for anyone with a tremor or limited dexterity, press and hold and move and release
		without slipping, which is why WCAG 2.2 added
		<Ext href="https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html"
			>2.5.7 Dragging Movements</Ext
		>: anything operated by drag needs a single-pointer alternative that does not drag. A
		drag-to-scroll gallery that hides its next button for a cleaner look is a straight failure. And
		with VoiceOver or TalkBack running it is worse than a failure, because mobile screen readers
		consume single-finger gestures before the page ever sees them. To a blind user, a drag-only
		carousel is not hard to use. It does not exist.
	</p>
	<p class={prose}>
		Drag-first carousels also fail an audience nobody thinks to test: trackpads. Pointer-drag code
		listens for pointer events, but a two-finger trackpad swipe emits wheel events, so in a
		surprising number of galleries mouse drag works and the trackpad does nothing. The fix on their
		side is a non-passive wheel handler, which is its own
		<a href="/blog/why-native-scrolling" class={link}>performance story</a>. ramka&rsquo;s slides
		are a real scroller, so every scroll input the operating system knows about works without a line
		of code: touch, trackpad swipe, shift plus wheel, tilt wheels, pen.
	</p>
	<p class={prose}>
		The parity goes past swiping. A trackpad pinch zooms the photo, through Safari&rsquo;s gesture
		events and through the synthesized ctrl-wheel stream Chrome and Firefox emit for pinches, with
		the same elastic overshoot and snap-back as fingers on glass. A two-finger downward swipe pulls
		the photo away to dismiss, exactly like the touch gesture. Pinching in the middle of a swipe
		hands the gesture from the scroller to the zoom instead of fighting for it. Drag is welcome as
		one input among many. It just is not allowed to be the foundation, because everyone whose hands
		or eyes or hardware work differently is standing on it.
	</p>

	<h2 class={heading}>What is still hard</h2>
	<p class={prose}>
		The honest section. The dialog pattern requires that content behind a modal be non-interactive
		for <em>every</em> user, not just keyboard users. ramka covers the inputs it controls: the focus
		trap contains Tab, the scroll lock and the viewport-covering surface block pointers and
		scrolling, and <code class={code}>aria-modal</code> tells assistive technology to treat the
		background as off limits, the mechanism ARIA 1.1 introduced to replace hiding the page by hand.
		What it does not yet do is <em>also</em> set <code class={code}>inert</code> on the rest of the
		page, the belt-and-suspenders that covers older mobile screen readers with weak
		<code class={code}>aria-modal</code> support. That one is on the list, carefully: blindly
		inerting everything outside the portal would break the menus and nested dialogs consumers
		legitimately portal out of the viewer. Slide announcements depend on you mounting
		<code class={code}>Counter</code> or <code class={code}>Caption</code>; a lightbox without
		either is visually fine and aurally silent. And panning a zoomed image is a drag gesture without
		a single-tap alternative yet, which the
		<a href="/docs/lightbox/zoom" class={link}>zoom docs</a>
		mark plainly as partial WCAG 2.5.7 support. All of it is on the roadmap. A library that claims its
		accessibility story is finished is describing a library nobody has tested.
	</p>

	<h2 class={heading}>Test it yourself in five minutes</h2>
	<p class={prose}>
		You do not need an audit to catch the failures in this post; you need five minutes and the
		software already on your machine. On a Mac, press
		<KbdGroup>
			<Kbd label="Command"><Command /></Kbd>
			<Kbd>F5</Kbd>
		</KbdGroup>
		to start VoiceOver. On Windows, <Ext href="https://www.nvaccess.org/download/">NVDA is free</Ext
		>. Then, on your own photo gallery: open the lightbox and listen for a dialog announcement with
		a name. Press <Kbd>Tab</Kbd> repeatedly and watch whether focus stays inside. Change slides and listen
		for the new position. Press <Kbd>Esc</Kbd>, and check focus is back on the thumbnail you started
		from. Turn on reduced motion and open it again. Five checks, one per failure that actually
		ships.
	</p>
	<p class={prose}>
		Here is that checklist running against ramka. Try it with your screen reader on.
	</p>

	<div class="mt-8">
		<LandingDemo eager={false} />
	</div>

	<p class={prose}>
		If you are building an accessible image gallery, the
		<a href="/docs" class={link}>docs</a>
		take about ten minutes, and the
		<a href="/docs/lightbox/rtl" class={link}>RTL and copy guide</a>
		covers the naming patterns above. ramka is free under the MIT License. Mount the Counter.
	</p>
</Article>
