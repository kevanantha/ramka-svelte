// Port of ramka's `lightbox.test.tsx`, `describe('Lightbox')` sections from
// `structure and ARIA` through `scroll lock`. The two server-rendering cases of
// `caption and counter` live in `lightbox.core.ssr.test.ts` (they need
// server-compiled components).
import { describe, it, expect, vi } from 'vitest';

import './lightbox-suite-env';
import { mockTouchDevice, noop } from './lightbox-suite-env';
import { render, screen, fireEvent, act, flushMicrotasks } from './test-utils';
import * as Lightbox from '../../lib/lightbox';
import { createHandle } from '../../lib/lightbox';

import TestLightbox from './fixtures/TestLightbox.svelte';
import Gallery from './fixtures/Gallery.svelte';
import InPlacePortal from './fixtures/core/InPlacePortal.svelte';
import TwoLightboxes from './fixtures/core/TwoLightboxes.svelte';
import DragGuard from './fixtures/core/DragGuard.svelte';
import ControlledOpen from './fixtures/core/ControlledOpen.svelte';
import StageSidebar from './fixtures/core/StageSidebar.svelte';
import DescendantPrevented from './fixtures/core/DescendantPrevented.svelte';
import PortaledMenu from './fixtures/core/PortaledMenu.svelte';
import ZoomSlide from './fixtures/core/ZoomSlide.svelte';
import InertSlides from './fixtures/core/InertSlides.svelte';
import FocusableSlides from './fixtures/core/FocusableSlides.svelte';
import DialogButtons from './fixtures/core/DialogButtons.svelte';
import DynamicLightbox from './fixtures/core/DynamicLightbox.svelte';
import CaptionYield from './fixtures/core/CaptionYield.svelte';
import CaptionWrapper from './fixtures/core/CaptionWrapper.svelte';
import CounterGallery from './fixtures/core/CounterGallery.svelte';
import TwoTriggers from './fixtures/core/TwoTriggers.svelte';
import DetachedTrigger from './fixtures/core/DetachedTrigger.svelte';

// ---------------------------------------------------------------------------
// 1. Structure and ARIA
// ---------------------------------------------------------------------------

describe('Lightbox', () => {
	describe('structure and ARIA', () => {
		it('renders Trigger as a button with type="button"', () => {
			render(TestLightbox);
			const trigger = screen.getByTestId('trigger-0');
			expect(trigger.tagName).toBe('BUTTON');
			expect(trigger).toHaveAttribute('type', 'button');
		});

		it('Trigger advertises the dialog it opens (aria-haspopup, aria-expanded closed)', () => {
			render(TestLightbox);
			const trigger = screen.getByTestId('trigger-0');
			expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
			// Closed: not expanded, and no dangling aria-controls (dialog unmounted).
			expect(trigger).toHaveAttribute('aria-expanded', 'false');
			expect(trigger).not.toHaveAttribute('aria-controls');
		});

		it('clicking a Trigger marks only that trigger expanded and wires aria-controls to the dialog', () => {
			render(TestLightbox, { itemCount: 3 });
			fireEvent.click(screen.getByTestId('trigger-1'));

			const opener = screen.getByTestId('trigger-1');
			const other = screen.getByTestId('trigger-0');
			const dialog = screen.getByTestId('content');

			// Only the trigger that opened the lightbox reports expanded.
			expect(opener).toHaveAttribute('aria-expanded', 'true');
			expect(other).toHaveAttribute('aria-expanded', 'false');

			// aria-controls points at the actual dialog element.
			const controls = opener.getAttribute('aria-controls');
			expect(controls).toBeTruthy();
			expect(dialog).toHaveAttribute('id', controls);
		});

		it('renders Content as a div with role="dialog" when open', () => {
			render(TestLightbox, { defaultOpen: true });
			const dialog = screen.getByTestId('content');
			expect(dialog.tagName).toBe('DIV');
			expect(dialog).toHaveAttribute('role', 'dialog');
			expect(dialog).toHaveAttribute('aria-modal', 'true');
		});

		it('content is removed from DOM when closing', async () => {
			render(TestLightbox, { defaultOpen: true });
			expect(screen.getByTestId('content')).toBeInTheDocument();
			fireEvent.click(screen.getByTestId('close'));
			await flushMicrotasks();
			expect(screen.queryByTestId('content')).toBeNull();
		});

		// The roles are structural and the library's to set; the words announcing
		// them are copy and the consumer's, so no English ships by default.
		it('renders Slides with role="group" and no roledescription of its own', () => {
			render(TestLightbox, { defaultOpen: true });
			const group = screen.getByTestId('slides');
			expect(group).toHaveAttribute('role', 'group');
			expect(group).not.toHaveAttribute('aria-roledescription');
		});

		it('renders Item as a carousel slide (role="group") with no name of its own when no tablist is present', () => {
			render(TestLightbox, { defaultOpen: true, itemCount: 3 });
			const item = screen.getByTestId('item-0');
			expect(item).toHaveAttribute('role', 'group');
			expect(item).not.toHaveAttribute('aria-roledescription');
			expect(item).not.toHaveAttribute('aria-label');
			// A tabpanel with no owning tab would be invalid ARIA.
			expect(item).not.toHaveAttribute('role', 'tabpanel');
		});

		it('lets the consumer supply the carousel and slide copy in their own language', () => {
			render(Gallery, {
				root: { open: true },
				content: { 'data-testid': 'content', 'aria-label': 'מציג תמונות' },
				slides: {
					'data-testid': 'slides',
					'aria-roledescription': 'קרוסלה',
					'aria-label': 'תמונות'
				},
				items: [
					{ 'data-testid': 'item-0', 'aria-roledescription': 'שקופית', 'aria-label': '1 מתוך 1' }
				]
			});
			expect(screen.getByTestId('slides')).toHaveAttribute('aria-roledescription', 'קרוסלה');
			const item = screen.getByTestId('item-0');
			expect(item).toHaveAttribute('aria-roledescription', 'שקופית');
			expect(item).toHaveAttribute('aria-label', '1 מתוך 1');
			// Still the library's structural role underneath the consumer's copy.
			expect(item).toHaveAttribute('role', 'group');
		});

		it('renders Item as a tabpanel wired to its thumbnail tab when a ThumbnailGroup is present', () => {
			render(TestLightbox, { defaultOpen: true, withThumbnails: true, itemCount: 3 });
			const item = screen.getByTestId('item-0');
			expect(item).toHaveAttribute('role', 'tabpanel');

			const panelId = item.getAttribute('id');
			const labelledBy = item.getAttribute('aria-labelledby');
			expect(panelId).toBeTruthy();
			expect(labelledBy).toBeTruthy();

			const thumb = screen.getByTestId('thumb-0');
			// The tab labels the panel, and the panel is controlled by the tab.
			expect(thumb).toHaveAttribute('id', labelledBy);
			expect(thumb).toHaveAttribute('aria-controls', panelId);
		});

		it('active item has aria-hidden="false", inactive has aria-hidden="true"', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 0 });
			expect(screen.getByTestId('item-0')).toHaveAttribute('aria-hidden', 'false');
			expect(screen.getByTestId('item-1')).toHaveAttribute('aria-hidden', 'true');
		});

		it('Counter renders with aria-live="polite" and aria-atomic', () => {
			render(TestLightbox, { defaultOpen: true });
			const counter = screen.getByTestId('counter');
			expect(counter).toHaveAttribute('aria-live', 'polite');
			expect(counter).toHaveAttribute('aria-atomic', 'true');
		});

		it('Caption renders with aria-live="polite" and aria-atomic', () => {
			render(TestLightbox, { defaultOpen: true });
			const caption = screen.getByTestId('caption');
			expect(caption).toHaveAttribute('aria-live', 'polite');
			expect(caption).toHaveAttribute('aria-atomic', 'true');
		});

		it('ThumbnailGroup renders with role="tablist"', () => {
			render(TestLightbox, { defaultOpen: true, withThumbnails: true });
			expect(screen.getByTestId('thumb-group')).toHaveAttribute('role', 'tablist');
		});

		it('Thumbnail renders with role="tab" and aria-selected', () => {
			render(TestLightbox, { defaultOpen: true, withThumbnails: true });
			const thumb = screen.getByTestId('thumb-0');
			expect(thumb).toHaveAttribute('role', 'tab');
			expect(thumb).toHaveAttribute('aria-selected');
		});

		it('Previous and Next render as buttons that ship no label of their own', () => {
			render(TestLightbox, { defaultOpen: true });
			const prev = screen.getByTestId('prev');
			const next = screen.getByTestId('next');
			expect(prev.tagName).toBe('BUTTON');
			expect(next.tagName).toBe('BUTTON');
			// Naming these is the consumer's job — the library never ships English.
			expect(prev).not.toHaveAttribute('aria-label');
			expect(next).not.toHaveAttribute('aria-label');
		});
	});

	// ---------------------------------------------------------------------------
	// 1a. Portal
	// ---------------------------------------------------------------------------

	describe('Portal', () => {
		it('mounts Content under a data-ramka-portal host on document.body', () => {
			render(TestLightbox, { defaultOpen: true });
			const dialog = screen.getByTestId('content');
			const host = dialog.closest('[data-ramka-portal]');
			expect(host).not.toBeNull();
			expect(host?.parentElement).toBe(document.body);
		});

		it('writes the Root dir to the host so CSS direction crosses the portal', () => {
			render(Gallery, {
				root: { open: true, dir: 'rtl' },
				content: { 'data-testid': 'content', 'aria-label': 'RTL' }
			});
			const host = screen.getByTestId('content').closest('[data-ramka-portal]');
			// The host lands on document.body, so without this the lightbox would
			// inherit the page's direction and mirror behavior inside an LTR box.
			expect(host).toHaveAttribute('dir', 'rtl');
		});

		it('writes no dir attribute when the prop is omitted', () => {
			render(TestLightbox, { defaultOpen: true });
			const host = screen.getByTestId('content').closest('[data-ramka-portal]');
			// Defaulting the attribute to the behavioral `'ltr'` default would pin an
			// already-RTL app (dir on <html>) to LTR layout, breaking a case that
			// works today. Absent prop has to stay absent in the DOM.
			expect(host).not.toHaveAttribute('dir');
		});

		it('lets an explicit dir on Portal override Root', () => {
			render(Gallery, {
				root: { open: true, dir: 'rtl' },
				portal: { dir: 'ltr' },
				content: { 'data-testid': 'content', 'aria-label': 'Override' }
			});
			const host = screen.getByTestId('content').closest('[data-ramka-portal]');
			expect(host).toHaveAttribute('dir', 'ltr');
		});

		it('renders in place when container is null', () => {
			const { container } = render(InPlacePortal);
			const dialog = screen.getByTestId('content');
			const host = dialog.closest('[data-ramka-portal]') as HTMLElement | null;
			expect(host).not.toBeNull();
			expect(container.querySelector('[data-testid="anchor"]')).toContainElement(host);
			expect(host?.parentElement).not.toBe(document.body);
		});

		it('portals into a custom container element', () => {
			const custom = document.createElement('div');
			custom.setAttribute('data-testid', 'custom-root');
			document.body.appendChild(custom);
			try {
				render(Gallery, {
					root: { open: true },
					portal: { container: custom },
					content: { 'data-testid': 'content', 'aria-label': 'Custom' }
				});
				const host = screen
					.getByTestId('content')
					.closest('[data-ramka-portal]') as HTMLElement | null;
				expect(custom).toContainElement(host);
			} finally {
				custom.remove();
			}
		});

		it('keepMounted parks Content before the first open', () => {
			render(Gallery, {
				triggers: 1,
				portal: { keepMounted: true },
				content: { 'data-testid': 'content', 'aria-label': 'Parked' }
			});
			const dialog = screen.getByTestId('content');
			expect(dialog).toBeInTheDocument();
			expect(dialog).not.toHaveAttribute('data-open');
			expect(dialog).toHaveAttribute('data-closed');
			expect(dialog).toHaveStyle({ visibility: 'hidden', pointerEvents: 'none' });
			expect(dialog).toHaveAttribute('inert');
		});

		it('keepMounted keeps Content mounted (parked) after close', async () => {
			render(Gallery, {
				root: { open: true },
				portal: { keepMounted: true },
				content: { 'data-testid': 'content', 'aria-label': 'Parked' },
				close: { 'data-testid': 'close' }
			});
			expect(screen.getByTestId('content')).toHaveAttribute('data-open');
			expect(screen.getByTestId('content')).not.toHaveAttribute('data-closed');
			fireEvent.click(screen.getByTestId('close'));
			await flushMicrotasks();
			// Exit animation settle → mounted=false, but keepMounted parks the node.
			await act(async () => {
				await Promise.resolve();
			});
			const dialog = screen.getByTestId('content');
			expect(dialog).toBeInTheDocument();
			expect(dialog).not.toHaveAttribute('data-open');
			expect(dialog).toHaveAttribute('data-closed');
			expect(dialog).toHaveStyle({ visibility: 'hidden', pointerEvents: 'none' });
			expect(dialog).toHaveAttribute('inert');
		});

		it('keepMounted parks Backdrop with Content while closed', () => {
			render(Gallery, {
				portal: { keepMounted: true },
				backdrop: { 'data-testid': 'backdrop' },
				content: { 'data-testid': 'content', 'aria-label': 'Parked' }
			});
			const backdrop = screen.getByTestId('backdrop');
			expect(backdrop).toBeInTheDocument();
			expect(backdrop).not.toHaveAttribute('data-open');
			expect(backdrop).toHaveAttribute('data-closed');
			expect(backdrop).toHaveStyle({ visibility: 'hidden', pointerEvents: 'none' });
			expect(backdrop).toHaveAttribute('inert');
			expect(screen.getByTestId('content')).toHaveAttribute('data-closed');
			expect(screen.getByTestId('content')).not.toHaveAttribute('data-open');
		});
	});

	// ---------------------------------------------------------------------------
	// 1b. Consumer prop composition on Content
	// ---------------------------------------------------------------------------

	describe('consumer prop composition on Content', () => {
		it('composes consumer onClick with the internal backdrop-close handler', async () => {
			const onClick = vi.fn();
			render(Gallery, {
				root: { open: true },
				content: { 'data-testid': 'content', onclick: onClick }
			});
			// Clicking the content background (press started on scrim) must run
			// BOTH the consumer handler and the internal close — not clobber either.
			const content = screen.getByTestId('content');
			fireEvent.pointerDown(content);
			fireEvent.click(content);
			expect(onClick).toHaveBeenCalledTimes(1);
			await flushMicrotasks();
			expect(screen.queryByTestId('content')).toBeNull();
		});

		it('composes consumer onKeyDown while internal keyboard navigation still runs', () => {
			const onKeyDown = vi.fn();
			const onValueChange = vi.fn();
			render(Gallery, {
				root: { open: true, onValueChange },
				content: { 'data-testid': 'content', onkeydown: onKeyDown },
				items: 2
			});
			fireEvent.keyDown(screen.getByTestId('content'), { key: 'ArrowRight' });
			expect(onKeyDown).toHaveBeenCalledTimes(1);
			expect(onValueChange).toHaveBeenCalledWith(1, { source: 'keyboard' });
		});

		it('preserves internal attributes while passing through consumer props', () => {
			render(Gallery, {
				root: { open: true },
				content: { 'data-testid': 'content', 'data-custom': 'x' }
			});
			const el = screen.getByTestId('content');
			expect(el).toHaveAttribute('data-custom', 'x');
			expect(el).toHaveAttribute('role', 'dialog');
			expect(el).toHaveAttribute('aria-modal', 'true');
		});
	});

	// ---------------------------------------------------------------------------
	// 2. Open / Close state
	// ---------------------------------------------------------------------------

	describe('open / close state', () => {
		it('clicking a trigger opens the lightbox (uncontrolled)', () => {
			render(TestLightbox);
			expect(screen.queryByTestId('content')).toBeNull();
			fireEvent.click(screen.getByTestId('trigger-0'));
			expect(screen.getByTestId('content')).toBeInTheDocument();
		});

		it('clicking a trigger sets the active index to that trigger index', () => {
			render(TestLightbox);
			fireEvent.click(screen.getByTestId('trigger-2'));
			expect(screen.getByTestId('item-2')).toHaveAttribute('aria-hidden', 'false');
		});

		it('onOpenChange(true) fires on open', () => {
			const spy = vi.fn();
			render(TestLightbox, { onOpenChange: spy });
			fireEvent.click(screen.getByTestId('trigger-0'));
			expect(spy).toHaveBeenCalledWith(true);
		});

		it('onOpenChange(false) fires on close', () => {
			const spy = vi.fn();
			render(TestLightbox, { defaultOpen: true, onOpenChange: spy });
			fireEvent.click(screen.getByTestId('close'));
			expect(spy).toHaveBeenCalledWith(false);
		});

		it('clicking Close button closes the lightbox', async () => {
			render(TestLightbox, { defaultOpen: true });
			expect(screen.getByTestId('content')).toBeInTheDocument();
			fireEvent.click(screen.getByTestId('close'));
			await flushMicrotasks();
			expect(screen.queryByTestId('content')).toBeNull();
		});

		it('ESC key closes the lightbox', async () => {
			render(TestLightbox, { defaultOpen: true });
			fireEvent.keyDown(screen.getByTestId('content'), { key: 'Escape' });
			await flushMicrotasks();
			expect(screen.queryByTestId('content')).toBeNull();
		});

		it('ESC closes only the focused lightbox when multiple are open', async () => {
			render(TwoLightboxes);
			expect(screen.getByTestId('content-a')).toBeInTheDocument();
			expect(screen.getByTestId('content-b')).toBeInTheDocument();

			// Escape targeted at B must close B only — A stays open.
			fireEvent.keyDown(screen.getByTestId('content-b'), { key: 'Escape' });
			await flushMicrotasks();

			expect(screen.getByTestId('content-a')).toBeInTheDocument();
			expect(screen.queryByTestId('content-b')).toBeNull();
		});

		it('clicking content backdrop area closes the lightbox', async () => {
			render(TestLightbox, { defaultOpen: true });
			const content = screen.getByTestId('content');
			fireEvent.pointerDown(content);
			fireEvent.click(content);
			await flushMicrotasks();
			expect(screen.queryByTestId('content')).toBeNull();
		});

		it('does not close when a drag starts on media and ends on chrome (retargeted click)', async () => {
			// Browsers fire `click` on the nearest common ancestor of mousedown/mouseup.
			// A press that starts on the image and releases on caption/strip/sidebar
			// therefore lands on Content with target === currentTarget — must not dismiss.
			render(DragGuard);
			const content = screen.getByTestId('content');
			fireEvent.pointerDown(screen.getByTestId('media'));
			fireEvent.pointerUp(screen.getByTestId('chrome'));
			// Simulate the browser-retargeted click on the LCA (Content).
			fireEvent.click(content);
			await flushMicrotasks();
			expect(screen.getByTestId('content')).toBeInTheDocument();
		});

		it('controlled open prop controls visibility', () => {
			render(ControlledOpen);
			expect(screen.queryByTestId('content')).toBeNull();
			fireEvent.click(screen.getByTestId('trigger-0'));
			expect(screen.getByTestId('content')).toBeInTheDocument();
		});

		// Regression: an external state setter (not Lightbox.Trigger / Close /
		// imperative handle) must still flip the portal mount state when the
		// controlled `open` prop transitions false → true and back.
		it('external state flipping the controlled open prop mounts and unmounts content', async () => {
			render(ControlledOpen);
			expect(screen.queryByTestId('content')).toBeNull();

			fireEvent.click(screen.getByTestId('ext-open'));
			expect(screen.getByTestId('content')).toBeInTheDocument();

			fireEvent.click(screen.getByTestId('ext-close'));
			await flushMicrotasks();
			expect(screen.queryByTestId('content')).toBeNull();
		});

		// Regression: a lightbox rendered with `open={true}` on first mount
		// must render its content immediately rather than flashing closed
		// until the sync effect catches up.
		it('controlled open={true} on initial mount renders content immediately', () => {
			render(TestLightbox, { open: true, onOpenChange: noop });
			expect(screen.getByTestId('content')).toBeInTheDocument();
		});

		it('defaultOpen={true} renders the lightbox initially open', () => {
			render(TestLightbox, { defaultOpen: true });
			expect(screen.getByTestId('content')).toBeInTheDocument();
		});

		it('content is removed from DOM after close', async () => {
			render(TestLightbox, { defaultOpen: true });
			fireEvent.click(screen.getByTestId('close'));
			await flushMicrotasks();
			expect(screen.queryByTestId('content')).toBeNull();
		});
	});

	// ---------------------------------------------------------------------------
	// 3. Active index and navigation
	// ---------------------------------------------------------------------------

	describe('active index and navigation', () => {
		it('defaultValue sets the initial active item', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 2 });
			expect(screen.getByTestId('item-2')).toHaveAttribute('aria-hidden', 'false');
		});

		it('controlled value prop drives active index', async () => {
			const { rerender } = render(TestLightbox, {
				defaultOpen: true,
				value: 0,
				onValueChange: noop
			});
			expect(screen.getByTestId('item-0')).toHaveAttribute('aria-hidden', 'false');
			await rerender({ defaultOpen: true, value: 2, onValueChange: noop });
			expect(screen.getByTestId('item-2')).toHaveAttribute('aria-hidden', 'false');
		});

		it('onValueChange fires with index and source metadata', () => {
			const spy = vi.fn();
			render(TestLightbox, { defaultOpen: true, onValueChange: spy });
			fireEvent.click(screen.getByTestId('next'));
			expect(spy).toHaveBeenCalledWith(1, { source: 'button' });
		});

		it('Previous button navigates backward', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 1 });
			fireEvent.click(screen.getByTestId('prev'));
			expect(screen.getByTestId('item-0')).toHaveAttribute('aria-hidden', 'false');
		});

		it('Next button navigates forward', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 0 });
			fireEvent.click(screen.getByTestId('next'));
			expect(screen.getByTestId('item-1')).toHaveAttribute('aria-hidden', 'false');
		});

		it('Previous is disabled at index 0 when loop=false', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 0 });
			expect(screen.getByTestId('prev')).toBeDisabled();
		});

		it('Next is disabled at last index when loop=false', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 2, itemCount: 3 });
			expect(screen.getByTestId('next')).toBeDisabled();
		});

		it('Previous wraps to last when loop=true', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 0, loop: true });
			fireEvent.click(screen.getByTestId('prev'));
			expect(screen.getByTestId('item-2')).toHaveAttribute('aria-hidden', 'false');
		});

		it('Next wraps to first when loop=true', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 2, loop: true });
			fireEvent.click(screen.getByTestId('next'));
			expect(screen.getByTestId('item-0')).toHaveAttribute('aria-hidden', 'false');
		});

		it('ArrowRight in Content navigates forward', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 0 });
			fireEvent.keyDown(screen.getByTestId('content'), { key: 'ArrowRight' });
			expect(screen.getByTestId('item-1')).toHaveAttribute('aria-hidden', 'false');
		});

		it('ArrowLeft in Content navigates backward', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 1 });
			fireEvent.keyDown(screen.getByTestId('content'), { key: 'ArrowLeft' });
			expect(screen.getByTestId('item-0')).toHaveAttribute('aria-hidden', 'false');
		});

		it('Home key navigates to first item', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 2 });
			fireEvent.keyDown(screen.getByTestId('content'), { key: 'Home' });
			expect(screen.getByTestId('item-0')).toHaveAttribute('aria-hidden', 'false');
		});

		it('End key navigates to last item', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 0 });
			fireEvent.keyDown(screen.getByTestId('content'), { key: 'End' });
			expect(screen.getByTestId('item-2')).toHaveAttribute('aria-hidden', 'false');
		});

		it('arrow keys respect loop boundaries', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 0, loop: false });
			fireEvent.keyDown(screen.getByTestId('content'), { key: 'ArrowLeft' });
			expect(screen.getByTestId('item-0')).toHaveAttribute('aria-hidden', 'false');
		});

		it('ArrowRight on Content still navigates when Stage is mounted (default dialog focus)', () => {
			render(StageSidebar);

			fireEvent.keyDown(screen.getByTestId('content'), { key: 'ArrowRight' });
			expect(screen.getByTestId('item-1')).toHaveAttribute('aria-hidden', 'false');
		});

		it('arrow keys inside Stage navigate the gallery', () => {
			render(StageSidebar);

			fireEvent.keyDown(screen.getByTestId('stage'), { key: 'ArrowRight' });
			expect(screen.getByTestId('item-1')).toHaveAttribute('aria-hidden', 'false');
		});

		it('arrow keys outside Stage (sidebar) do not navigate the gallery', () => {
			render(StageSidebar);

			fireEvent.keyDown(screen.getByTestId('sidebar'), { key: 'ArrowRight' });
			expect(screen.getByTestId('item-0')).toHaveAttribute('aria-hidden', 'false');
			expect(screen.getByTestId('item-1')).toHaveAttribute('aria-hidden', 'true');
		});

		it('Escape still closes when focus is outside Stage', () => {
			const onOpenChange = vi.fn();
			render(StageSidebar, { itemCount: 1, onOpenChange });

			fireEvent.keyDown(screen.getByTestId('sidebar'), { key: 'Escape' });
			expect(onOpenChange).toHaveBeenCalledWith(false);
		});

		it('defers navigation when a descendant already handled the key (defaultPrevented)', () => {
			// Simulates a composed scroller (e.g. Lightbox.Slides): a descendant
			// calls preventDefault on the arrow key before it bubbles to Content, so
			// Content must not also navigate (single keyboard authority).
			render(DescendantPrevented);

			fireEvent.keyDown(screen.getByTestId('descendant'), { key: 'ArrowRight' });

			// Content bailed out, so the active item is unchanged.
			expect(screen.getByTestId('item-0')).toHaveAttribute('aria-hidden', 'false');
			expect(screen.getByTestId('item-1')).toHaveAttribute('aria-hidden', 'true');
		});

		it('ignores keys whose DOM target is in a React portal outside the dialog host', () => {
			// Svelte: no ReactDOM.createPortal; the menu item is declared inside
			// Content and moved to a document.body host (Svelte's portal pattern).
			render(PortaledMenu);

			fireEvent.keyDown(screen.getByTestId('portaled-menu-item'), { key: 'ArrowRight' });

			expect(screen.getByTestId('item-0')).toHaveAttribute('aria-hidden', 'false');
			expect(screen.getByTestId('item-1')).toHaveAttribute('aria-hidden', 'true');
		});
	});

	// ---------------------------------------------------------------------------
	// 3b. Focus & inert (a slide must never strand keyboard focus)
	// ---------------------------------------------------------------------------

	describe('return focus visibility on close', () => {
		it('requests a visible focus ring on the trigger after a keyboard (Escape) close', async () => {
			render(TestLightbox, { itemCount: 3 });
			const trigger = screen.getByTestId('trigger-0');
			const focusSpy = vi.spyOn(trigger, 'focus');

			fireEvent.click(trigger); // open via pointer
			await flushMicrotasks();

			fireEvent.keyDown(screen.getByTestId('content'), { key: 'Escape' });

			await act(async () => {
				await new Promise((r) => requestAnimationFrame(() => r(null)));
			});

			expect(focusSpy).toHaveBeenCalled();
			expect(focusSpy.mock.calls[focusSpy.mock.calls.length - 1]?.[0]).toMatchObject({
				preventScroll: true,
				focusVisible: true
			});
		});

		it('suppresses the focus ring on the trigger after a pointer (background) close', async () => {
			render(TestLightbox, { itemCount: 3 });
			const trigger = screen.getByTestId('trigger-0');
			const focusSpy = vi.spyOn(trigger, 'focus');

			fireEvent.click(trigger); // open
			await flushMicrotasks();

			// Click the dialog background itself (press + click on scrim) → pointer close.
			const content = screen.getByTestId('content');
			fireEvent.pointerDown(content);
			fireEvent.click(content);

			await act(async () => {
				await new Promise((r) => requestAnimationFrame(() => r(null)));
			});

			expect(focusSpy).toHaveBeenCalled();
			expect(focusSpy.mock.calls[focusSpy.mock.calls.length - 1]?.[0]).toMatchObject({
				preventScroll: true,
				focusVisible: false
			});
		});
	});

	describe('focus containment', () => {
		it('slides expose no focusable region, so inert can never strand focus', () => {
			render(ZoomSlide);

			// The zoom container is intentionally not focusable — with nothing
			// focusable inside a slide, focus never lives there and `inert` on a
			// deactivated slide can never eject focus to <body>.
			expect(screen.getByTestId('item-0').querySelector('[tabindex]')).toBeNull();
		});

		it('marks inactive slides inert and exposes only the active one', () => {
			render(InertSlides);

			// The `inert` prop has to survive both React 18 and 19, which express it
			// differently — assert the attribute actually reached the DOM.
			expect(screen.getByTestId('item-0')).not.toHaveAttribute('inert');
			expect(screen.getByTestId('item-1')).toHaveAttribute('inert');
		});

		it('pulls focus back into the dialog if it escapes (e.g. a focusable control inside an inert slide)', async () => {
			render(FocusableSlides);

			const btn = screen.getByTestId('btn-0');
			btn.focus();
			expect(document.activeElement).toBe(btn);

			// Simulate the browser ejecting focus out of the dialog to <body>
			// (what happens when a focused slide becomes inert on navigation).
			await act(async () => {
				btn.blur();
				await Promise.resolve();
			});

			expect(document.activeElement).toBe(screen.getByTestId('content'));
		});

		it('focus guards are tabbable, carry no aria-hidden, and wrap focus in both directions', () => {
			render(DialogButtons, {
				label: 'Guard test',
				buttons: [
					{ testid: 'first', text: 'First' },
					{ testid: 'last', text: 'Last' }
				]
			});

			const guards = Array.from(document.querySelectorAll('[data-focus-guard]'));
			expect(guards).toHaveLength(2);
			for (const guard of guards) {
				expect(guard).toHaveAttribute('tabindex', '0');
				// A focusable element must not be aria-hidden (axe aria-hidden-focus,
				// WCAG 4.1.2) — the guards rely on being empty instead.
				expect(guard).not.toHaveAttribute('aria-hidden');
			}

			// Tab past the end: the after-guard receives focus and redirects to the
			// first tabbable. Shift+Tab past the start: the before-guard redirects
			// to the last tabbable.
			const [before, after] = guards as [HTMLElement, HTMLElement];
			fireEvent.focus(after);
			expect(document.activeElement).toBe(screen.getByTestId('first'));
			fireEvent.focus(before);
			expect(document.activeElement).toBe(screen.getByTestId('last'));
		});

		it('allows focus to stay in a portaled overlay outside the dialog subtree', async () => {
			render(DialogButtons, {
				label: 'Portaled overlay test',
				buttons: [{ testid: 'in-dialog', text: 'In dialog' }]
			});

			const portalHost = document.createElement('div');
			document.body.appendChild(portalHost);
			const portaledButton = document.createElement('button');
			portaledButton.type = 'button';
			portaledButton.textContent = 'Portaled menu item';
			portalHost.appendChild(portaledButton);

			screen.getByTestId('in-dialog').focus();
			await act(async () => {
				portaledButton.focus();
				await Promise.resolve();
			});

			expect(document.activeElement).toBe(portaledButton);

			portalHost.remove();
		});
	});

	// ---------------------------------------------------------------------------
	// 4. Item rendering and preload
	// ---------------------------------------------------------------------------

	describe('item rendering and preload', () => {
		it('only active + preload neighbors are in the DOM', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 1, itemCount: 5, preload: 1 });
			expect(screen.getByTestId('item-0')).toBeInTheDocument();
			expect(screen.getByTestId('item-1')).toBeInTheDocument();
			expect(screen.getByTestId('item-2')).toBeInTheDocument();
			expect(screen.queryByTestId('item-3')).toBeNull();
			expect(screen.queryByTestId('item-4')).toBeNull();
		});

		it('items outside preload window are not rendered', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 0, itemCount: 5, preload: 0 });
			expect(screen.getByTestId('item-0')).toBeInTheDocument();
			expect(screen.queryByTestId('item-1')).toBeNull();
		});

		it('preload=0 renders only the active item', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 2, itemCount: 5, preload: 0 });
			expect(screen.getByTestId('item-2')).toBeInTheDocument();
			expect(screen.queryByTestId('item-0')).toBeNull();
			expect(screen.queryByTestId('item-1')).toBeNull();
			expect(screen.queryByTestId('item-3')).toBeNull();
			expect(screen.queryByTestId('item-4')).toBeNull();
		});

		it('preload=2 renders 5 items centered on active', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 3, itemCount: 7, preload: 2 });
			expect(screen.queryByTestId('item-0')).toBeNull();
			expect(screen.getByTestId('item-1')).toBeInTheDocument();
			expect(screen.getByTestId('item-2')).toBeInTheDocument();
			expect(screen.getByTestId('item-3')).toBeInTheDocument();
			expect(screen.getByTestId('item-4')).toBeInTheDocument();
			expect(screen.getByTestId('item-5')).toBeInTheDocument();
			expect(screen.queryByTestId('item-6')).toBeNull();
		});

		it('render-prop children receive { active, visible } state', () => {
			// Svelte: the render prop is Item's `children` snippet, which receives the state.
			render(TestLightbox, { defaultOpen: true, defaultValue: 0, renderPropItems: true });
			const activeItem = screen.getByTestId('render-prop-0');
			expect(activeItem).toHaveAttribute('data-active', 'true');
			expect(activeItem).toHaveAttribute('data-visible', 'true');
		});

		it('render-prop active is true only for active item', () => {
			// Svelte: the render prop is Item's `children` snippet, which receives the state.
			render(TestLightbox, { defaultOpen: true, defaultValue: 0, renderPropItems: true });
			const activeItem = screen.getByTestId('render-prop-0');
			const inactiveItem = screen.getByTestId('render-prop-1');
			expect(activeItem).toHaveAttribute('data-active', 'true');
			expect(inactiveItem).toHaveAttribute('data-active', 'false');
		});

		it('itemCount reflects mounted items accurately', () => {
			render(TestLightbox, { defaultOpen: true, itemCount: 4 });
			const counter = screen.getByTestId('counter');
			expect(counter.textContent).toContain('/ 4');
		});

		it('dynamic item removal decreases itemCount', () => {
			render(DynamicLightbox);
			expect(screen.getByTestId('counter').textContent).toContain('/ 4');
			fireEvent.click(screen.getByTestId('remove'));
			expect(screen.getByTestId('counter').textContent).toContain('/ 2');
		});
	});

	// ---------------------------------------------------------------------------
	// 5. Preload with loop
	// ---------------------------------------------------------------------------

	describe('preload with loop', () => {
		it('at index 0 with loop, last item is within preload distance', () => {
			render(TestLightbox, {
				defaultOpen: true,
				defaultValue: 0,
				itemCount: 5,
				preload: 1,
				loop: true
			});
			expect(screen.getByTestId('item-0')).toBeInTheDocument();
			expect(screen.getByTestId('item-1')).toBeInTheDocument();
			expect(screen.getByTestId('item-4')).toBeInTheDocument();
			expect(screen.queryByTestId('item-2')).toBeNull();
			expect(screen.queryByTestId('item-3')).toBeNull();
		});

		it('at last index with loop, first item is within preload distance', () => {
			render(TestLightbox, {
				defaultOpen: true,
				defaultValue: 4,
				itemCount: 5,
				preload: 1,
				loop: true
			});
			expect(screen.getByTestId('item-4')).toBeInTheDocument();
			expect(screen.getByTestId('item-3')).toBeInTheDocument();
			expect(screen.getByTestId('item-0')).toBeInTheDocument();
			expect(screen.queryByTestId('item-1')).toBeNull();
			expect(screen.queryByTestId('item-2')).toBeNull();
		});

		it('circular distance calculation is correct with preload=2', () => {
			render(TestLightbox, {
				defaultOpen: true,
				defaultValue: 0,
				itemCount: 6,
				preload: 2,
				loop: true
			});
			expect(screen.getByTestId('item-0')).toBeInTheDocument();
			expect(screen.getByTestId('item-1')).toBeInTheDocument();
			expect(screen.getByTestId('item-2')).toBeInTheDocument();
			expect(screen.getByTestId('item-4')).toBeInTheDocument();
			expect(screen.getByTestId('item-5')).toBeInTheDocument();
			expect(screen.queryByTestId('item-3')).toBeNull();
		});
	});

	// ---------------------------------------------------------------------------
	// 6. Caption and Counter
	// ---------------------------------------------------------------------------

	describe('caption and counter', () => {
		it('caption displays the active item caption text', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 0, withCaptions: true });
			expect(screen.getByTestId('caption').textContent).toBe('Caption 0');
		});

		it('caption updates when navigating', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 0, withCaptions: true });
			fireEvent.click(screen.getByTestId('next'));
			expect(screen.getByTestId('caption').textContent).toBe('Caption 1');
		});

		it('caption renders nothing when no caption is set', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 0 });
			expect(screen.getByTestId('caption').textContent).toBe('');
		});

		it('caption has data-has-caption only when caption exists', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 0, withCaptions: true });
			expect(screen.getByTestId('caption')).toHaveAttribute('data-has-caption');
		});

		// 'paints the children fallback on the server, where captions cannot
		// register': in lightbox.core.ssr.test.ts (server-compiled components).

		it('caption fallback yields to the registry once any item has registered', () => {
			render(CaptionYield);
			// Registry wins for the active item…
			expect(screen.getByTestId('fallback-caption').textContent).toBe('Registered caption');
			// …and a caption-less item renders empty, NOT the fallback: after
			// registration a missing entry means "no caption", the fallback
			// describes one specific pre-registration item.
			fireEvent.click(screen.getByTestId('fallback-next'));
			expect(screen.getByTestId('fallback-caption').textContent).toBe('');
		});

		it('caption updates reactively when the active item caption changes without navigating', async () => {
			const { rerender } = render(CaptionWrapper, { text: 'First' });
			expect(screen.getByTestId('reactive-caption').textContent).toBe('First');

			// activeIndex is unchanged; only the caption content changes. The
			// ref-read-during-render version would keep showing "First".
			await rerender({ text: 'Second' });
			expect(screen.getByTestId('reactive-caption').textContent).toBe('Second');
		});

		it('counter displays "1 / N" format', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 0, itemCount: 5 });
			expect(screen.getByTestId('counter').textContent).toBe('1 / 5');
		});

		it('counter render-prop receives { current, total }', () => {
			// Svelte: the render prop is Counter's `children` snippet.
			render(CounterGallery, { value: 2, custom: true });
			expect(screen.getByTestId('counter').textContent).toBe('3 of 4');
		});

		// 'paints the `count` fallback on the server, where items cannot
		// register': in lightbox.core.ssr.test.ts (server-compiled components).

		it('ignores `count` once mounted items have registered', () => {
			render(CounterGallery, { value: 0, count: 99 });
			// The live registry wins — a stale prop can't drift the total.
			expect(screen.getByTestId('counter').textContent).toBe('1 / 4');
		});
	});

	// ---------------------------------------------------------------------------
	// 7. Thumbnail navigation
	// ---------------------------------------------------------------------------

	describe('thumbnail navigation', () => {
		it('clicking a thumbnail changes the active index', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 0, withThumbnails: true });
			fireEvent.click(screen.getByTestId('thumb-2'));
			expect(screen.getByTestId('item-2')).toHaveAttribute('aria-hidden', 'false');
		});

		it('active thumbnail has aria-selected="true" and tabIndex=0', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 1, withThumbnails: true });
			const active = screen.getByTestId('thumb-1');
			expect(active).toHaveAttribute('aria-selected', 'true');
			expect(active).toHaveAttribute('tabindex', '0');
		});

		it('inactive thumbnails have aria-selected="false" and tabIndex=-1', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 0, withThumbnails: true });
			const inactive = screen.getByTestId('thumb-1');
			expect(inactive).toHaveAttribute('aria-selected', 'false');
			expect(inactive).toHaveAttribute('tabindex', '-1');
		});

		it('ArrowRight in ThumbnailGroup navigates between thumbnails', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 0, withThumbnails: true });
			screen.getByTestId('thumb-0').focus();
			fireEvent.keyDown(screen.getByTestId('thumb-group'), { key: 'ArrowRight' });
			expect(document.activeElement).toBe(screen.getByTestId('thumb-1'));
		});

		it('Home/End in ThumbnailGroup jump to first/last', () => {
			render(TestLightbox, { defaultOpen: true, defaultValue: 1, withThumbnails: true });
			screen.getByTestId('thumb-1').focus();
			fireEvent.keyDown(screen.getByTestId('thumb-group'), { key: 'End' });
			expect(document.activeElement).toBe(screen.getByTestId('thumb-2'));
			fireEvent.keyDown(screen.getByTestId('thumb-group'), { key: 'Home' });
			expect(document.activeElement).toBe(screen.getByTestId('thumb-0'));
		});

		it('loop wrapping works in ThumbnailGroup', () => {
			render(TestLightbox, {
				defaultOpen: true,
				defaultValue: 2,
				withThumbnails: true,
				loop: true
			});
			screen.getByTestId('thumb-2').focus();
			fireEvent.keyDown(screen.getByTestId('thumb-group'), { key: 'ArrowRight' });
			expect(document.activeElement).toBe(screen.getByTestId('thumb-0'));
		});
	});

	// ---------------------------------------------------------------------------
	// 8. Trigger state attributes
	// ---------------------------------------------------------------------------

	describe('trigger state attributes', () => {
		it('trigger gets data-popup-open when lightbox is open', () => {
			render(TestLightbox);
			const trigger = screen.getByTestId('trigger-0');
			expect(trigger).not.toHaveAttribute('data-popup-open');
			expect(trigger).not.toHaveAttribute('data-open');
			fireEvent.click(trigger);
			expect(screen.getByTestId('trigger-0')).toHaveAttribute('data-popup-open');
			expect(screen.getByTestId('trigger-0')).not.toHaveAttribute('data-open');
		});

		it('trigger gets data-active when it is the active trigger', () => {
			render(TestLightbox);
			fireEvent.click(screen.getByTestId('trigger-1'));
			expect(screen.getByTestId('trigger-1')).toHaveAttribute('data-active');
		});

		it('data-popup-open is removed when lightbox closes', () => {
			render(TestLightbox);
			fireEvent.click(screen.getByTestId('trigger-0'));
			expect(screen.getByTestId('trigger-0')).toHaveAttribute('data-popup-open');
			fireEvent.click(screen.getByTestId('close'));
			expect(screen.getByTestId('trigger-0')).not.toHaveAttribute('data-popup-open');
		});

		it('only the matching trigger gets data-active', () => {
			render(TestLightbox);
			fireEvent.click(screen.getByTestId('trigger-1'));
			expect(screen.getByTestId('trigger-1')).toHaveAttribute('data-active');
			expect(screen.getByTestId('trigger-0')).not.toHaveAttribute('data-active');
			expect(screen.getByTestId('trigger-2')).not.toHaveAttribute('data-active');
		});
	});

	// ---------------------------------------------------------------------------
	// 9. createHandle API
	// ---------------------------------------------------------------------------

	describe('createHandle API', () => {
		it('handle.open/close/goTo control a Root with handle prop', () => {
			const handle = createHandle();
			render(Gallery, {
				root: { handle },
				content: { 'data-testid': 'content', 'aria-label': 'Test' },
				items: [{ 'data-testid': 'item-0' }, { 'data-testid': 'item-1' }]
			});
			expect(handle.isOpen).toBe(false);
			act(() => handle.open(1));
			expect(handle.isOpen).toBe(true);
			expect(screen.getByTestId('item-1')).toHaveAttribute('aria-hidden', 'false');
			act(() => handle.goTo(0));
			expect(screen.getByTestId('item-0')).toHaveAttribute('aria-hidden', 'false');
			act(() => handle.close());
			expect(handle.isOpen).toBe(false);
		});

		it('handle.open() opens the lightbox', () => {
			const handle = createHandle();
			render(Gallery, {
				root: { handle },
				content: { 'data-testid': 'content', 'aria-label': 'Test' }
			});
			expect(screen.queryByTestId('content')).toBeNull();
			act(() => handle.open());
			expect(screen.getByTestId('content')).toBeInTheDocument();
		});

		it('handle.open(index, { triggerId }) associates the opening trigger', () => {
			const handle = createHandle();
			const onValueChange = vi.fn();
			render(TwoTriggers, { handle, onValueChange, ids: ['hero-a', 'hero-b'] });
			act(() => handle.open(0, { triggerId: 'hero-b' }));
			expect(screen.getByTestId('content')).toBeInTheDocument();
			expect(onValueChange).toHaveBeenCalledWith(0, { source: 'imperative' });
			expect(screen.getByTestId('trigger-b')).toHaveAttribute('data-active');
		});

		it('detached Trigger with handle opens the Root', () => {
			const handle = createHandle();
			render(DetachedTrigger, {
				handle,
				triggerId: 'detached',
				triggerIndex: 0,
				triggerTestId: 'detached-trigger',
				triggerLabel: 'Open'
			});
			expect(screen.queryByTestId('content')).toBeNull();
			fireEvent.click(screen.getByTestId('detached-trigger'));
			expect(screen.getByTestId('content')).toBeInTheDocument();
			expect(screen.getByTestId('detached-trigger')).toHaveAttribute('data-popup-open');
			expect(screen.getByTestId('detached-trigger')).not.toHaveAttribute('data-open');
			expect(screen.getByTestId('detached-trigger')).toHaveAttribute('data-active');
		});

		it('handle.open with triggerId associates a detached Trigger', () => {
			const handle = createHandle();
			render(DetachedTrigger, {
				handle,
				triggerId: 'tile-1',
				triggerIndex: 1,
				triggerTestId: 'tile-1',
				triggerLabel: 'Tile 1',
				itemCount: 2
			});
			act(() => handle.open(undefined, { triggerId: 'tile-1' }));
			expect(screen.getByTestId('item-1')).toHaveAttribute('aria-hidden', 'false');
			expect(screen.getByTestId('tile-1')).toHaveAttribute('data-active');
		});
	});

	// ---------------------------------------------------------------------------
	// 10. Lifecycle callbacks
	// ---------------------------------------------------------------------------

	describe('lifecycle callbacks', () => {
		it('onOpenChangeComplete(true) fires after open', async () => {
			const spy = vi.fn();
			render(TestLightbox, { onOpenChangeComplete: spy });
			fireEvent.click(screen.getByTestId('trigger-0'));
			await act(() => new Promise((r) => requestAnimationFrame(r)));
			expect(spy).toHaveBeenCalledWith(true);
		});

		it('onOpenChangeComplete(false) fires after close', async () => {
			const spy = vi.fn();
			render(TestLightbox, { defaultOpen: true, onOpenChangeComplete: spy });
			fireEvent.click(screen.getByTestId('close'));
			await flushMicrotasks();
			expect(spy).toHaveBeenCalledWith(false);
		});

		it('onOpenChangeComplete fires even when onOpenChange is not provided', async () => {
			const completeSpy = vi.fn();
			render(TestLightbox, { onOpenChangeComplete: completeSpy });
			fireEvent.click(screen.getByTestId('trigger-0'));
			await act(() => new Promise((r) => requestAnimationFrame(r)));
			expect(completeSpy).toHaveBeenCalledWith(true);
		});

		it('onOpenChangeComplete does not fire if close is interrupted by reopen', async () => {
			const completeSpy = vi.fn();
			const handle = createHandle();
			render(Gallery, {
				root: { handle, onOpenChangeComplete: completeSpy, open: true },
				content: { 'data-testid': 'content', 'aria-label': 'Test' }
			});

			act(() => handle.close());
			act(() => handle.open());

			await act(() => new Promise((r) => setTimeout(r, 50)));

			const closeCalls = completeSpy.mock.calls.filter((call) => call[0] === false);
			expect(closeCalls).toHaveLength(0);
		});
	});

	// ---------------------------------------------------------------------------
	// 11. Edge cases
	// ---------------------------------------------------------------------------

	describe('edge cases', () => {
		it('opening with no items does not crash', () => {
			expect(() => {
				render(Gallery, {
					root: { open: true },
					content: { 'aria-label': 'Empty' },
					items: 0
				});
			}).not.toThrow();
		});

		it('navigation with itemCount === 1 stays at index 0', () => {
			render(TestLightbox, { defaultOpen: true, itemCount: 1, defaultValue: 0 });
			fireEvent.click(screen.getByTestId('next'));
			expect(screen.getByTestId('item-0')).toHaveAttribute('aria-hidden', 'false');
		});

		it('compound component outside context throws meaningful error', () => {
			expect(() => {
				render(Lightbox.Trigger, { index: 0 });
			}).toThrow(
				'Lightbox.Trigger must be used within a Lightbox.Root, or passed a handle from Lightbox.createHandle()'
			);
		});

		it('multiple triggers for the same index work correctly', () => {
			render(TwoTriggers);
			fireEvent.click(screen.getByTestId('trigger-b'));
			expect(screen.getByTestId('content')).toBeInTheDocument();
			expect(screen.getByTestId('item-0')).toHaveAttribute('aria-hidden', 'false');
		});

		it('rapid open/close does not leave stale state', async () => {
			const handle = createHandle();
			render(Gallery, {
				root: { handle },
				content: { 'data-testid': 'content', 'aria-label': 'Test' }
			});

			act(() => handle.open());
			act(() => handle.close());
			act(() => handle.open());
			act(() => handle.close());

			await flushMicrotasks();
			expect(screen.queryByTestId('content')).toBeNull();
		});
	});

	// ---------------------------------------------------------------------------
	// 11b. Scroll lock (scrollbar compensation)
	// ---------------------------------------------------------------------------

	describe('scroll lock', () => {
		it('compensates body padding for the disappearing scrollbar, then restores it on close', async () => {
			// Simulate a classic (non-overlay) scrollbar by making the viewport wider
			// than the documentElement's clientWidth. lockScroll must pad the body by
			// that delta so hiding the scrollbar doesn't shift page content.
			const origInnerWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth');
			const origClientWidth = Object.getOwnPropertyDescriptor(
				document.documentElement,
				'clientWidth'
			);
			Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => 1020 });
			Object.defineProperty(document.documentElement, 'clientWidth', {
				configurable: true,
				get: () => 1000
			});
			// Logical padding: the gutter is on the inline-end edge in both reading
			// directions, so the lock compensates `padding-inline-end`.
			document.body.style.paddingInlineEnd = '10px';

			try {
				render(TestLightbox);
				fireEvent.click(screen.getByTestId('trigger-0'));

				expect(document.documentElement.style.overflow).toBe('hidden');
				// Existing 10px + 20px scrollbar width.
				expect(document.body.style.paddingInlineEnd).toBe('30px');

				fireEvent.click(screen.getByTestId('close'));
				await flushMicrotasks();

				expect(document.documentElement.style.overflow).toBe('');
				expect(document.body.style.paddingInlineEnd).toBe('10px');
			} finally {
				document.body.style.paddingInlineEnd = '';
				if (origInnerWidth) Object.defineProperty(window, 'innerWidth', origInnerWidth);
				else delete (window as unknown as { innerWidth?: number }).innerWidth;
				if (origClientWidth) {
					Object.defineProperty(document.documentElement, 'clientWidth', origClientWidth);
				} else {
					delete (document.documentElement as unknown as { clientWidth?: number }).clientWidth;
				}
			}
		});

		it('never sets scrollbar-width on the document (WebKit bug 282419)', async () => {
			// Hiding the fading iOS overlay scroll indicator via
			// `scrollbar-width: none` on <html> looked like a free win, but
			// restoring it permanently destroys the tab's page scrollbar on iOS —
			// WebKit never re-attaches the native scroller layer
			// (https://bugs.webkit.org/show_bug.cgi?id=282419), and the breakage
			// survives page reloads. Guard against reintroducing it.
			render(TestLightbox, { defaultOpen: true });
			expect(document.documentElement.style.getPropertyValue('scrollbar-width')).toBe('');

			fireEvent.click(screen.getByTestId('close'));
			await flushMicrotasks();
			expect(document.documentElement.style.getPropertyValue('scrollbar-width')).toBe('');
		});

		it('disables document text selection while open on touch devices, then restores it on close', async () => {
			// Regression: iOS Safari tap→pan while zoomed selected the page behind
			// the lightbox. The scroll lock sets user-select on <html> for the
			// open lifetime.
			const restoreTouch = mockTouchDevice();
			try {
				render(TestLightbox, { defaultOpen: true });

				expect(document.documentElement.style.userSelect).toBe('none');

				fireEvent.click(screen.getByTestId('close'));
				await flushMicrotasks();

				expect(document.documentElement.style.userSelect).toBe('');
			} finally {
				restoreTouch();
			}
		});

		it('never touches user-select on devices without touch', async () => {
			// The selection bug is touch-driven; a mouse can't select the page
			// behind the fullscreen overlay. Skipping the guard also skips two
			// whole-document restyles (`user-select` is inherited, so writing it
			// on <html> invalidates every element's computed style).
			render(TestLightbox, { defaultOpen: true });

			// Scroll is locked, but selection is left alone.
			expect(document.documentElement.style.overflow).toBe('hidden');
			expect(document.documentElement.style.userSelect).toBe('');

			fireEvent.click(screen.getByTestId('close'));
			await flushMicrotasks();

			expect(document.documentElement.style.userSelect).toBe('');
		});
	});
});
