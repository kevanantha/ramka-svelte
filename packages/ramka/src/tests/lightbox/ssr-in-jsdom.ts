/**
 * Server-render a fixture from inside a jsdom (client project) test, for the
 * hydration cases: the client project compiles components for the browser, so
 * this loads a server-compiled copy through a throwaway Vite SSR graph (the
 * counterpart of calling `react-dom/server` from a jsdom test).
 */
export async function renderOnServer(
	fixture: string,
	props: Record<string, unknown> = {}
): Promise<{ head: string; body: string }> {
	const [{ createServer }, { svelte }] = await Promise.all([
		import('vite'),
		import('@sveltejs/vite-plugin-svelte')
	]);
	const server = await createServer({
		// `root` defaults to the cwd, the package directory vitest runs in.
		configFile: false,
		logLevel: 'error',
		appType: 'custom',
		server: { middlewareMode: true, hmr: false, ws: false },
		plugins: [svelte({ compilerOptions: { runes: true } })]
	});
	try {
		const component = await server.ssrLoadModule(fixture);
		const { render } = await server.ssrLoadModule('svelte/server');
		return render(component.default, { props });
	} finally {
		await server.close();
	}
}
