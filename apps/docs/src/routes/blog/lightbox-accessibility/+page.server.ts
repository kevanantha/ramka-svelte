import { highlightSamples } from '../samples.server';

const guards = `<!-- Two invisible spans bracket the dialog. Tab past either edge and the
     guard hands focus back to the opposite end. This is the entire trap.
     Note what is *not* here: no aria-hidden. A focusable element must never
     be hidden from assistive tech (axe flags it as a serious violation) —
     an empty span announces nothing anyway, and focus never rests on it. -->
<span tabindex="0" data-focus-guard onfocus={focusLastTabbable}></span>
<div role="dialog" aria-modal="true" tabindex="-1">
  {@render children()}
</div>
<span tabindex="0" data-focus-guard onfocus={focusFirstTabbable}></span>`;

const naming = `<!-- The library ships no copy for these; the words are yours to pass.
     In a localized app they come from your translation catalogue. -->
<Lightbox.Slides
  aria-label="Full-size images"
  aria-roledescription="carousel"
>
  {#each items as item, i (item.id)}
    <Lightbox.Slide>
      <Lightbox.Item
        index={i}
        aria-roledescription="slide"
        aria-label="{i + 1} of {items.length}"
      >
        …
      </Lightbox.Item>
    </Lightbox.Slide>
  {/each}
</Lightbox.Slides>`;

const counter = `<!-- Visible on mobile, where there is no thumbnail strip to show
     position. On desktop the strip covers that, so the counter
     collapses to sr-only and keeps only its announcement role. -->
<Lightbox.Counter class="text-xs md:sr-only">
  {#snippet children({ current, total })}{current} of {total}{/snippet}
</Lightbox.Counter>`;

const reducedMotion = `// The morph never runs for users who asked for less motion.
// They get the plain fade instead; nothing to configure.
export function supportsViewTransitions(): boolean {
  return (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}`;

export async function load() {
	return {
		samples: await highlightSamples({
			guards: { code: guards, lang: 'svelte' },
			naming: { code: naming, lang: 'svelte' },
			counter: { code: counter, lang: 'svelte' },
			reducedMotion: { code: reducedMotion, lang: 'typescript' }
		})
	};
}
