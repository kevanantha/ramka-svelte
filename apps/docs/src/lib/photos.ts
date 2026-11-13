/**
 * Landing photos, from the original ramka docs (Unsplash license via
 * picsum.photos). Full-size files in static/photos, trigger thumbnails in
 * static/photos/thumbs (scripts/make-thumbs.sh).
 */
import { blurPlaceholder } from './blur-placeholder';

export interface GalleryItem {
	src: string;
	thumb: string;
	width: number;
	height: number;
	alt: string;
	caption: string;
	/** Stable key for the slide (defaults to `src`). */
	id?: string;
	/** 8px LQIP for the blur-up placeholder (see blur-placeholder.ts). */
	blurDataURL?: string;
	/**
	 * Blur-up placeholder on the destination image. Only for items whose
	 * index has no trigger image: otherwise Ramka paints the trigger's decoded
	 * thumb behind the destination, and a blur would cover that bridge.
	 */
	destinationBlur?: boolean;
}

/** 8px webp LQIPs of the static photos (vite-imagetools `inline`). */
const lqips = import.meta.glob<string>('../../static/photos/{xfade-*,morph*,bbb-poster}.jpg', {
	query: '?w=8&format=webp&inline',
	import: 'default',
	eager: true
});

/** next/image-style blur LQIP style for a static photo (see blur-placeholder.ts). */
export function blurStyle(item: GalleryItem): string | undefined {
	const lqip = item.blurDataURL ?? lqips[`../../static${item.src}`];
	return lqip && blurPlaceholder(lqip, { w: item.width, h: item.height });
}

function photo(
	name: string,
	width: number,
	height: number,
	alt: string,
	caption: string
): GalleryItem {
	return {
		src: `/photos/${name}.jpg`,
		thumb: `/photos/thumbs/${name}.jpg`,
		width,
		height,
		alt,
		caption
	};
}

export const ramkaA = photo(
	'ramka-a',
	1200,
	1600,
	'Person standing in a sunlit meadow at golden hour',
	'Golden hour in the meadow'
);
export const ramkaB = photo(
	'ramka-b',
	1600,
	1067,
	'Seashells scattered along the shoreline',
	'Seashells on the shore'
);
export const ramkaC = photo(
	'ramka-c',
	1600,
	1000,
	'Curved building facade in black and white',
	'Curved facade, in monochrome'
);
export const ramkaD = photo(
	'ramka-d',
	1200,
	1600,
	'Airplane crossing a purple sky above the clouds',
	'Above the clouds at dusk'
);
export const ramkaE = photo(
	'ramka-e',
	1200,
	1600,
	'Fog rolling over dark hills',
	'Fog rolling over the valley'
);
export const ramkaF = photo(
	'ramka-f',
	1600,
	1000,
	'Aerial view of a road entering twin forest tunnels',
	'Twin tunnels from above'
);
export const ramkaG = photo(
	'ramka-g',
	1600,
	1000,
	'Bride seen through the windows of a vintage car',
	'Through the wedding car window'
);
export const ramkaH = photo(
	'ramka-h',
	1200,
	1500,
	'Sandstone hoodoos under a summer sky',
	'Hoodoos under a summer sky — Bryce Canyon'
);
export const ramkaI = photo(
	'ramka-i',
	1600,
	1600,
	'The Leaning Tower of Pisa at dusk',
	'The leaning arches of Pisa'
);
export const ramkaJ = photo(
	'ramka-j',
	1600,
	900,
	'Father carrying a child along a sandy beach',
	'Beach walk, kid in tow'
);
export const ramkaK = photo(
	'ramka-k',
	1200,
	1600,
	'Brutalist concrete tower against a pale sky',
	'Concrete against a pale sky'
);
export const ramkaL = photo(
	'ramka-l',
	1600,
	1600,
	'Out-of-focus city lights glowing at dusk',
	'City lights, out of focus'
);
export const ramkaM = photo(
	'ramka-m',
	1600,
	1000,
	'Patches of snow on a mossy forest floor',
	'First snow in the forest'
);
export const ramkaN = photo(
	'ramka-n',
	1200,
	1600,
	'Husky dog in a harness looking into the distance',
	'Husky on the lookout'
);

/** Real-estate listing photos (original docs' prop-*.jpg). */
const PROPERTY = 'The Olive Grove Residence';
function property(file: string, width: number, height: number, alt: string, label: string) {
	return {
		...photo(file, width, height, alt, `${label} — ${PROPERTY}`),
		id: file,
		label
	};
}

export const propertyPhotos = [
	property('prop-hero', 1400, 900, 'Living room with floor-to-ceiling windows', 'Living Room'),
	property('prop-kitchen', 1400, 900, 'Modern kitchen with marble island', 'Kitchen'),
	property('prop-bed', 900, 1400, 'Primary bedroom with en-suite balcony', 'Primary Bedroom'),
	property('prop-bath', 900, 1400, 'Spa-style bathroom with freestanding tub', 'Bathroom'),
	property('prop-terrace', 1400, 900, 'Rooftop terrace with city views', 'Terrace'),
	property('prop-dining', 1400, 900, 'Dining area with designer lighting', 'Dining'),
	property('prop-office', 900, 1200, 'Home office with built-in shelving', 'Office'),
	property('prop-pool', 1400, 900, 'Infinity pool overlooking the valley', 'Pool'),
	property('prop-garden', 1400, 900, 'Landscaped garden with mature olive trees', 'Garden'),
	property('prop-ext', 900, 1400, 'Front elevation at dusk with warm lighting', 'Exterior')
];

// Guide-page photos, from the original docs (Unsplash license via picsum.photos).

/** Lightbox docs hero (overview page). */
export const docsHero = [
	photo('docs-hero-a', 1200, 800, 'Mountain ridge', 'Mountain ridge'),
	photo('docs-hero-b', 1200, 800, 'Coastal path', 'Coastal path'),
	photo('docs-hero-c', 1200, 800, 'Forest light', 'Forest light')
];

/** The shared six-photo set from the original's `_data/lightbox-images.ts`. */
export const lightboxImages = [
	photo(
		'lb1',
		1200,
		800,
		'Mountain landscape at sunrise',
		'Mountain landscape at sunrise — Dolomites, Italy'
	),
	photo(
		'lb2',
		1200,
		800,
		'Ocean waves crashing on rocks',
		'Ocean waves crashing on coastal rocks — Big Sur, California'
	),
	photo('lb3', 1200, 800, 'Forest path in autumn', 'Autumn forest path — Black Forest, Germany'),
	photo('lb4', 1200, 800, 'City skyline at night', 'City skyline at night — Tokyo, Japan'),
	photo('lb5', 1200, 800, 'Desert sand dunes', 'Sand dunes at golden hour — Sahara Desert'),
	photo('lb6', 1200, 800, 'Northern lights over a lake', 'Aurora borealis — Lofoten, Norway')
];

/** morphTo demos (view transitions page). */
export const morphImages = [
	photo('morph1', 1200, 800, 'Alpine meadow', 'Alpine meadow'),
	photo('morph2', 1200, 800, 'Rocky coastline', 'Rocky coastline'),
	photo('morph3', 1200, 800, 'Autumn vineyard', 'Autumn vineyard'),
	photo('morph4', 1200, 800, 'Desert canyon', 'Desert canyon'),
	photo('morph5', 1200, 800, 'Northern lake', 'Northern lake')
];

/** Crossfade + source-aspect demos. Matching 3∶2 sources unless noted. */
export const xfade = {
	a: photo('xfade-a', 1500, 1000, 'Coastal cliffs', 'Coastal cliffs'),
	/** A CDN-style baked 1∶1 crop of `a` (the "Don't" case). */
	aSquare: photo('xfade-a-square', 1000, 1000, 'Coastal cliffs', 'Coastal cliffs'),
	b: photo('xfade-b', 1500, 1000, 'Mountain lake', 'Mountain lake'),
	c: photo('xfade-c', 1500, 1000, 'Desert road', 'Desert road'),
	d: photo('xfade-d', 1500, 1000, 'Pine forest', 'Pine forest'),
	e: photo('xfade-e', 1500, 1000, 'City night', 'City night'),
	f: photo('xfade-f', 1500, 1000, 'Snow peak', 'Snow peak'),
	g: photo('xfade-g', 1500, 1000, 'River bend', 'River bend'),
	ava: photo('xfade-ava', 900, 1200, 'Portrait of Ava Chen', 'Ava Chen'),
	jules: photo('xfade-jules', 900, 1200, 'Portrait of Jules Okonkwo', 'Jules Okonkwo'),
	sam: photo('xfade-sam', 900, 1200, 'Portrait of Sam Rivera', 'Sam Rivera'),
	mei: photo('xfade-mei', 900, 1200, 'Portrait of Mei Laurent', 'Mei Laurent'),
	bbbPoster: photo('bbb-poster', 500, 707, 'Big Buck Bunny', 'Big Buck Bunny')
};
