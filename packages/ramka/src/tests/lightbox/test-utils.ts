/**
 * The React suite's testing vocabulary, in Svelte terms, so ported test bodies
 * read like the originals.
 *
 * - `fireEvent` is `@testing-library/dom`'s synchronous one. `@testing-library/svelte`
 *   configures it (in its auto `setup`) to wrap every dispatch in `flushSync`, so
 *   the DOM reflects the handler's state change when the call returns — the same
 *   guarantee React's `fireEvent` gives through `act`.
 * - `act(fn)` runs `fn` and flushes Svelte's pending updates and effects
 *   (`flushSync`). Async callbacks are awaited first, then flushed and ticked.
 */
import { flushSync, tick } from 'svelte';

export { fireEvent, screen, within, waitFor } from '@testing-library/dom';
export { render, cleanup } from '@testing-library/svelte';

export function act<T>(fn: () => Promise<T>): Promise<T>;
export function act<T>(fn: () => T): T;
export function act<T>(fn: () => T | Promise<T>): T | Promise<T> {
	const result = fn();
	if (result instanceof Promise) {
		return result.then(async (value) => {
			flushSync();
			await tick();
			return value;
		});
	}
	flushSync();
	return result;
}

/** Let queued microtasks (promise continuations) run, then flush. */
export const flushMicrotasks = () => act(async () => undefined);
