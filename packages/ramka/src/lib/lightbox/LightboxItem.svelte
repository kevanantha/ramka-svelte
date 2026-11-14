<script lang="ts" module>
	import { createContext, type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { LightboxCaptionContent } from './lightbox-state.svelte';

	/** Values handed to an item's `children` snippet. */
	export interface LightboxItemRenderState {
		/** Whether this item is the active slide. */
		active: boolean;
		/** Whether this item is within the preload window (rendered). */
		visible: boolean;
		index: number;
		/**
		 * `{@attach image}` on the destination `<img>`. Until it loads, the
		 * opening trigger's decoded thumbnail is painted behind it. Prefer
		 * wrapping media in `Lightbox.Media`, which wires this for you.
		 */
		image: Attachment<HTMLImageElement>;
		/** Optional. `{@attach morph}` to override what morphs. */
		morph: Attachment<HTMLElement>;
	}

	/** Published by each Item for `Lightbox.Media` and nested wrappers. */
	export interface LightboxItemContext {
		readonly index: number;
		readonly active: boolean;
		/** The same attachments the `children` snippet receives. */
		readonly image: Attachment<HTMLImageElement>;
		readonly morph: Attachment<HTMLElement>;
		/** Set by `Lightbox.Media`: the default morph target and placeholder host. */
		media: HTMLElement | null;
		/** Whether the trigger thumbnail is painted on `media` (its `data-placeholder`). */
		readonly mediaPlaceholder: boolean;
	}

	export interface LightboxItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		/** The index of this item in the collection. */
		index: number;
		/** Caption shown by `Lightbox.Caption` while this item is active. */
		caption?: LightboxCaptionContent;
		children?: Snippet<[LightboxItemRenderState]>;
		ref?: HTMLDivElement | null;
	}

	const [getItemContext, setItemContext, hasItemContext] = createContext<LightboxItemContext>();

	/** The enclosing Item's context, or `undefined` outside an Item. */
	export function getLightboxItemContext(): LightboxItemContext | undefined {
		return hasItemContext() ? getItemContext() : undefined;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { BROWSER, DEV } from 'esm-env';
	import { getLightboxContext } from './lightbox-state.svelte';
	import { getSlidesPreload } from './LightboxSlides.svelte';
	import { tryPaintCanvasPlaceholder } from './lightbox-placeholder';
	import { accessibleNameWarning } from './accessible-name-warning';

	let {
		index,
		caption,
		children,
		ref = $bindable(null),
		style,
		...rest
	}: LightboxItemProps = $props();

	const lightbox = getLightboxContext();
	const slides = getSlidesPreload();

	const active = $derived(index === lightbox.activeIndex);
	/** Inside Slides, only the active item ± `preload` neighbors render. */
	const visible = $derived.by(() => {
		const linear = Math.abs(index - lightbox.activeIndex);
		const count = lightbox.itemCount;
		const distance = lightbox.loop && count > 0 ? Math.min(linear, count - linear) : linear;
		return distance <= slides.preload;
	});

	let imageNode = $state.raw<HTMLImageElement | null>(null);
	let morphNode = $state.raw<HTMLElement | null>(null);
	let mediaNode = $state.raw<HTMLElement | null>(null);
	let mediaPlaceholder = $state(false);
	let warned = false;

	// Morph target precedence: explicit `morph` → Media → the image.
	$effect(() => {
		const container = ref;
		if (!container) return;
		const node = morphNode ?? mediaNode ?? imageNode;
		if (node) lightbox.itemMorphElements.set(container, node);
		else lightbox.itemMorphElements.delete(container);
		return () => lightbox.itemMorphElements.delete(container);
	});

	const image: Attachment<HTMLImageElement> = (node) => {
		imageNode = node;
		return () => {
			if (imageNode === node) imageNode = null;
		};
	};
	const morph: Attachment<HTMLElement> = (node) => {
		morphNode = node;
		return () => {
			if (morphNode === node) morphNode = null;
		};
	};

	setItemContext({
		get index() {
			return index;
		},
		get active() {
			return active;
		},
		image,
		morph,
		get media() {
			return mediaNode;
		},
		set media(node) {
			mediaNode = node;
		},
		get mediaPlaceholder() {
			return mediaPlaceholder;
		}
	});

	// Publish the active item for the morph engine (inside the open's flushSync).
	$effect(() => {
		if (active && ref) lightbox.activeItemElement = ref;
	});

	$effect(() => lightbox.registerItem());

	$effect(() => {
		if (caption !== undefined) return lightbox.registerCaption(index, caption);
	});

	// Placeholder bridge: until the destination image paints, draw the opening
	// trigger's already-decoded thumbnail behind it (canvas on Media / `morph`,
	// else a CSS background on the img). Held until the open morph settles.
	let restorePlaceholder: (() => void) | null = null;
	let imagePainted = $state(false);

	$effect(() => {
		if (!visible) return;
		return untrack(paintPlaceholder);
	});

	// Clear once the image has painted AND the open transition is over —
	// clearing mid-morph flashes on iOS Safari.
	$effect(() => {
		if (imagePainted && !lightbox.openTransitionPending) clearPlaceholder();
	});

	function clearPlaceholder() {
		restorePlaceholder?.();
		restorePlaceholder = null;
	}

	function paintPlaceholder(): (() => void) | undefined {
		const img = imageNode;
		if (!img) return;
		if (img.complete && img.naturalWidth > 0) return;

		const clicked = lightbox.openingTriggerIndex === index ? lightbox.openingTriggerImage : null;
		const source = clicked ?? lightbox.triggerImageElements.get(index) ?? null;
		const src = source?.currentSrc ?? '';

		if (!src) {
			if (DEV && !warned) {
				const triggerRoot =
					(lightbox.openingTriggerIndex === index ? lightbox.openingTriggerElement : null) ??
					lightbox.triggerElements.get(index);
				if (triggerRoot?.querySelector('img') && !lightbox.triggerImageElements.has(index)) {
					warned = true;
					console.warn(
						`[ramka] Lightbox.Item index=${index}: image not yet loaded and no placeholder ` +
							'source found, so the open transition may flash a blank frame. Attach ' +
							"`image` on Lightbox.Trigger's <img> (via its children snippet) to bridge it."
					);
				}
			}
			return;
		}

		const cs = getComputedStyle(img);
		const fit = cs.objectFit === 'contain' ? 'contain' : 'cover';
		const canvasHost = morphNode ?? mediaNode;
		const canvasRestore =
			canvasHost && canvasHost !== img
				? tryPaintCanvasPlaceholder({
						img,
						source,
						fit,
						objectPosition: cs.objectPosition,
						host: canvasHost
					})
				: null;

		if (canvasRestore) {
			const onMedia = canvasHost === mediaNode;
			if (onMedia) mediaPlaceholder = true;
			restorePlaceholder = () => {
				canvasRestore();
				if (onMedia) mediaPlaceholder = false;
			};
		} else {
			const saved = {
				image: img.style.backgroundImage,
				size: img.style.backgroundSize,
				position: img.style.backgroundPosition,
				repeat: img.style.backgroundRepeat
			};
			restorePlaceholder = () => {
				img.style.backgroundImage = saved.image;
				img.style.backgroundSize = saved.size;
				img.style.backgroundPosition = saved.position;
				img.style.backgroundRepeat = saved.repeat;
			};
			img.style.backgroundImage = `url("${src}")`;
			const boxW = img.clientWidth;
			const boxH = img.clientHeight;
			const natW = source?.naturalWidth ?? 0;
			const natH = source?.naturalHeight ?? 0;
			if (boxW > 0 && boxH > 0 && natW > 0 && natH > 0) {
				const scale =
					fit === 'contain'
						? Math.min(boxW / natW, boxH / natH)
						: Math.max(boxW / natW, boxH / natH);
				img.style.backgroundSize = `${natW * scale}px ${natH * scale}px`;
			} else {
				img.style.backgroundSize = fit;
			}
			img.style.backgroundPosition = cs.objectPosition || 'center';
			img.style.backgroundRepeat = 'no-repeat';
		}

		// "Painted" = load → decode → two frames.
		imagePainted = false;
		let live = true;
		let rafA = 0;
		let rafB = 0;
		const onLoad = () => {
			const schedule = () => {
				if (!live) return;
				rafA = requestAnimationFrame(() => {
					rafB = requestAnimationFrame(() => (imagePainted = true));
				});
			};
			if (typeof img.decode === 'function') img.decode().then(schedule, schedule);
			else schedule();
		};
		img.addEventListener('load', onLoad, { once: true });

		return () => {
			live = false;
			img.removeEventListener('load', onLoad);
			cancelAnimationFrame(rafA);
			cancelAnimationFrame(rafB);
			imagePainted = false;
			clearPlaceholder();
		};
	}

	// Inactive items are `aria-hidden`, which the check skips, so a gallery
	// nudges for the slide on screen rather than once per slide.
	const nameWarning = accessibleNameWarning('Lightbox.Item', {
		namedByContent: false,
		hint:
			'A slide is a `group`, so its caption does not name it — pass `aria-label` ' +
			'carrying the position (the APG carousel pattern puts it in the name, e.g. ' +
			'`${i + 1} of ${photos.length}` in your own wording).'
	});

	const semantics = $derived(
		lightbox.hasTablist
			? { role: 'tabpanel', 'aria-labelledby': `${lightbox.baseId}-tab-${index}` }
			: { role: 'group' }
	);
</script>

{#if visible}
	<div
		bind:this={ref}
		{@attach nameWarning}
		id="{lightbox.baseId}-panel-{index}"
		{...semantics}
		aria-hidden={!active}
		inert={!active || undefined}
		data-active={active ? '' : undefined}
		data-index={index}
		data-ssr-active={!BROWSER && active ? '' : undefined}
		{...rest}
		style="width: 100%; height: 100%;{active ? ' will-change: transform;' : ''}{style ?? ''}"
		data-ramka-item=""
	>
		{@render children?.({ active, visible, index, image, morph })}
	</div>
{/if}
