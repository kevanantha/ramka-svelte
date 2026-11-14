import { highlightSamples } from '../samples.server';

const carousel = `// The heart of nearly every JS carousel, simplified.
el.addEventListener('pointermove', (e) => {
  offset += e.clientX - lastX;
  lastX = e.clientX;
  track.style.transform = \`translateX(\${offset}px)\`;
});

el.addEventListener('pointerup', () => {
  requestAnimationFrame(function fling() {
    velocity *= 0.95; // the reverse-engineered iOS constant
    offset += velocity;
    track.style.transform = \`translateX(\${offset}px)\`;
    if (Math.abs(velocity) > 0.1) requestAnimationFrame(fling);
  });
});`;

const slidesCss = `/* The scroll core of ramka's Slides, shown as CSS.
   (ramka applies these as inline styles.) */
[data-ramka-slides] {
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
}

[data-ramka-slide] {
  scroll-snap-align: center;
  scroll-snap-stop: always;
}`;

const slidesMarkup = `<Lightbox.Slides aria-label="Photos">
  {#each items as item, i (item.id)}
    <Lightbox.Slide>
      <Lightbox.Item index={i}>…</Lightbox.Item>
    </Lightbox.Slide>
  {/each}
</Lightbox.Slides>`;

export async function load() {
	return {
		samples: await highlightSamples({
			carousel: { code: carousel, lang: 'typescript' },
			slidesCss: { code: slidesCss, lang: 'css' },
			slidesMarkup: { code: slidesMarkup, lang: 'svelte' }
		})
	};
}
