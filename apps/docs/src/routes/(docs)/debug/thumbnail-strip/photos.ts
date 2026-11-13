/**
 * The debug page's 24 photos (`ramka-strip-*`, from the original docs'
 * `app/_assets/photos`). Full-size files in static/photos, thumbnails in
 * static/photos/thumbs (scripts/make-thumbs.sh).
 */
export interface StripPhoto {
	id: string;
	src: string;
	thumb: string;
	width: number;
	height: number;
	alt: string;
	caption: string;
	/** width / height. */
	aspect: number;
}

/** Intrinsic sizes of ramka-strip-0…5; the set repeats the pattern four times. */
const SIZES: [number, number][] = [
	[1200, 800],
	[800, 1200],
	[1200, 1200],
	[1400, 788],
	[1000, 1250],
	[1300, 975]
];

/** Short handwritten-style labels for the polaroid matte band. */
const POLAROID_LABELS = [
	'july 12',
	'road trip',
	'golden hour',
	'late night',
	'home',
	'say cheese',
	'coastline',
	'after rain',
	'blue hour',
	'sunday',
	'city walk',
	'sunset',
	'on the train',
	'market day',
	'first snow',
	'backyard',
	'open road',
	'coffee run',
	'night bus',
	'old town',
	'river walk',
	'picnic',
	'neon signs',
	'early flight'
] as const;

export const stripPhotos: StripPhoto[] = Array.from({ length: 24 }, (_, i) => {
	const [width, height] = SIZES[i % SIZES.length]!;
	return {
		id: `strip-demo-${i}`,
		src: `/photos/ramka-strip-${i}.jpg`,
		thumb: `/photos/thumbs/ramka-strip-${i}.jpg`,
		width,
		height,
		alt: `Photo ${i + 1}`,
		caption: POLAROID_LABELS[i % POLAROID_LABELS.length] ?? `Frame ${i + 1}`,
		aspect: width / height
	};
});
