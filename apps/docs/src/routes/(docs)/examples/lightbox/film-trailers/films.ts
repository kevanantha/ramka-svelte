/**
 * Blender Open Movies — real trailers/shorts with their official posters
 * (local copies of the Wikimedia Commons art, CC-BY Blender Foundation) so the
 * trigger thumbnail matches the video poster 1:1. Trailers are preferred where
 * available so the demo stays snappy to load.
 *
 * Media is sized to the *video* aspect (landscape), not the poster — so the
 * playing frame fills the fit-box without letterboxing. The open morph still
 * starts from the portrait poster (`crossfade="close"` hard-cuts into video).
 */
export interface Film {
	id: string;
	title: string;
	year: number;
	genre: string;
	poster: string;
	posterWidth: number;
	posterHeight: number;
	video: string;
	videoWidth: number;
	videoHeight: number;
}

export const films: Film[] = [
	{
		id: 'bbb',
		title: 'Big Buck Bunny',
		year: 2008,
		genre: 'Animation',
		poster: '/photos/bbb-poster.jpg',
		posterWidth: 500,
		posterHeight: 707,
		video: 'https://download.blender.org/peach/trailer/trailer_iphone.m4v',
		videoWidth: 480,
		videoHeight: 270
	},
	{
		id: 'ed',
		title: "Elephant's Dream",
		year: 2006,
		genre: 'Sci-Fi',
		poster: '/photos/ed-poster.jpg',
		posterWidth: 500,
		posterHeight: 707,
		video: 'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4',
		videoWidth: 426,
		videoHeight: 240
	},
	{
		id: 'sintel',
		title: 'Sintel',
		year: 2010,
		genre: 'Fantasy',
		poster: '/photos/sintel-poster.jpg',
		posterWidth: 500,
		posterHeight: 707,
		video: 'https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4',
		videoWidth: 1280,
		videoHeight: 720
	},
	{
		id: 'tos',
		title: 'Tears of Steel',
		year: 2012,
		genre: 'Sci-Fi',
		poster: '/photos/tos-poster.png',
		posterWidth: 500,
		posterHeight: 741,
		video: 'https://archive.org/download/Tears-of-Steel/tears_of_steel_720p.mp4',
		// Scope encode from the file (~2.39:1), not 16:9.
		videoWidth: 862,
		videoHeight: 360
	}
];
