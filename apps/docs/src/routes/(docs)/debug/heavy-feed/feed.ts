/**
 * Config and deterministic content for the heavy-feed debug page. Everything
 * is URL-driven so a profiling setup survives reloads:
 *
 *   /debug/heavy-feed?elements=16000&load=medium&live=1
 */
import { lightboxImages, type GalleryItem } from '#lib/photos.js';

export const TARGET_SIZES = [500, 1000, 4000, 8000, 16000, 20000] as const;
const DEFAULT_TARGET = 4000;

/** Rough DOM elements per rendered post (checked against the measured bar). */
export const ELEMENTS_PER_POST = 30;

export type LoadLevel = 'off' | 'light' | 'medium' | 'heavy';

/** Block `blockMs` of every `periodMs` — approximate main-thread utilization. */
export const LOAD_LEVELS: Record<
	Exclude<LoadLevel, 'off'>,
	{ blockMs: number; periodMs: number }
> = {
	light: { blockMs: 5, periodMs: 50 }, // ~10% busy
	medium: { blockMs: 20, periodMs: 100 }, // ~20% busy, 20ms stalls
	heavy: { blockMs: 50, periodMs: 100 } // ~50% busy, 50ms stalls
};

export interface FeedConfig {
	elements: number;
	load: LoadLevel;
	live: boolean;
	/** `content-visibility: auto` on each post, so offscreen posts skip layout/paint. */
	contentVisibility: boolean;
}

export const DEFAULT_CONFIG: FeedConfig = {
	elements: DEFAULT_TARGET,
	load: 'off',
	live: false,
	contentVisibility: false
};

export function parseConfig(search: string): FeedConfig {
	const params = new URLSearchParams(search);
	const elements = Number(params.get('elements'));
	const load = params.get('load') as LoadLevel | null;
	return {
		elements: (TARGET_SIZES as readonly number[]).includes(elements) ? elements : DEFAULT_TARGET,
		load: load && (load === 'off' || load in LOAD_LEVELS) ? load : 'off',
		live: params.get('live') === '1',
		contentVisibility: params.get('cv') === '1'
	};
}

/** The current URL with `config` written into its search params. */
export function configUrl(config: FeedConfig): URL {
	const url = new URL(window.location.href);
	url.searchParams.set('elements', String(config.elements));
	if (config.load === 'off') url.searchParams.delete('load');
	else url.searchParams.set('load', config.load);
	if (config.live) url.searchParams.set('live', '1');
	else url.searchParams.delete('live');
	if (config.contentVisibility) url.searchParams.set('cv', '1');
	else url.searchParams.delete('cv');
	return url;
}

// Deterministic feed content (no Math.random — stable across re-renders).

export const NAMES = [
	'Maya Lindqvist',
	'Jonas Weber',
	'Aisha Okafor',
	'Tom Brennan',
	'Yuki Tanaka',
	'Carla Mendes',
	'Piotr Nowak',
	'Sofia Ricci',
	'Dev Sharma',
	'Elena Petrova',
	'Marcus Hale',
	'Ines Laurent'
];

const TEXTS = [
	'Morning light at the harbor was unreal today. Straight off the sensor, no edits.',
	'Testing the new 35mm — the falloff on this lens is something else.',
	'Three hours of hiking for this one frame. Worth every step.',
	'Street market chaos, one quiet corner. Sometimes the photo finds you.',
	'Revisited an old spot with new eyes. Same pier, completely different picture.',
	'Long exposure experiments continue. The water turns to glass at 30 seconds.',
	'Caught the last ferry and the last light within the same minute.',
	'Backlog cleanup: found this from last winter and cannot believe I sat on it.'
];

/**
 * Image counts per post, cycled by index — 1–10 like real feeds (with some
 * text-only posts mixed in). Average ≈ 3 images per post.
 */
const IMAGE_COUNTS = [1, 3, 0, 2, 4, 1, 7, 2, 0, 10, 1, 5] as const;

export interface FeedPost {
	id: number;
	name: string;
	handle: string;
	minutesAgo: number;
	text: string;
	/** 0–10 photos; empty for text-only posts. */
	photos: GalleryItem[];
	likes: number;
	replies: number;
	reposts: number;
}

export function buildPosts(count: number): FeedPost[] {
	const posts: FeedPost[] = [];
	for (let i = 0; i < count; i++) {
		const name = NAMES[i % NAMES.length]!;
		const imageCount = IMAGE_COUNTS[i % IMAGE_COUNTS.length]!;
		posts.push({
			id: i,
			name,
			handle: `@${name.split(' ')[0]!.toLowerCase()}${(i % 97) + 1}`,
			minutesAgo: (i * 7) % 1440,
			text: TEXTS[(i * 5 + Math.floor(i / TEXTS.length)) % TEXTS.length]!,
			photos: Array.from(
				{ length: imageCount },
				(_, j) => lightboxImages[(i + j) % lightboxImages.length]!
			),
			likes: (i * 37) % 900,
			replies: (i * 13) % 120,
			reposts: (i * 29) % 300
		});
	}
	return posts;
}

export const timestamp = (minutesAgo: number) =>
	minutesAgo < 60 ? `${Math.max(1, minutesAgo)}m` : `${Math.floor(minutesAgo / 60)}h`;

/** Deterministic avatar hue per author. */
export const avatarHue = (id: number) => (id * 47) % 360;
