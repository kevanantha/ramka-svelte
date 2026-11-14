/**
 * ramka's `react-compat`, `render/use-merged-refs`, `render/use-render` and
 * `render/merge-props` are React plumbing with no Svelte module to test. Each
 * case below maps an original case onto the Svelte mechanism that replaced it,
 * driven through real parts:
 *
 * - `useMergedRefs` → `bind:ref` plus attachments (`{@attach}`, which a part's
 *   `{...rest}` forwards to its element);
 * - `mergeProps` → each part wrapping the consumer's handler and placing
 *   `{...rest}` so the consumer's attributes win;
 * - `useRender` → the part's own element, state written as data attributes,
 *   and a `children` snippet that receives the render state.
 *
 * Titles are the originals'. Cases with nothing to map onto are listed in the
 * comments of each block.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAttachmentKey } from 'svelte/attachments';

import Parts from './fixtures/render/Parts.svelte';
import { installSlidesLayoutMocks, resetSlidesLayoutMocks } from './slides-test-utils';
import { fireEvent, flushMicrotasks, render, screen } from './test-utils';

if (!Element.prototype.getAnimations) Element.prototype.getAnimations = () => [];

beforeEach(() => {
	installSlidesLayoutMocks({ raf: false });
	vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([]);
});

afterEach(() => {
	resetSlidesLayoutMocks();
	vi.restoreAllMocks();
});

const attach = (fn: (node: Element) => void | (() => void)) => ({ [createAttachmentKey()]: fn });

// react-compat: `getElementRef` (where React 18/19 keep an element's ref) has
// no counterpart and is dropped, as is `reuses one object so spreading it does
// not churn props`. `inertWhen` became `inert={condition || undefined}` on
// Item, Content and Backdrop; its two behaviour cases map onto those parts.
describe('inertWhen', () => {
	it('spreads nothing when the condition is false', () => {
		render(Parts, { root: { open: true, value: 0 } });
		expect(screen.getByTestId('item-0')).not.toHaveAttribute('inert');
		expect(screen.getByTestId('content')).not.toHaveAttribute('inert');
		expect(screen.getByTestId('backdrop')).not.toHaveAttribute('inert');
	});

	it('renders an inert attribute on both React majors when true', () => {
		render(Parts, { root: { open: true, value: 0 } });
		expect(screen.getByTestId('item-1')).toHaveAttribute('inert');
	});
});

// Dropped, React-only: `returns no callback at all when every ref is absent`
// (a hook return value) and `prefers a returned cleanup over calling the ref
// with null` (React 19 ref-callback cleanups; an attachment only has the
// cleanup form, covered by the unmount case).
describe('useMergedRefs', () => {
	it('sends the node to all three refs', () => {
		const refs: Array<HTMLButtonElement | null> = [];
		const attached: Element[] = [];
		render(Parts, {
			root: { open: false },
			onTriggerRef: (node) => refs.push(node),
			trigger: attach((node) => void attached.push(node))
		});
		const el = screen.getByTestId('trigger');
		// The consumer's `bind:ref` and `{@attach}` both reach the button...
		expect(refs.at(-1)).toBe(el);
		expect(attached).toEqual([el]);
		// ...and so does the part's own reference: opening records this element
		// as the opener, which is what `aria-expanded` reports.
		fireEvent.click(el);
		expect(el).toHaveAttribute('aria-expanded', 'true');
	});

	it('attaches a ref that appears on a later render', async () => {
		const late = vi.fn();
		const view = render(Parts, { root: { open: false } });
		expect(late).not.toHaveBeenCalled();
		await view.rerender({ trigger: attach(late) });
		expect(late).toHaveBeenCalledWith(screen.getByTestId('trigger'));
	});

	it('clears a ref that is swapped out, and fills the one that replaces it', async () => {
		const droppedCleanup = vi.fn();
		const dropped = vi.fn(() => droppedCleanup);
		const added = vi.fn();
		const view = render(Parts, { root: { open: false }, trigger: attach(dropped) });
		const el = screen.getByTestId('trigger');
		expect(dropped).toHaveBeenCalledWith(el);

		await view.rerender({ trigger: attach(added) });

		expect(droppedCleanup).toHaveBeenCalledTimes(1);
		expect(added).toHaveBeenCalledWith(el);
	});

	it('keeps one identity while the refs hold still, so the node is never detached', async () => {
		const cleanup = vi.fn();
		const stable = vi.fn(() => cleanup);
		const props = attach(stable);
		const view = render(Parts, { root: { open: false }, trigger: { ...props, id: 'one' } });
		await view.rerender({ trigger: { ...props, id: 'two' } });
		expect(screen.getByTestId('trigger')).toHaveAttribute('id', 'two');
		expect(stable).toHaveBeenCalledTimes(1);
		expect(cleanup).not.toHaveBeenCalled();
	});

	it('clears object refs and calls function refs with null on unmount', async () => {
		const refs: Array<HTMLButtonElement | null> = [];
		const cleanup = vi.fn();
		const view = render(Parts, {
			root: { open: false },
			onTriggerRef: (node) => refs.push(node),
			trigger: attach(() => cleanup)
		});
		expect(refs.at(-1)).not.toBeNull();
		// Unmount the part alone, so the parent that holds `bind:ref` survives
		// to see it cleared.
		await view.rerender({ showTrigger: false });
		await flushMicrotasks();
		expect(cleanup).toHaveBeenCalledTimes(1);
		// `bind:ref` is reset when the part goes away, like React's ref = null.
		expect(refs.at(-1) ?? null).toBeNull();
	});
});

// Dropped, pure-function internals of `mergeProps` with no Svelte counterpart:
// skipping absent prop sets, `undefined` handler keys, non-`on[A-Z]` callbacks,
// argument/return forwarding, three- and four-way merges, `ref` passthrough,
// no mutation. Svelte has one consumer prop set per part, so what remains is
// how a part combines it with its own.
describe('mergeProps', () => {
	it('lets the rightmost object win an ordinary conflict', () => {
		render(Parts, { root: { open: true }, close: { type: 'submit', title: 'mine' } });
		const close = screen.getByTestId('close');
		expect(close).toHaveAttribute('type', 'submit');
		expect(close).toHaveAttribute('title', 'mine');
	});

	it('chains event handlers, rightmost first', async () => {
		const order: string[] = [];
		render(Parts, {
			root: { open: true, onOpenChange: () => order.push('part') },
			close: { onclick: () => order.push('consumer') }
		});
		fireEvent.click(screen.getByTestId('close'));
		await flushMicrotasks();
		expect(order).toEqual(['consumer', 'part']);
		expect(screen.queryByTestId('content')).toBeNull();
	});

	// Svelte-only regression (no title in ramka's suite): Base UI lets a handler
	// cancel the ones merged before it; ramka's mergeProps left that out, so a
	// consumer's `preventDefault()` never cancels a part's action.
	it("a consumer handler's preventDefault does not cancel the part's action", async () => {
		const prevent = { onclick: (event: Event) => event.preventDefault() };
		const onValueChange = vi.fn();
		const onOpenChange = vi.fn();
		render(Parts, {
			root: { open: false, value: 1, onValueChange, onOpenChange },
			trigger: prevent,
			next: prevent,
			previous: prevent,
			thumbnail: prevent,
			close: prevent,
			backdrop: prevent
		});
		fireEvent.click(screen.getByTestId('trigger'));
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
		// The trigger opened at its own index, 0.
		fireEvent.click(screen.getByTestId('next'));
		expect(onValueChange).toHaveBeenLastCalledWith(1, { source: 'button' });
		fireEvent.click(screen.getByTestId('prev'));
		expect(onValueChange).toHaveBeenLastCalledWith(0, { source: 'button' });
		fireEvent.click(screen.getByTestId('thumb-2'));
		expect(onValueChange).toHaveBeenLastCalledWith(2, { source: 'thumbnail' });
		fireEvent.click(screen.getByTestId('close'));
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		await flushMicrotasks();

		fireEvent.click(screen.getByTestId('trigger'));
		fireEvent.click(screen.getByTestId('backdrop'));
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	it('concatenates className with the rightmost class first', () => {
		render(Parts, { root: { open: true }, content: { class: 'mine' } });
		expect(screen.getByTestId('content')).toHaveClass('mine');
	});

	it('merges style objects, rightmost declaration winning', () => {
		render(Parts, { root: { open: true }, content: { style: 'overflow: auto; color: red' } });
		const content = screen.getByTestId('content');
		// The part's own declarations survive...
		expect(content.style.overscrollBehavior).toBe('contain');
		// ...and the consumer's win a conflict.
		expect(content.style.overflow).toBe('auto');
		expect(content.style.color).toBe('red');
	});
});

// Dropped, React-only: `falls back to a div when no default tag is named`,
// every `render prop as an element` case (cloning, ref survival, the dev error,
// lazy element types), the component-looking-callback warnings, the shared
// empty-state guard and `refs` (React ref plumbing, see useMergedRefs above).
// Svelte parts always render their own element; `lets a render element
// override the default tag` has no counterpart. The original file's describes
// are kept: the parts' own elements stand in for `useRender`'s output.
describe('default element', () => {
	it('renders the default tag with the given props', () => {
		render(Parts, { root: { open: true }, close: { class: 'mine' } });
		const close = screen.getByTestId('close');
		expect(close.tagName).toBe('BUTTON');
		expect(close).toHaveClass('mine');
	});

	it('gives a button a type so it never submits a surrounding form', () => {
		render(Parts, { root: { open: true } });
		for (const id of ['trigger', 'close', 'prev', 'next', 'thumb-0']) {
			expect(screen.getByTestId(id)).toHaveAttribute('type', 'button');
		}
	});
});

describe('state as data attributes', () => {
	it('renders true as an empty attribute and other values stringified', () => {
		render(Parts, { root: { open: true, value: 2 } });
		const thumb = screen.getByTestId('thumb-2');
		expect(thumb).toHaveAttribute('data-active', '');
		expect(thumb).toHaveAttribute('data-index', '2');
	});

	it('omits falsy state so a presence selector means what it says', () => {
		render(Parts, { root: { open: true, value: 1 } });
		expect(screen.getByTestId('thumb-0')).not.toHaveAttribute('data-active');
		expect(screen.getByTestId('prev')).not.toHaveAttribute('data-disabled');
		expect(screen.getByTestId('next')).not.toHaveAttribute('data-disabled');
	});

	it('lets props win over a state attribute of the same name', () => {
		render(Parts, {
			root: { open: true, value: 0 },
			thumbnail: { 'data-active': 'overridden' },
			previous: { 'data-disabled': 'overridden' }
		});
		expect(screen.getByTestId('thumb-0')).toHaveAttribute('data-active', 'overridden');
		expect(screen.getByTestId('prev')).toHaveAttribute('data-disabled', 'overridden');
	});

	// Svelte-only regression (no title in ramka's suite): ramka puts a part's
	// own props under the consumer's, so a consumer's `disabled` wins.
	it("honours a consumer's disabled on Next", () => {
		const onValueChange = vi.fn();
		render(Parts, { root: { open: true, value: 0, onValueChange }, next: { disabled: true } });
		const next = screen.getByTestId('next');
		expect(next).toBeDisabled();
		fireEvent.click(next);
		expect(onValueChange).not.toHaveBeenCalled();
	});
});

describe('render prop as a function', () => {
	it('hands the function the merged props and the state', () => {
		const states: Array<{ index: number; active: boolean; visible: boolean }> = [];
		render(Parts, {
			root: { open: true, value: 1 },
			onItemState: (s) => states.push({ index: s.index, active: s.active, visible: s.visible })
		});
		const byIndex = new Map(states.map((s) => [s.index, s]));
		expect(byIndex.get(1)).toEqual({ index: 1, active: true, visible: true });
		expect(byIndex.get(0)).toMatchObject({ index: 0, active: false });
	});
});
