/**
 * Class recipes for the bits-ui overlays the debug pages render inside an
 * open lightbox: the original docs' shadcn button, dropdown menu,
 * dialog, tooltip, radio group and label. Its neutral theme tokens map 1:1
 * onto Tailwind's palette (popover = white / neutral-900, muted = neutral-100
 * / neutral-800, secondary = zinc-100, primary = blue-700 / blue-800, ring =
 * neutral-400 / neutral-500), so the recipes use those colors directly.
 * Enter/exit animations are the original's tw-animate-css ones, keyed on
 * bits-ui's `data-state` instead of the original's `data-open` / `data-closed`;
 * menus keep the original's `animate-none!` by leaving them out.
 */

const buttonBase =
	'inline-flex shrink-0 items-center justify-center rounded-[0.625rem] border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-neutral-400 focus-visible:ring-3 focus-visible:ring-neutral-400/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:border-neutral-500 dark:focus-visible:ring-neutral-500/50 [&_svg]:pointer-events-none [&_svg]:shrink-0';

const buttonVariants = {
	default: 'bg-blue-700 text-blue-50 dark:bg-blue-800',
	outline:
		'border-neutral-200 bg-white hover:bg-neutral-100 hover:text-neutral-950 aria-expanded:bg-neutral-100 dark:border-white/15 dark:bg-white/[0.045] dark:hover:bg-white/[0.075]',
	secondary:
		'bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-neutral-50 dark:hover:bg-zinc-800/80',
	ghost:
		'hover:bg-neutral-100 hover:text-neutral-950 aria-expanded:bg-neutral-100 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-50'
};

const buttonSizes = {
	default:
		'h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*=size-])]:size-4',
	sm: "h-7 gap-1 rounded-[0.5rem] px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
	'icon-sm': "size-7 rounded-[0.5rem] [&_svg:not([class*='size-'])]:size-4"
};

export function buttonClass(
	variant: keyof typeof buttonVariants = 'default',
	size: keyof typeof buttonSizes = 'default'
) {
	return `${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]}`;
}

/** The glass `secondary sm` button the in-viewer panels use. */
export const panelButtonClass = `${buttonClass('secondary', 'sm')} border-white/15 bg-white/15 text-white hover:bg-white/25 dark:bg-white/15 dark:text-white dark:hover:bg-white/25`;

const menuSurface =
	'relative rounded-[0.625rem] p-1 text-neutral-950 ring-1 ring-neutral-950/10 outline-none bg-white/70 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150 dark:bg-neutral-900/70 dark:text-neutral-50 dark:ring-neutral-50/10';

export const menuContentClass = `${menuSurface} z-50 max-h-(--bits-dropdown-menu-content-available-height) min-w-32 overflow-x-hidden overflow-y-auto shadow-md`;
export const menuSubContentClass = `${menuSurface} z-50 w-auto min-w-[96px] shadow-lg`;

const menuRow =
	'relative flex cursor-default items-center gap-1.5 rounded-[0.5rem] text-sm outline-hidden select-none data-highlighted:bg-neutral-950/10 data-disabled:pointer-events-none data-disabled:opacity-50 dark:data-highlighted:bg-neutral-50/10 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4';

export const menuItemClass = `${menuRow} px-1.5 py-1`;
export const menuCheckboxItemClass = `${menuRow} py-1 pr-8 pl-1.5`;
export const menuSubTriggerClass = `${menuRow} py-1 pr-1.5 pl-7 data-[state=open]:bg-neutral-950/10 dark:data-[state=open]:bg-neutral-50/10`;
export const menuLabelClass =
	'px-1.5 py-1 text-xs font-medium text-neutral-500 dark:text-neutral-400';
export const menuSeparatorClass = '-mx-1 my-1 h-px bg-neutral-950/5 dark:bg-neutral-50/5';

const dialogAnimation =
	'duration-100 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0';

export const dialogOverlayClass = `fixed inset-0 isolate z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs ${dialogAnimation}`;
export const dialogContentClass = `fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-[0.875rem] bg-white p-4 text-sm text-neutral-950 ring-1 ring-neutral-950/10 outline-none dark:bg-neutral-900 dark:text-neutral-50 dark:ring-neutral-50/10 ${dialogAnimation} data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95`;
export const dialogTitleClass = 'text-base leading-none font-medium';
export const dialogDescriptionClass = 'text-sm text-neutral-500 dark:text-neutral-400';
export const dialogFooterClass =
	'-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-[0.875rem] border-t border-neutral-200 bg-neutral-100/50 p-4 sm:flex-row sm:justify-end dark:border-white/10 dark:bg-neutral-800/50';

export const tooltipContentClass =
	'z-50 inline-flex w-fit max-w-xs origin-(--bits-tooltip-content-transform-origin) items-center gap-1.5 rounded-[0.5rem] bg-neutral-950 px-3 py-1.5 text-xs text-white dark:bg-neutral-50 dark:text-black data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-[state=instant-open]:animate-in data-[state=instant-open]:fade-in-0 data-[state=instant-open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95';

export const radioItemClass =
	'peer relative flex aspect-square size-4 shrink-0 rounded-full border border-neutral-200 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-neutral-400 focus-visible:ring-3 focus-visible:ring-neutral-400/50 data-[state=checked]:border-blue-700 data-[state=checked]:bg-blue-700 dark:border-white/15 dark:bg-white/[0.045] dark:data-[state=checked]:bg-blue-800';
export const labelClass = 'flex items-center gap-2 text-sm leading-none select-none';
