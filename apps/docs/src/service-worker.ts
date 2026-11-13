/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/**
 * Demo-only: answers `/api/slow-image?ms=…&url=…` on static hosting (see
 * src/lib/server/slow-image.ts for dev/preview). Every other request goes to the
 * network untouched; nothing is cached.
 */
const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('install', () => void sw.skipWaiting());
sw.addEventListener('activate', (event) => event.waitUntil(sw.clients.claim()));

sw.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (url.origin !== sw.location.origin || url.pathname !== '/api/slow-image') return;
	const target = url.searchParams.get('url');
	if (!target?.startsWith('/') || target.startsWith('//')) return;
	const ms = Math.min(Math.max(Number(url.searchParams.get('ms') ?? '500') || 0, 0), 5000);
	event.respondWith(
		new Promise((resolve) => setTimeout(resolve, ms)).then(() =>
			fetch(new URL(target, url.origin), { cache: 'no-store' })
		)
	);
});
