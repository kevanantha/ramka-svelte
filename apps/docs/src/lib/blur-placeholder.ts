import type { Attachment } from 'svelte/attachments';

/**
 * Blur-up placeholder, as next/image renders `placeholder="blur"` in the
 * original docs: the 8px LQIP blurred through an SVG filter, painted as the
 * `<img>`'s own background until the pixels load. Being a plain inline style,
 * it is in the prerendered HTML, so it can paint before hydration.
 *
 * Pair the style with {@link clearBlurPlaceholder}, which drops it once the
 * image has loaded (like next/image) so it never shows through transparency.
 */
export function blurPlaceholderStyle(photo: {
	width: number;
	height: number;
	blurDataURL: string;
}): string {
	// next-image-loader's blur size: 8px on the long edge, the SVG at 40×.
	const BLUR_SIZE = 8;
	const landscape = photo.width >= photo.height;
	const blurWidth = landscape
		? BLUR_SIZE
		: Math.max(Math.round((photo.width / photo.height) * BLUR_SIZE), 1);
	const blurHeight = landscape
		? Math.max(Math.round((photo.height / photo.width) * BLUR_SIZE), 1)
		: BLUR_SIZE;
	const svg =
		`%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${blurWidth * 40} ${blurHeight * 40}'%3E` +
		`%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E` +
		`%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E` +
		`%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E` +
		`%3CfeComposite in2='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E` +
		`%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='none' style='filter: url(%23b);' href='${photo.blurDataURL}'/%3E%3C/svg%3E`;
	return (
		'color:transparent;background-size:cover;background-position:50% 50%;' +
		`background-repeat:no-repeat;background-image:url("data:image/svg+xml;charset=utf-8,${svg}")`
	);
}

/** Removes the {@link blurPlaceholderStyle} background once the image has loaded. */
export const clearBlurPlaceholder: Attachment<HTMLImageElement> = (img) => {
	const clear = () => {
		for (const property of [
			'background-size',
			'background-position',
			'background-repeat',
			'background-image'
		]) {
			img.style.removeProperty(property);
		}
	};
	if (img.complete && img.naturalWidth > 0) {
		clear();
		return;
	}
	img.addEventListener('load', clear, { once: true });
	return () => img.removeEventListener('load', clear);
};
