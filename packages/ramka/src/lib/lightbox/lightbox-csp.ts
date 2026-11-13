import { createContext } from 'svelte';

/**
 * Carries the CSP style nonce to `Lightbox.Root`, which stamps it on the
 * server-paint `<style>` tags (see server-paint-styles.ts). A dedicated
 * context, not a Root prop, so one provider above the whole app covers every
 * Root.
 */
const [getNonceContext, setNonceContext, hasNonceContext] = createContext<{
	readonly nonce: string | undefined;
}>();

/** Style nonce for the library's inline `<style>` tags; `undefined` outside a provider. */
function getLightboxStyleNonce(): { readonly nonce: string | undefined } {
	return hasNonceContext() ? getNonceContext() : { nonce: undefined };
}

export { getLightboxStyleNonce, setNonceContext as setLightboxStyleNonce };
