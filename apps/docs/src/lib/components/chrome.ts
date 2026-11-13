/**
 * Consumer-side Tailwind chrome for the docs viewer — the library ships zero
 * CSS. Copied from the original docs' lightbox-chrome.tsx (iOS liquid-glass
 * controls) so the port keeps the same look.
 */
export const chromeButton =
	'pointer-events-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ' +
	'border border-black/20 bg-white/55 text-neutral-900 ' +
	'shadow-[0_0.5px_1px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08),inset_0_0.5px_0_rgba(255,255,255,0.65)] ' +
	'backdrop-blur-2xl backdrop-saturate-150 ' +
	'transition-[background-color,box-shadow,transform,opacity,color] duration-150 ease-out ' +
	'hover:[background-image:linear-gradient(rgba(0,0,0,0.05),rgba(0,0,0,0.05))] ' +
	'active:scale-[0.96] active:[background-image:linear-gradient(rgba(0,0,0,0.09),rgba(0,0,0,0.09))] ' +
	'focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25 ' +
	'disabled:pointer-events-none disabled:opacity-30 ' +
	'dark:border-white/25 dark:bg-neutral-900/45 dark:text-white ' +
	'dark:shadow-[0_0_0_0.5px_#000,0_0.5px_1px_rgba(0,0,0,0.45),0_1px_2px_rgba(0,0,0,0.35),inset_0_0.5px_0_rgba(255,255,255,0.14)] ' +
	'dark:hover:[background-image:linear-gradient(rgba(255,255,255,0.08),rgba(255,255,255,0.08))] ' +
	'dark:active:[background-image:linear-gradient(rgba(255,255,255,0.12),rgba(255,255,255,0.12))] ' +
	'dark:focus-visible:ring-white/40';

/** `chromeButton` shown from `md` up only (desktop-only controls). */
export const chromeButtonMd = `hidden md:inline-flex ${chromeButton.replace('inline-flex ', '')}`;

/** Keyboard focus ring for triggers (follows each trigger's own radius). */
export const triggerFocusClass =
	'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500';

/**
 * Joined capsule: one glass pill holding several segments (zoom −/+), shown
 * from `md` up.
 */
export const chromeButtonGroup =
	'pointer-events-auto hidden h-9 items-stretch overflow-hidden rounded-full md:inline-flex ' +
	'border border-black/20 bg-white/55 ' +
	'shadow-[0_0.5px_1px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08),inset_0_0.5px_0_rgba(255,255,255,0.65)] ' +
	'backdrop-blur-2xl backdrop-saturate-150 ' +
	'dark:border-white/25 dark:bg-neutral-900/45 ' +
	'dark:shadow-[0_0_0_0.5px_#000,0_0.5px_1px_rgba(0,0,0,0.45),0_1px_2px_rgba(0,0,0,0.35),inset_0_0.5px_0_rgba(255,255,255,0.14)]';

/** Segment inside `chromeButtonGroup`: the pill owns the glass; inset focus ring. */
export const chromeButtonSegment =
	'relative inline-flex w-9 shrink-0 items-center justify-center text-neutral-900 ' +
	'transition-[background-color,box-shadow,opacity,color] duration-150 ease-out ' +
	'hover:[background-image:linear-gradient(rgba(0,0,0,0.05),rgba(0,0,0,0.05))] ' +
	'active:[background-image:linear-gradient(rgba(0,0,0,0.09),rgba(0,0,0,0.09))] ' +
	'focus:outline-none focus-visible:shadow-[inset_0_0_0_2px_rgba(0,0,0,0.25)] ' +
	'disabled:pointer-events-none disabled:opacity-30 ' +
	'dark:text-white ' +
	'dark:hover:[background-image:linear-gradient(rgba(255,255,255,0.08),rgba(255,255,255,0.08))] ' +
	'dark:active:[background-image:linear-gradient(rgba(255,255,255,0.12),rgba(255,255,255,0.12))] ' +
	'dark:focus-visible:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.4)]';

/** Hairline divider on the leading edge of a follow-up capsule segment. */
export const chromeSegmentDivider =
	"before:absolute before:inset-y-[22%] before:start-0 before:w-px before:bg-black/15 before:content-[''] dark:before:bg-white/20";
