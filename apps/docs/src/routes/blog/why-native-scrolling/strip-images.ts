import { ramkaA, ramkaB, ramkaC, ramkaD, ramkaE, ramkaF, ramkaG } from '#lib/photos.js';

/** The seven photos both strips show (trigger-size thumbnails: they render 224px wide). */
export const STRIP_IMAGES = [ramkaA, ramkaB, ramkaC, ramkaD, ramkaE, ramkaF, ramkaG].map(
	({ thumb, alt }) => ({ src: thumb, alt })
);
