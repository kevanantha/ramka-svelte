<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface LightboxCSPProviderProps {
		/**
		 * The per-request CSP nonce (the value behind `'nonce-…'` in the
		 * `style-src` / `style-src-elem` directive). Stamped on every inline
		 * `<style>` tag the lightbox renders so strict-CSP pages keep the
		 * first-paint rules (media fill, active-trigger hide, SSR initial slide).
		 */
		nonce?: string;
		children?: Snippet;
	}
</script>

<!--
	Provides the CSP nonce for the inline `<style>` tags ramka renders.
	Wrap it around everything that renders
	lightbox parts (typically the app's root layout).

	Only the three constant-text server-paint tags need it. The library's
	runtime styling goes through constructed stylesheets, which CSP does not
	police, so it needs no nonce.
-->
<script lang="ts">
	import { setLightboxStyleNonce } from './lightbox-csp';

	let { nonce, children }: LightboxCSPProviderProps = $props();

	setLightboxStyleNonce({
		get nonce() {
			return nonce;
		}
	});
</script>

{@render children?.()}
