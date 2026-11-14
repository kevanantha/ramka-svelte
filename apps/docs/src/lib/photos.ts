/**
 * Landing photos, from the original ramka docs (Unsplash license via
 * picsum.photos). Full-size files in static/photos, trigger thumbnails in
 * static/photos/thumbs (scripts/make-thumbs.sh).
 */
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
