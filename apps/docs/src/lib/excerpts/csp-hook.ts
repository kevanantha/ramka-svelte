// @docs-excerpt-title src/hooks.server.ts
import type { Handle } from '@sveltejs/kit/hooks';

export const handle: Handle = async ({ event, resolve }) => {
	// A fresh value per request; +layout.server.ts returns it as `data.nonce`.
	const nonce = crypto.randomUUID().replaceAll('-', '');
	(event.locals as { nonce?: string }).nonce = nonce; // @docs-replace event.locals.nonce = nonce; // declared on App.Locals
	const response = await resolve(event);
	response.headers.set(
		'Content-Security-Policy',
		`default-src 'self'; style-src-elem 'self' 'nonce-${nonce}'; style-src-attr 'unsafe-inline'`
	);
	return response;
};
