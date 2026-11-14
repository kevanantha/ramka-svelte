import { describe, expect, it } from 'vitest';

import StateAttrsLightbox from './fixtures/misc/StateAttrsLightbox.svelte';
import { fireEvent, render, screen } from './test-utils';

/**
 * Base UI serializes unmapped state keys as `data-${key.toLowerCase()}`.
 * CamelCase keys must be explicitly mapped (hyphenated) or suppressed —
 * otherwise we ship attrs like `data-morphtarget` / `data-maxzoom`.
 */
const FORBIDDEN_SQUASHED_ATTRS = [
	'data-morphtarget',
	'data-activeindex',
	'data-hascaption',
	'data-focuswithin',
	'data-maxzoom',
	'data-offsetx',
	'data-offsety',
	'data-canzoomin',
	'data-canzoomout',
	'data-skipfade',
	'data-pulldismissing',
	'data-pullsnapping'
] as const;

function collectForbiddenAttrs(root: ParentNode = document): string[] {
	const found = new Set<string>();
	for (const attr of FORBIDDEN_SQUASHED_ATTRS) {
		if (root.querySelector(`[${attr}]`)) found.add(attr);
	}
	return [...found].sort();
}

describe('Lightbox state → data-* attributes', () => {
	it('does not emit Base UI camelCase-squashed data attributes', () => {
		// Svelte: the render prop's `imageRef` / `morphRef` are the `image` /
		// `morph` attachments of Trigger's `children` snippet.
		render(StateAttrsLightbox);

		// morphRef child gets the documented attr; Trigger must not get the squashed one.
		expect(screen.getByTestId('morph-el')).toHaveAttribute('data-morph-target');
		expect(screen.getByTestId('trigger-0')).not.toHaveAttribute('data-morph-target');
		expect(screen.getByTestId('trigger-0')).not.toHaveAttribute('data-morphtarget');
		expect(collectForbiddenAttrs()).toEqual([]);

		fireEvent.click(screen.getByTestId('zoom-in'));
		expect(collectForbiddenAttrs()).toEqual([]);
	});
});
