<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	/**
	 * Sized destination media host. Put fit-box sizing here and an
	 * `<img>` / `<video>` inside: it becomes the morph target and the canvas
	 * placeholder host, and auto-wires the child image as the item's `image`.
	 */
	export interface LightboxMediaProps extends HTMLAttributes<HTMLDivElement> {
		/**
		 * Intrinsic media size. With both set, Media sizes itself as a
		 * `contain` fit-box (`min(100cqw, 100cqh × ratio)`) against the nearest
		 * size container (`Lightbox.Slides`). Read from the child `<img>`'s
		 * `width`/`height` attributes (or natural size) when omitted.
		 */
		width?: number;
		height?: number;
		ref?: HTMLDivElement | null;
	}

	function dimsFromImg(img: HTMLImageElement): { width: number; height: number } | null {
		const w = Number(img.getAttribute('width')) || img.naturalWidth;
		const h = Number(img.getAttribute('height')) || img.naturalHeight;
		return w > 0 && h > 0 ? { width: w, height: h } : null;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { getLightboxItemContext } from './LightboxItem.svelte';
	import { ensureLibrarySheet } from './vt-style-sheets';
	import { MEDIA_FILL_CSS, MEDIA_FILL_MARKER } from './media-fill';

	let {
		width: widthProp,
		height: heightProp,
		ref = $bindable(null),
		style,
		children,
		...rest
	}: LightboxMediaProps = $props();

	const item = getLightboxItemContext();

	let autoDims = $state<{ width: number; height: number } | null>(null);
	let wiredImage: HTMLImageElement | null = null;
	let unwireImage: (() => void) | void = undefined;
	let managedPoster: HTMLImageElement | null = null;

	const width = $derived(widthProp ?? autoDims?.width);
	const height = $derived(heightProp ?? autoDims?.height);
	const hasFitBox = $derived(!!(width && height && width > 0 && height > 0));

	$effect(() => {
		ensureLibrarySheet(MEDIA_FILL_MARKER, () => MEDIA_FILL_CSS);
	});

	$effect(() => {
		const node = ref;
		if (!node || !item) return;
		item.media = node;
		return () => {
			if (item.media === node) item.media = null;
		};
	});

	function clearManagedPoster() {
		managedPoster?.remove();
		managedPoster = null;
	}

	/** Hands `img` to the item's `image` attachment (and releases the last one). */
	function wire(img: HTMLImageElement | null) {
		if (img === wiredImage) return;
		unwireImage?.();
		wiredImage = img;
		unwireImage = img && item ? item.image(img) : undefined;
	}

	/**
	 * Find the media inside and wire it: the first `<img>` becomes the `image`
	 * (and its dims the fit-box). A `<video poster>` gets a hidden managed
	 * poster `<img>` so the placeholder bridge still has a decodable image.
	 */
	function syncImage() {
		const host = ref;
		if (!host || !item) return;
		const isManaged = (n: Element) => n === managedPoster;
		const direct = Array.from(host.children).find(
			(n): n is HTMLImageElement => n instanceof HTMLImageElement && !isManaged(n)
		);
		const nested = Array.from(host.querySelectorAll('img')).find((n) => !isManaged(n));
		const img = direct ?? nested ?? null;

		if (img) {
			clearManagedPoster();
			const next = dimsFromImg(img);
			if (autoDims?.width !== next?.width || autoDims?.height !== next?.height) autoDims = next;
			wire(img);
			return;
		}

		const video = host.querySelector('video');
		const poster = video?.getAttribute('poster') || video?.poster || '';
		if (video && poster) {
			let managed = managedPoster;
			if (!managed) {
				managed = document.createElement('img');
				managed.setAttribute('data-ramka-media-poster', '');
				managed.alt = '';
				managed.setAttribute('aria-hidden', 'true');
				Object.assign(managed.style, {
					position: 'absolute',
					inset: '0',
					width: '100%',
					height: '100%',
					opacity: '0',
					pointerEvents: 'none'
				});
				host.insertBefore(managed, host.firstChild);
				managedPoster = managed;
			}
			const cs = getComputedStyle(video);
			managed.style.objectFit = cs.objectFit === 'contain' ? 'contain' : 'cover';
			managed.style.objectPosition = cs.objectPosition || 'center';
			if (managed.getAttribute('src') !== poster) managed.src = poster;
			autoDims = null;
			wire(managed);
			return;
		}

		clearManagedPoster();
		autoDims = null;
		wire(null);
	}

	$effect(() => {
		const host = ref;
		if (!host) return;
		untrack(syncImage);
		const observer = new MutationObserver(syncImage);
		observer.observe(host, { childList: true, subtree: true });
		return () => {
			observer.disconnect();
			clearManagedPoster();
			wire(null);
		};
	});

	const fitBoxStyle = $derived(
		hasFitBox
			? `width: min(100cqw, calc(100cqh * ${width! / height!})); aspect-ratio: ${width} / ${height};`
			: ''
	);
</script>

<div
	bind:this={ref}
	data-width={hasFitBox ? width : undefined}
	data-height={hasFitBox ? height : undefined}
	data-placeholder={item?.mediaPlaceholder ? '' : undefined}
	{...rest}
	style="position: relative; flex-shrink: 0; display: grid; isolation: isolate;{fitBoxStyle}{style ??
		''}"
	data-ramka-media=""
>
	{@render children?.()}
</div>
