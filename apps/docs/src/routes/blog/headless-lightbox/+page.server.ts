import { highlightSamples } from '../samples.server';

// Third-party APIs are quoted as they are (React and plain JS); ramka's own
// samples show the Svelte API.
const workaround = `// The documented workaround, from the maintainer, for
// "hide the arrows when there is only one image":
const renderNavigation = slides.length <= 1 ? () => null : undefined;

<Lightbox
  render={{ buttonPrev: renderNavigation, buttonNext: renderNavigation }}
  // ...and a separate setting so the keyboard agrees with the buttons
  carousel={{ finite: true }}
/>`;

const composedFix = `<!-- The same fix when the buttons are yours to render -->
{#if items.length > 1}
  <PrevButton />
  <NextButton />
{/if}`;

const shapeOne = `const lightbox = new Lightbox({
  gallery: '#gallery',
  children: 'a',
});

// A custom toolbar button is an HTML string with a z-order.
// The built-ins have fixed slots: the counter is order 5,
// zoom is 10, info is 15, the close button is order 20.
lightbox.on('uiRegister', () => {
  lightbox.pswp.ui.registerElement({
    name: 'share-button',
    ariaLabel: 'Share photo',
    order: 9,
    isButton: true,
    html: '<svg viewBox="0 0 24 24">…</svg>',
    onClick: (event, el) => {
      /* … */
    },
  });
});`;

const shapeTwo = `<!-- The caption is HTML, in a string, in an attribute. -->
<a
  href="photos/coast.jpg"
  data-sub-html="<h4>Golden hour</h4><p>Shot on the coast road.</p>"
>
  <img src="photos/coast-thumb.jpg" alt="Golden hour" />
</a>`;

const shapeTwoConfig = `lightbox(element, {
  licenseKey: '0000-0000-000-0000',
  nextHtml: '<svg>…</svg>', // the next button, as a string
  prevHtml: '<svg>…</svg>',
  strings: { closeGallery: 'Close gallery' }, // i18n, as config
  ariaLabelledby: 'gallery-heading', // ARIA, as config
  mobileSettings: { controls: false, showCloseIcon: true },
});`;

const shapeThree = `<Lightbox
  open={open}
  close={() => setOpen(false)}
  slides={[{ src, title, description }]}
  plugins={[Captions, Counter, Thumbnails, Zoom]}
  labels={{ Next: 'Next photo', Close: 'Close' }}
  render={{
    buttonPrev: () => <MyPrevButton />,
    iconClose: () => <MyCloseIcon />,
  }}
  styles={{ container: { ... }, button: { ... }, icon: { ... } }}
/>`;

const ramkaShape = `<Lightbox.Root>
  <Lightbox.Trigger index={0}>
    <img src={photo.thumb} alt={photo.alt} />
  </Lightbox.Trigger>

  <Lightbox.Portal>
    <Lightbox.Backdrop class="…" />
    <Lightbox.Content aria-label={t('viewer.title')} class="…">
      <Lightbox.Slides class="…"><!-- your slides --></Lightbox.Slides>

      <!-- Every element below is yours: attach anything an element can carry. -->
      <Tooltip content={t('viewer.closeHint')}>
        <Lightbox.Close aria-label={t('viewer.close')} data-testid="viewer-close">
          <X />
        </Lightbox.Close>
      </Tooltip>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>`;

const sidebar = `<Lightbox.Content class="grid md:grid-cols-[1fr_360px]">
  <!-- Stage scopes the gestures to the media pane -->
  <Lightbox.Stage>
    <Lightbox.Slides><!-- … --></Lightbox.Slides>
  </Lightbox.Stage>

  <!-- A real sidebar: your components, live beside the photo,
       with native scroll and its own keyboard behavior. -->
  <aside aria-label="Comments">
    <CommentThread photoId={activePhotoId} />
  </aside>
</Lightbox.Content>`;

export async function load() {
	return {
		samples: await highlightSamples({
			workaround: { code: workaround, lang: 'tsx' },
			composedFix: { code: composedFix, lang: 'svelte' },
			shapeOne: { code: shapeOne, lang: 'javascript' },
			shapeTwo: { code: shapeTwo, lang: 'jsx' },
			shapeTwoConfig: { code: shapeTwoConfig, lang: 'javascript' },
			shapeThree: { code: shapeThree, lang: 'tsx' },
			ramkaShape: { code: ramkaShape, lang: 'svelte' },
			sidebar: { code: sidebar, lang: 'svelte' }
		})
	};
}
