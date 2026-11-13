import { DEV } from 'esm-env';
import type { Attachment } from 'svelte/attachments';

interface AccessibleNameWarningOptions {
	/**
	 * Whether text rendered inside the element names it. True for a button,
	 * where the label is its content. False for a container role such as
	 * `group`, where descendant text is the slide's content and names nothing.
	 * @default true
	 */
	namedByContent?: boolean;
	/** Appended to the warning, to say what a good name looks like for the part. */
	hint?: string;
}

const NOOP: Attachment<HTMLElement> = () => {};

/**
 * Warn in development when a part renders with no accessible name.
 *
 * The library ships no `aria-label` defaults (an English string baked into a
 * primitive is wrong for most of the world), but a nameless icon button is
 * still a WCAG 4.1.2 failure, so this nudges the way `Lightbox.Content` does
 * for the dialog. `aria-label`, `aria-labelledby` and `title` always count;
 * visible text counts only where content names the element.
 *
 * The check is deferred a macrotask (a sibling mounting in the same flush can
 * still name the part — a ThumbnailGroup turns Item into a `tabpanel` named by
 * its tab) and re-runs when the naming attributes or `aria-hidden` change, so
 * an Item is checked when it becomes the visible slide. Warns once per element.
 */
export function accessibleNameWarning(
	partName: string,
	options?: AccessibleNameWarningOptions
): Attachment<HTMLElement> {
	if (!DEV) return NOOP;
	const { namedByContent = true, hint } = options ?? {};
	return (el) => {
		let warned = false;
		let timer = 0;
		const check = () => {
			if (warned || el.getAttribute('aria-hidden') === 'true') return;
			const named =
				!!el.getAttribute('aria-label')?.trim() ||
				!!el.getAttribute('aria-labelledby')?.trim() ||
				!!el.getAttribute('title')?.trim() ||
				(namedByContent && !!el.textContent?.trim());
			if (named) return;
			warned = true;
			console.warn(
				`[ramka] ${partName} has no accessible name. ` +
					(hint ?? 'Give it visible text, or pass `aria-label` / `aria-labelledby`.') +
					' The library ships no default label so it never hard-codes English into your UI.'
			);
		};
		const schedule = () => {
			clearTimeout(timer);
			timer = window.setTimeout(check, 0);
		};
		schedule();
		const observer = new MutationObserver(schedule);
		observer.observe(el, {
			attributes: true,
			attributeFilter: ['aria-label', 'aria-labelledby', 'title', 'aria-hidden', 'role'],
			childList: namedByContent,
			characterData: namedByContent,
			subtree: namedByContent
		});
		return () => {
			clearTimeout(timer);
			observer.disconnect();
		};
	};
}
