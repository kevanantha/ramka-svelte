/**
 * `renderToString` for the server-project suites: the document a server render
 * produces, head then body (`svelte/server`'s `render` returns them apart).
 */
import type { Component } from 'svelte';
import { render } from 'svelte/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renderToString<Props extends Record<string, any>>(
	component: Component<Props>,
	options?: { props?: Props }
): string {
	const { head, body } = render(component as Component<Record<string, unknown>>, options ?? {});
	return head + body;
}

/** Only the body (what the original's `renderToString` returned for a component). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renderBodyToString<Props extends Record<string, any>>(
	component: Component<Props>,
	options?: { props?: Props }
): string {
	return render(component as Component<Record<string, unknown>>, options ?? {}).body;
}
