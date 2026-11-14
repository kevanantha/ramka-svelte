import { highlightSamples } from '../samples.server';

const relApi = `<!-- Lightbox, December 2005. The entire integration: -->
<a href="images/fort-funston.jpg" rel="lightbox" title="Dunes at Fort Funston">
  my photo
</a>

<!-- Lightbox 2, 2006. Name a set inside the brackets and you have a gallery: -->
<a href="images/one.jpg" rel="lightbox[roadtrip]">one</a>
<a href="images/two.jpg" rel="lightbox[roadtrip]">two</a>`;

export async function load() {
	return { samples: await highlightSamples({ relApi: { code: relApi, lang: 'html' } }) };
}
