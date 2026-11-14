import type { Component } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as Lightbox from '../../lib/lightbox';
import NameChrome from './fixtures/misc/NameChrome.svelte';
import NameGallery from './fixtures/misc/NameGallery.svelte';
import { act, render, screen } from './test-utils';

/**
 * The control parts ship no `aria-label`, so a consumer's own copy is the only
 * name a screen reader ever reads. These pin both halves of that deal: nothing
 * English leaks into the DOM, and a nameless control is called out in dev.
 */

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
});

// The name check is deferred a macrotask so sibling mount effects (e.g. a
// tablist registering) can settle first — flush it before asserting either way.
async function settleNameCheck() {
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 0));
	});
}

type AnyComponent = Component<Record<string, unknown>>;

const parts = [
	{ name: 'Lightbox.Close', Part: Lightbox.Close as AnyComponent },
	{ name: 'Lightbox.Previous', Part: Lightbox.Previous as AnyComponent },
	{ name: 'Lightbox.Next', Part: Lightbox.Next as AnyComponent },
	{ name: 'Lightbox.ZoomIn', Part: Lightbox.ZoomIn as AnyComponent },
	{ name: 'Lightbox.ZoomOut', Part: Lightbox.ZoomOut as AnyComponent }
] as const;

describe('control parts ship no label', () => {
	it.each(parts)('$name renders without an aria-label', ({ Part }) => {
		render(NameChrome, { part: Part, partProps: { 'data-testid': 'part' } });

		expect(screen.getByTestId('part')).not.toHaveAttribute('aria-label');
	});

	it.each(parts)('$name keeps the consumer’s own label', async ({ Part }) => {
		render(NameChrome, {
			part: Part,
			partProps: { 'data-testid': 'part', 'aria-label': 'Zamknij' }
		});
		await settleNameCheck();

		expect(screen.getByTestId('part')).toHaveAttribute('aria-label', 'Zamknij');
		expect(warn).not.toHaveBeenCalled();
	});
});

describe('development nudge for a nameless control', () => {
	it.each(parts)('$name warns when it has no name at all', async ({ name, Part }) => {
		render(NameChrome, { part: Part });
		await settleNameCheck();

		expect(warn).toHaveBeenCalledWith(expect.stringContaining(`${name} has no accessible name`));
	});

	it('stays quiet when the control has visible text instead of a label', async () => {
		render(NameChrome, { part: Lightbox.Close as AnyComponent, text: 'Zamknij' });
		await settleNameCheck();

		expect(warn).not.toHaveBeenCalled();
	});

	it('stays quiet when the control is labelled by another element', async () => {
		render(NameChrome, {
			part: Lightbox.Close as AnyComponent,
			label: { id: 'close-label', text: 'Zamknij' },
			partProps: { 'aria-labelledby': 'close-label' }
		});
		await settleNameCheck();

		expect(warn).not.toHaveBeenCalled();
	});

	it('forwards the ref while watching for a missing name', () => {
		// Svelte: React's forwarded `ref` is `bind:ref` (the fixture copies it out).
		const ref: { current: HTMLElement | null } = { current: null };

		render(NameChrome, {
			part: Lightbox.Close as AnyComponent,
			partProps: { 'aria-label': 'Zamknij' },
			refBox: ref
		});

		expect(ref.current).toBeInstanceOf(HTMLButtonElement);
	});
});

/**
 * A slide is a `group`, and a `group` is not named by the text inside it — so
 * the check that suffices for a button would let a captioned slide pass while
 * a screen reader still announces it as nameless.
 */
describe('development nudge for a nameless slide', () => {
	it('warns when the slide has no name at all', async () => {
		render(NameGallery, { items: [{}] });
		await settleNameCheck();

		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining('Lightbox.Item has no accessible name')
		);
	});

	it('still warns when the slide only has content, which does not name a group', async () => {
		render(NameGallery, { items: [{ text: 'Zachód słońca nad morzem' }] });
		await settleNameCheck();

		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining('Lightbox.Item has no accessible name')
		);
	});

	it('stays quiet once the consumer names the slide', async () => {
		render(NameGallery, {
			items: [{ 'aria-roledescription': 'slajd', 'aria-label': '1 z 1' }]
		});
		await settleNameCheck();

		expect(warn).not.toHaveBeenCalled();
	});

	// Inactive slides are `aria-hidden`, so a long gallery nudges once for the
	// slide on screen rather than once per slide.
	it('nudges only for the slide that is not aria-hidden', async () => {
		render(NameGallery, { items: [{ 'aria-label': '1 z 3' }, {}, {}] });
		await settleNameCheck();

		expect(warn).not.toHaveBeenCalled();
	});

	// With a ThumbnailGroup mounted the item is a `tabpanel` named by its tab
	// via the auto-wired `aria-labelledby`, so no consumer label is needed.
	// The tablist registers in an effect that runs after the items' name check,
	// so this also pins that the deferred check tolerates the one-commit gap
	// instead of warning off the pre-registration DOM.
	it('stays quiet for an unnamed item when a thumbnail tablist names it', async () => {
		render(NameGallery, { items: [{ 'data-testid': 'item-0' }, {}], thumbs: 2 });
		await settleNameCheck();

		expect(screen.getByTestId('item-0')).toHaveAttribute('role', 'tabpanel');
		expect(warn).not.toHaveBeenCalledWith(
			expect.stringContaining('Lightbox.Item has no accessible name')
		);
	});
});
