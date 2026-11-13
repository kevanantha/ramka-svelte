import type { PullToDismissHost } from './pull-to-dismiss.svelte';
import type { Attachment } from 'svelte/attachments';

export interface PullRuntime {
	pullToDismiss: (host: PullToDismissHost) => Attachment<HTMLElement>;
}

let cached: PullRuntime | null = null;
let pending: Promise<PullRuntime> | null = null;

function loadPullRuntime(): Promise<PullRuntime> {
	if (cached) return Promise.resolve(cached);
	pending ??= import('./lightbox-pull-runtime').then(
		(mod) => {
			cached = mod;
			return mod;
		},
		(error: unknown) => {
			// See lightbox-morph-loader: a remembered rejection would disable
			// pull-to-dismiss for the rest of the page, so let the next open retry.
			pending = null;
			throw error;
		}
	);
	return pending;
}

function getPullRuntimeSync(): PullRuntime | null {
	return cached;
}

function prefetchPullRuntime(): void {
	// Best-effort warm-up — see lightbox-morph-loader.
	loadPullRuntime().catch(() => {});
}

export { loadPullRuntime, getPullRuntimeSync, prefetchPullRuntime };
