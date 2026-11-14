<script lang="ts">
	import CodeBlock from '#lib/components/CodeBlock.svelte';
	import Article from '../Article.svelte';
	import Ext from '../Ext.svelte';
	import { heading, link, prose } from '../article';
	import AnatomyDiagram from './AnatomyDiagram.svelte';
	import CloneMarquee from './CloneMarquee.svelte';
	import LightTableGallery from './LightTableGallery.svelte';
	import Lightbox2005 from './Lightbox2005.svelte';
	import Shot from './Shot.svelte';
	import Timeline from './Timeline.svelte';

	let { data } = $props();

	const code = 'text-[13px]';
	const dt = 'text-[15px] font-semibold text-neutral-900 dark:text-neutral-50';
	const dd = 'mt-1 text-[15px] leading-7 text-pretty text-neutral-600 dark:text-neutral-400';
</script>

<Article
	published="2026-08-30"
	date="August 30, 2026"
	title="The story of the lightbox"
	seoTitle="What is a lightbox? The 20-year story of the web’s image overlay"
	seoDescription="How a 2005 blog redesign named a UI pattern. The lightbox’s story: tiled PNG backdrops, the jQuery clone wars, a Wikipedia crisis, and the web catching up."
	ldDescription="The history of the lightbox UI pattern: the photographic light table it is named after, the 2005 script that started it, the jQuery clone era, the touch rewrite, the Wikipedia MediaViewer crisis, and the web platform absorbing the pattern piece by piece."
	keywords="lightbox, what is a lightbox, lightbox history, lightbox meaning, image overlay, modal dialog, image gallery, javascript lightbox, react lightbox, lightbox vs modal"
>
	{#snippet lede()}
		You have typed the word a thousand times. It names a box of light photographers kept in dark
		rooms, a script a blogger wrote in the last weeks of 2005, and the way images have opened on the
		web ever since. This is the story of the lightbox: the name, the parts, the clone wars, and the
		twenty-year handoff to the platform.
	{/snippet}

	<!-- Every Shot below opens in its own ramka viewer. Obviously. -->
	<h2 class={heading}>The room was dark first</h2>
	<p class={prose}>
		Before it was JavaScript, a lightbox was furniture. A shallow box, a translucent white top, an
		even glow from inside. Photographers and photo editors spread strips of film and mounted slides
		across it and leaned in with a loupe. The room stayed dim on purpose. All the light in it
		belonged to the pictures. That is the whole idea, and it survived the move to software intact:
		dim the room, light the picture.
	</p>
	<LightTableGallery />
	<p class={prose}>
		The name was already doing rounds outside photography. Radiologists clipped X-rays to
		wall-mounted lightboxes. Advertisers sold backlit poster boxes under the same word. People with
		seasonal depression sit in front of a lightbox every winter morning. And in stock photography
		the word took one more turn that outlived the furniture: picking your selects off the light
		table became such a fixed ritual that agencies like Getty still call a saved collection of
		images a &ldquo;lightbox&rdquo;, a shortlist named after a piece of equipment most of their
		users have never touched.
	</p>
	<p class={prose}>
		So by the time the web needed a name for &ldquo;darken everything except this one photo&rdquo;,
		the metaphor was not just available. It was load-bearing in three industries.
	</p>

	<h2 class={heading}>A blog redesign names a pattern</h2>
	<p class={prose}>
		In December 2005, a designer named Lokesh Dhakar was redesigning his blog. The new layout had a
		narrower content column, his post images overflowed it, and he did not want to resize every
		image each time he tweaked the design. So he replaced the images with thumbnails and wrote a
		script that opened the full-size photo <em>above</em> the page instead of navigating away. The
		account is preserved, with charming honesty, in
		<Ext href="https://github.com/lokesh/lightbox">the original repository&rsquo;s README</Ext>.
		Right before New Year&rsquo;s, he emailed a few of his favorite design bloggers:
	</p>
	<blockquote class="mt-5 border-l-2 border-neutral-200 pl-4 dark:border-neutral-800">
		<div class="text-[15px] leading-7 text-pretty text-neutral-700 italic dark:text-neutral-300">
			&ldquo;I&rsquo;ve written a little script to help people, mainly bloggers, handle large
			images. Its a little faux-popup effect with Javascript. It might be useful for you, or not,
			either way take a look.&rdquo;
		</div>
		<footer class="mt-2 text-[13px] text-neutral-400 not-italic dark:text-neutral-500">
			Lokesh Dhakar, email of December 29, 2005, as preserved in the Lightbox README
		</footer>
	</blockquote>
	<Shot id="lokesh" narrow>
		{#snippet caption()}
			The man behind the email. Lokesh Dhakar, profile photo via
			<Ext href="https://x.com/lokesh">his X profile</Ext>.
		{/snippet}
	</Shot>
	<p class={prose}>
		It might be useful for you, or not. Eight days later
		<Ext href="https://www.wired.com/2006/01/more-floating-photos-introducing-lightbox-js/"
			>WIRED wrote it up</Ext
		>, describing the effect with a phrase that dates it precisely: a &ldquo;shaded
		&lsquo;mask&rsquo; layer of transparent PNGs&rdquo; between the image and the page. In the IE6
		era you could not trust a translucent CSS background, so the dim was literally a tiled picture
		of darkness. The script ran on Prototype and script.aculo.us, jQuery not having been announced
		yet, and it spread through del.icio.us the way things spread before GitHub existed: someone you
		trusted bookmarked it.
	</p>
	<div class="mt-5">
		<CodeBlock {...data.samples.relApi} title="The entire API, 2005–2006" />
	</div>
	<p class={prose}>
		Look at that integration surface for a second. The whole configuration is an HTML attribute. The
		link you already had, doing double duty. It degraded perfectly: no JavaScript, and the href
		simply opened the image, which is progressive enhancement so clean it still gets cited. And it
		planted a seed that took two decades to finish sprouting. From
		<code class={code}>rel=&quot;lightbox&quot;</code> it is a straight line through
		<code class={code}>class=&quot;thickbox&quot;</code> and today&rsquo;s
		<code class={code}>data-</code>-attribute galleries, the idea that your markup is the config
		file. What it is not, is composition. That distinction becomes this story&rsquo;s ending.
	</p>
	<Shot id="original-2006">
		{#snippet caption()}
			The entire product, ten days old: huddletogether.com in January 2006, via the
			<Ext
				href="https://web.archive.org/web/20060110190535/http://www.huddletogether.com/projects/lightbox/"
				>Wayback Machine</Ext
			>. The downloads list is the tell: <code class="text-[12px]">overlay.png</code>, &ldquo;80%
			opacity, black tile used to create shadow&rdquo;, and
			<code class="text-[12px]">loading.gif</code>. (Click it. The images in this article open in a
			lightbox. Anything else would be a scandal.)
		{/snippet}
	</Shot>
	<p class={prose}>
		The script became so much bigger than its author that in 2007, when Dhakar published a charming
		<Ext href="https://lokeshdhakar.com/coffee-drinks-illustrated/"
			>illustrated chart of espresso drinks</Ext
		>, TechCrunch&rsquo;s
		<Ext href="https://techcrunch.com/2007/08/26/lokesh-dhakars-fancy-coffee-drink-cheat-sheet/"
			>write-up</Ext
		>
		opened with its writer admitting he could not place the name: &ldquo;I couldn&rsquo;t figure out for
		the life of me where I&rsquo;d heard his name before but I assumed he was famous for some reason.&rdquo;
		The pattern had already outgrown the person. It was in the process of outgrowing the library too:
		&ldquo;a lightbox&rdquo; stopped meaning Lightbox.js and started meaning the entire category, the
		way kleenex stopped meaning Kleenex.
	</p>
	<Shot id="coffee-drinks" narrow>
		{#snippet caption()}
			The other thing he is famous for.
			<Ext href="https://lokeshdhakar.com/coffee-drinks-illustrated/">Coffee Drinks Illustrated</Ext
			>
			by Lokesh Dhakar, <Ext href="https://creativecommons.org/licenses/by-nc/3.0/"
				>CC BY-NC 3.0</Ext
			>.
		{/snippet}
	</Shot>
	<p class={prose}>Here is what all that fuss looked like. Click a thumbnail.</p>

	<Lightbox2005 />

	<Shot id="lightbox2-live">
		{#snippet caption()}
			Not a museum piece: the real
			<Ext href="https://lokeshdhakar.com/projects/lightbox2/">Lightbox2 demo page</Ext>,
			photographed live in 2026, banner for Lightbox 3 included.
		{/snippet}
	</Shot>

	<h2 class={heading}>The clone wars</h2>

	<CloneMarquee />

	<p class={prose}>
		Four months after that email, the cloning began. In April 2006 Cody Lindley released Thickbox,
		and the announcement came from the highest possible authority,
		<Ext href="https://blog.jquery.com/2006/04/24/thickbox/"
			>John Resig himself, on the official jQuery blog</Ext
		>:
	</p>
	<blockquote class="mt-5 border-l-2 border-neutral-200 pl-4 dark:border-neutral-800">
		<div class="text-[15px] leading-7 text-pretty text-neutral-700 italic dark:text-neutral-300">
			&ldquo;Cody Lindley just released a brand new version of Lightbox/Greybox called Thickbox. […]
			this release is completely unobtrusive - it uses the natural href, src, and title attributes
			to seed the box, when it pops up. Even if you don&rsquo;t have Javascript enabled, it still
			behaves naturally.&rdquo;
		</div>
		<footer class="mt-2 text-[13px] text-neutral-400 not-italic dark:text-neutral-500">
			John Resig, jquery.com, April 24, 2006
		</footer>
	</blockquote>
	<p class={prose}>
		Then the floodgates. Slimbox in <Ext href="https://www.digitalia.be/software/slimbox/"
			>October 2006</Ext
		>, a 4&nbsp;KB clone whose entire pitch was its file size. Fancybox in
		<Ext href="https://fancybox.net/changelog/">April 2008</Ext>. Colorbox in
		<Ext href="https://github.com/jackmoore/colorbox">March 2009</Ext>. Greybox, Shadowbox,
		prettyPhoto, Highslide. For about five years, naming a lightbox meant choosing an adjective and
		appending &ldquo;box&rdquo;. By April 2008 the ecosystem was chaotic enough that one developer
		built
		<Ext
			href="https://planetozh.com/blog/2008/04/the-lightbox-clone-matrix-compare-30-lightbox-scripts/"
			>a comparison matrix of more than thirty clones</Ext
		>, opening with a sentence that captures the era: &ldquo;Early 2006, a cool guy named Lokesh
		Dhakar introduced Lightbox […] Since, every once in a while, someone comes up with their own
		take at this concept, using this or that javascript library (jQuery, Prototype, Mootools, YUI,
		you name it).&rdquo; Every JavaScript framework of the era needed its own clone, because plugins
		could not cross framework lines.
	</p>
	<Shot id="clone-matrix">
		{#snippet caption()}
			<Ext href="http://planetozh.com/projects/lightbox-clones/">The Lightbox Clones Matrix</Ext>,
			still online today. Every pill in the wall above is one of its rows.
		{/snippet}
	</Shot>
	<p class={prose}>
		What did they compete on? Kilobytes, transitions, and content types: iframes, inline HTML,
		Flash, video, AJAX. And since the markup-as-config API had nowhere to grow, differentiation
		moved into options objects, which grew, and grew, and never stopped growing.
		<a href="/blog/headless-lightbox" class={link}>The case for a headless React lightbox</a>
		traces where sixty-option config objects eventually lead; this era is where they were born.
	</p>

	<h2 class={heading}>Lightbox, modal, dialog, popup: who is who</h2>
	<p class={prose}>
		The clone era also scrambled the vocabulary, and it has never fully recovered. If you have ever
		lost a naming argument in a design review, here is the untangling:
	</p>
	<dl class="mt-5">
		<div class="mt-4 first:mt-0">
			<dt class={dt}>Popup</dt>
			<dd class={dd}>
				The ancestor, and the villain of the origin story. A separate browser window via
				<code class={code}>window.open()</code>, so despised by 2005 that &ldquo;faux-popup&rdquo;,
				Dhakar&rsquo;s own words, was a selling point. The word now mostly means marketing overlays,
				which inherited the reputation.
			</dd>
		</div>
		<div class="mt-4 first:mt-0">
			<dt class={dt}>Dialog</dt>
			<dd class={dd}>
				A window that lives inside the page and talks to you. The generic pattern, and since 2022 an
				HTML element.
			</dd>
		</div>
		<div class="mt-4 first:mt-0">
			<dt class={dt}>Modal</dt>
			<dd class={dd}>
				Not a thing but a property: a dialog is modal when the rest of the page stops working until
				you deal with it. &ldquo;A modal&rdquo; as a noun is the industry&rsquo;s most successful
				grammatical error.
			</dd>
		</div>
		<div class="mt-4 first:mt-0">
			<dt class={dt}>Lightbox</dt>
			<dd class={dd}>
				A modal dialog whose occupant is media. Dim the room, light the picture, navigate between
				pictures. If it has a backdrop and a photo, it is a lightbox, whatever the marketing site
				calls it.
			</dd>
		</div>
		<div class="mt-4 first:mt-0">
			<dt class={dt}>Carousel</dt>
			<dd class={dd}>
				The strip of slides itself, which can live inside a lightbox or directly on a page. A
				lightbox is usually a modal wrapped around a carousel, which is why it inherits the
				accessibility obligations of both.
			</dd>
		</div>
	</dl>

	<h2 class={heading}>The anatomy, and the names that stuck</h2>
	<p class={prose}>
		Strip away twenty years of visual fashion and the machine has barely changed. The parts the
		pattern settled on in its first years are the parts every implementation still has:
	</p>

	<AnatomyDiagram />

	<p class={prose}>
		This is also why, when we named ramka&rsquo;s
		<a href="/docs/lightbox/composition" class={link}>composable lightbox primitives</a>, we mostly
		did not have to invent anything. <code class={code}>Backdrop</code>,
		<code class={code}>Stage</code>, <code class={code}>Slides</code>,
		<code class={code}>Counter</code>, <code class={code}>Caption</code>,
		<code class={code}>Close</code>, <code class={code}>Thumbnail</code>. The pattern named its own
		organs decades ago. A component library&rsquo;s job is to hand them to you individually instead
		of fused together.
	</p>

	<h2 class={heading}>The mobile turn</h2>
	<p class={prose}>
		Then the iPhone shipped, and the pattern&rsquo;s core assumption, a mouse, quietly died. Look
		back at the 2006 recreation above: previous and next appear when you <em>hover</em> the photo&rsquo;s
		halves. There is no hover on glass. An entire generation of lightboxes had hidden their navigation
		inside an input that touchscreens do not have.
	</p>
	<p class={prose}>
		The rewrite arrived from an unexpected direction: not a famous framework author but
		<Ext href="https://github.com/dimsemenov/PhotoSwipe">PhotoSwipe</Ext>, started in 2011 at Code
		Computerlove, a digital agency in Manchester, and built touch-first from day one. Swipe to
		navigate, pinch to zoom, momentum that kept moving after your finger left. In March 2014 the
		agency handed the project to Dmitry Semenov, who had already written Magnific Popup (that is two
		of the most-deployed lightboxes ever, one author), and his rewrite became the standard everyone
		else chased. The price of the new features was steep, though rarely itemized: swipe, momentum
		and rubber-banding are platform physics, and a JavaScript carousel has to reimplement all of
		them, frame by frame, on the main thread.
		<a href="/blog/why-native-scrolling" class={link}
			>Why native scrolling beats transform carousels</a
		>
		is this story&rsquo;s sequel about exactly that bill coming due.
	</p>
	<p class={prose}>
		The design north star also changed. The clone era imitated other websites; the touch era
		imitated the iOS Photos app: pull the photo downward to dismiss it, morph it back into the
		thumbnail it came from. And in an ending nobody would have predicted in 2013, Semenov eventually
		<Ext href="https://dimsemenov.com/plugins/magnific-popup/">deprecated Magnific Popup</Ext> with advice
		that closes the loop on this whole section of history: use a native
		<code class={code}>&lt;dialog&gt;</code> element if you need a basic popup. The author of the jQuery
		era&rsquo;s favorite lightbox now tells you to start with an HTML tag.
	</p>
	<Shot id="magnific-deprecated">
		{#snippet caption()}
			<Ext href="https://dimsemenov.com/plugins/magnific-popup/">dimsemenov.com</Ext> today. The era&rsquo;s
			favorite lightbox, pointing you at an HTML element.
		{/snippet}
	</Shot>

	<h2 class={heading}>The lightbox that caused a constitutional crisis</h2>
	<p class={prose}>
		In 2014 the lightbox got its strangest historical footnote. Wikimedia rolled out MediaViewer, a
		lightbox for Wikipedia&rsquo;s article images, and the editing communities pushed back hard,
		arguing it was not ready. Surveys and requests for comment on English Wikipedia, Wikimedia
		Commons and German Wikipedia reached consensus to turn it off by default. The Foundation
		declined. On German Wikipedia, an administrator disabled the viewer anyway, by editing the
		site&rsquo;s <code class={code}>Common.js</code>.
	</p>
	<p class={prose}>
		What happened next escalated past software entirely. On August 10, 2014, the Foundation created
		a brand-new user right called <Ext href="https://meta.wikimedia.org/wiki/Superprotect"
			>superprotect</Ext
		> and used it, the same day, to lock that JavaScript page above the reach of the site&rsquo;s own
		administrators.
		<Ext href="https://signpost.news/2014-08-13/News_and_notes">The Signpost</Ext>,
		Wikipedia&rsquo;s internal newspaper, explained the new power flatly:
		&ldquo;&lsquo;Superprotect&rsquo; is a level above full protection, and prevents edits by
		administrators.&rdquo; The German community responded by blocking the Foundation&rsquo;s deputy
		director for a month. An open letter against the move collected nearly a thousand signatures.
		The protection came off the page that same August; the superprotect right itself was abolished
		in 2015.
	</p>
	<p class={prose}>
		Somewhere between &ldquo;dim the page&rdquo; and &ldquo;show the next photo&rdquo;, an image
		overlay had triggered a constitutional crisis in the largest collaborative project in human
		history. No other UI component can put that on its résumé.
	</p>
	<Shot id="mediaviewer-live">
		{#snippet caption()}
			And it won: MediaViewer, photographed on the
			<Ext href="https://en.wikipedia.org/wiki/Apollo_11">Apollo 11 article</Ext> in 2026. Counter, arrows,
			caption, backdrop: a lightbox. (Photo: NASA, public domain.)
		{/snippet}
	</Shot>

	<h2 class={heading}>The platform catches up</h2>
	<p class={prose}>
		Here is a different way to read the clone-era feature matrices: as a stack of bug reports
		against the web platform. Centering a box. Dimming a page. Trapping focus. Closing on Escape.
		Every lightbox since 2005 had shipped the same few hundred lines of workaround, and the platform
		eventually absorbed them: the
		<Ext href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog"
			><code class={code}>&lt;dialog&gt;</code> element</Ext
		>
		shipped in Chrome in 2014 but became usable in earnest in March 2022, when Safari 15.4 and Firefox
		98 shipped it weeks apart. With it came the top layer, which ended the z-index arms race, and
		<Ext href="https://developer.mozilla.org/en-US/docs/Web/CSS/::backdrop"
			><code class={code}>::backdrop</code></Ext
		>, which turned the dim from a tiled PNG into a pseudo-element the browser draws for you. The
		<code class={code}>inert</code> attribute made &ldquo;the rest of the page stops working&rdquo; a
		one-word contract.
	</p>
	<p class={prose}>
		The gallery half followed the same road. CSS scroll snap, cross-browser since 2019, made
		&ldquo;a scroller that stops one photo at a time&rdquo; a stylesheet rule instead of a physics
		engine. <code class={code}>overscroll-behavior</code> tamed the edges. Native scrolling brought platform
		momentum with it, no reimplementation required. And the View Transitions API is currently absorbing
		the last showpiece: the morph between thumbnail and full photo that the touch era copied from iOS.
		Twenty years of library features, standardized one spec at a time.
	</p>
	<p class={prose}>
		What the platform cannot absorb is the part that was never generic: your markup, your design,
		your captions and buttons and layout. Which is precisely the part the current generation of
		lightboxes, the headless generation, hands back to you.
	</p>

	<h2 class={heading}>Twenty years in one scroll</h2>

	<Timeline />

	<h2 class={heading}>Where the story goes next</h2>
	<p class={prose}>
		Four eras, four architectures. An attribute on a link, degrading gracefully to a page load. A
		jQuery plugin with an options object. A React component with a bigger options object. And now
		primitives you compose, where the library ships the behavior and the pixels are yours. The old
		eras never fully leave, though. They linger in production.
		<Ext href="https://webaim.org/projects/million/">WebAIM&rsquo;s 2026 scan</Ext> of the top million
		homepages still detects the original Lightbox script on nearly 39,000 of them, averaging 25.7 percent
		more accessibility errors than the mean, with FancyBox at 60.3 percent more. History, in this pattern,
		is not something you read about. It is something you inherit and
		<a href="/blog/lightbox-accessibility" class={link}>something screen readers still trip over</a
		>.
	</p>
	<p class={prose}>
		ramka is our contribution to the current chapter: a
		<a href="/blog/headless-lightbox" class={link}>headless React lightbox</a>
		built on the parts this pattern spent twenty years discovering: a real scroller for the slides, real
		dialog semantics for the modal, and every visible piece of chrome rendered by you. If the history
		made you want to build one, the <a href="/docs" class={link}>docs</a> take about ten minutes. Dim
		the room. Light the picture.
	</p>
</Article>
