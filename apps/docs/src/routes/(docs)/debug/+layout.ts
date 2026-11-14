import { dev } from '$app/env';
import { error } from '@sveltejs/kit';

// Debug pages are dev-only, as on ramka.dev: production answers 404 and the
// static build writes no HTML for them (see handleHttpError in vite.config.ts).
export function load() {
	if (!dev) error(404, 'Not found');
}
