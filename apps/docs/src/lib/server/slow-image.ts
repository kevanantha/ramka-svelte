/**
 * Demo-only delay proxy: `GET /api/slow-image?url=/photos/x.jpg&ms=500` waits,
 * then streams the same-origin image, so lightbox placeholders stay visible.
 * Port of the original docs' app/api/slow-image/route.ts.
 *
 * The docs build with adapter-static, so there is no request-time server in
 * production. This runs as Vite middleware instead, in both `vite dev` and
 * `vite preview` (see vite.config.ts); a static host returns 404 for it.
 */
import type { Connect, Plugin } from 'vite';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

const MAX_DELAY_MS = 5_000;
const PATH = '/api/slow-image';

function json(res: Parameters<Connect.NextHandleFunction>[1], status: number, body: object) {
	res.statusCode = status;
	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify(body));
}

function middleware(httpServer: () => Server | null): Connect.NextHandleFunction {
	return async (req, res, next) => {
		if (req.method !== 'GET' || !req.url?.startsWith(PATH)) return next();
		const proto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0] ?? 'http';
		const requestUrl = new URL(req.url, `${proto}://${req.headers.host ?? 'localhost'}`);
		if (requestUrl.pathname !== PATH) return next();

		const { searchParams } = requestUrl;
		const target = searchParams.get('url');
		const ms = Math.min(Math.max(Number(searchParams.get('ms') ?? '500') || 0, 0), MAX_DELAY_MS);

		if (!target) return json(res, 400, { error: 'Missing url' });

		let parsed: URL;
		try {
			parsed = target.startsWith('/') ? new URL(target, requestUrl.origin) : new URL(target);
		} catch {
			return json(res, 400, { error: 'Invalid url' });
		}
		if (parsed.origin !== requestUrl.origin) return json(res, 400, { error: 'Host not allowed' });

		if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms));

		// Fetch from this server's own listen address: behind a proxy the public
		// origin may not be reachable from here.
		const address = httpServer()?.address() as AddressInfo | null;
		const local = address ? `http://127.0.0.1:${address.port}` : requestUrl.origin;
		let upstream: Response;
		try {
			upstream = await fetch(new URL(parsed.pathname + parsed.search, local), {
				cache: 'no-store',
				headers: { Accept: 'image/*' }
			});
		} catch {
			return json(res, 502, { error: 'Upstream unreachable' });
		}
		if (!upstream.ok || !upstream.body) {
			return json(res, 502, { error: `Upstream ${upstream.status}` });
		}

		res.statusCode = 200;
		res.setHeader('Content-Type', upstream.headers.get('Content-Type') ?? 'image/jpeg');
		res.setHeader('Cache-Control', 'no-store');
		res.end(Buffer.from(await upstream.arrayBuffer()));
	};
}

export function slowImage(): Plugin {
	return {
		name: 'docs-slow-image',
		configureServer(server) {
			server.middlewares.use(middleware(() => server.httpServer as Server | null));
		},
		configurePreviewServer(server) {
			server.middlewares.use(middleware(() => server.httpServer as Server | null));
		}
	};
}
