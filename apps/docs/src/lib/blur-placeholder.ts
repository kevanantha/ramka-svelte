import type { Attachment } from 'svelte/attachments';

/**
 * next/image's `placeholder="blur"`: an inline style that paints a tiny LQIP
 * behind the image, blurred the way Next.js does it (the same SVG filter as
 * next/image's getImageBlurSvg), until the image covers it. Being a plain
 * inline style, it is in the prerendered HTML, so it can paint before
 * hydration.
 *
 *   import lqip from './photo.jpg?w=8&format=webp&inline';
 *   <enhanced:img src={photo} style={blurPlaceholder(lqip, photo.img)} … />
 *
 * `size` is the full image's intrinsic size; the LQIP is 8px on its long edge.
 */
export function blurPlaceholder(lqip: string, size: { w: number; h: number }): string {
	const long = Math.max(size.w, size.h);
	// Next.js scales the 8px LQIP's box ×40 for the SVG viewBox.
	const vw = Math.max(Math.round((8 * size.w) / long), 1) * 40;
	const vh = Math.max(Math.round((8 * size.h) / long), 1) * 40;
	const svg =
		`%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${vw} ${vh}'%3E` +
		`%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E` +
		`%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E` +
		`%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E` +
		`%3CfeComposite in2='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E` +
		`%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='none' ` +
		`style='filter: url(%23b);' href='${lqip}'/%3E%3C/svg%3E`;
	return (
		'background-size: cover; background-position: 50% 50%; background-repeat: no-repeat; ' +
		`background-image: url("data:image/svg+xml;charset=utf-8,${svg}")`
	);
}

/**
 * {@link blurPlaceholder} for a photo that carries its own `blurDataURL`, with
 * next/image's `color: transparent` (hides the alt text while loading). Pair
 * it with {@link clearBlurPlaceholder}, which drops the background once the
 * image has loaded (like next/image) so it never shows through transparency.
 */
export function blurPlaceholderStyle(photo: {
	width: number;
	height: number;
	blurDataURL: string;
}): string {
	return (
		'color: transparent; ' + blurPlaceholder(photo.blurDataURL, { w: photo.width, h: photo.height })
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
