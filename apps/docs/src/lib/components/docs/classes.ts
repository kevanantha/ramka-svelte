/** Shared inline-link look for docs body + section titles. */
export const docsLinkClass =
	'font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2 transition-colors hover:text-blue-700 hover:decoration-blue-700/50 dark:text-blue-400 dark:decoration-blue-400/40 dark:hover:text-blue-300 dark:hover:decoration-blue-300/60';

/** Plain external link inside docs prose. */
export const extLinkClass =
	'underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-500 dark:decoration-neutral-700 dark:hover:decoration-neutral-500';

/** `<strong>` inside docs prose. */
export const strongClass = 'font-medium text-neutral-800 dark:text-neutral-200';

/** Outline header button (32px), shared by the site header and mobile nav. */
export const headerButtonClass =
	'inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800';

/** Ghost round button (28px) in the sidebar panel. */
export const ghostButtonClass =
	'inline-flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 transition hover:bg-black/[0.05] hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.08] dark:hover:text-neutral-100';

/** Docs tables (the hand-written ones in guide pages). */
export const table = {
	wrap: 'overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800',
	head: 'bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400',
	th: 'px-3 py-2 font-medium whitespace-nowrap',
	td: 'px-3 py-2 align-top',
	tdLabel: 'px-3 py-2 align-top text-neutral-700 dark:text-neutral-300'
};
