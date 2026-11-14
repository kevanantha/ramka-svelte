/** Unsplash — 1200×800, as `?enhanced` pictures with their blur LQIPs. */
import photoA from '#lib/assets/photos/nextjs-image-do.jpg?enhanced';
import lqipA from '#lib/assets/photos/nextjs-image-do.jpg?w=8&format=webp&inline';
import photoB from '#lib/assets/photos/nextjs-image-dont.jpg?enhanced';
import lqipB from '#lib/assets/photos/nextjs-image-dont.jpg?w=8&format=webp&inline';
import photoC from '#lib/assets/photos/nextjs-image-c.jpg?enhanced';
import lqipC from '#lib/assets/photos/nextjs-image-c.jpg?w=8&format=webp&inline';
import photoD from '#lib/assets/photos/nextjs-image-d.jpg?enhanced';
import lqipD from '#lib/assets/photos/nextjs-image-d.jpg?w=8&format=webp&inline';
import type { Picture } from '@sveltejs/enhanced-img';

export interface DemoPhoto {
	photo: Picture;
	lqip: string;
}

export const a: DemoPhoto = { photo: photoA, lqip: lqipA };
export const b: DemoPhoto = { photo: photoB, lqip: lqipB };
export const c: DemoPhoto = { photo: photoC, lqip: lqipC };
export const d: DemoPhoto = { photo: photoD, lqip: lqipD };

/** LightboxGallery item for a demo photo (the full-size file is the thumb too). */
export function galleryItem({ photo }: DemoPhoto, alt: string, caption = '') {
	return {
		src: photo.img.src,
		thumb: photo.img.src,
		width: photo.img.w,
		height: photo.img.h,
		alt,
		caption
	};
}
