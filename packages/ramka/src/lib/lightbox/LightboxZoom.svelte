<script lang="ts" module>
	import { createContext, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	/** Zoom state, for the `children` snippet and `getLightboxZoomContext()`. */
	export interface LightboxZoomState {
		readonly zoom: number;
		readonly maxZoom: number;
		readonly offsetX: number;
		readonly offsetY: number;
		readonly canZoomIn: boolean;
		readonly canZoomOut: boolean;
		/** Whether the content is being panned with a pointer. */
		readonly dragging: boolean;
	}

	/**
	 * Imperative handle from `bind:this` on Zoom (ramka's `LightboxZoomRef`).
	 * Unlike the context's committed state, `getPose()` is live, mid-gesture
	 * and mid-animation.
	 */
	export interface LightboxZoomRef {
		/** Current zoom level and pan offsets. */
		getPose(): { zoom: number; offsetX: number; offsetY: number };
		/** Step zoom in by zoomStep. */
		zoomIn(): void;
		/** Step zoom out by zoomStep. */
		zoomOut(): void;
		/** Zoom to an absolute level, optionally recentering. */
		zoomTo(target: number, options?: { rapid?: boolean; dx?: number; dy?: number }): void;
		/** Reset zoom and pan to the resting state; `true` skips the animation. */
		reset(rapid?: boolean): void;
	}

	/** State plus actions, published to descendants (e.g. a ZoomIn inside a slide). */
	export interface LightboxZoomContext extends LightboxZoomState {
		zoomIn(): void;
		zoomOut(): void;
		/** Zoom to an exact level, optionally anchored at (dx, dy) from center. */
		zoomTo(target: number, options?: { rapid?: boolean; dx?: number; dy?: number }): void;
		/** Back to `minZoom`; `true` skips the animation. */
		reset(rapid?: boolean): void;
		/**
		 * Pan by content-space px (positive moves the content left/up).
		 * `overscroll` lets the pan run past the bounds on the rubber band, and
		 * `overflowAxesOnly` limits that to the axes the content overflows.
		 */
		changeOffsets(dx: number, dy: number, overscroll?: boolean, overflowAxesOnly?: boolean): void;
	}

	/**
	 * Headless zoom/pan surface: pinch, double-tap/click, ctrl/trackpad wheel,
	 * drag to pan with momentum, and keyboard (through `Lightbox.Content`).
	 * Fills its host and is the size container `Lightbox.Media`'s fit-box
	 * resolves against. It sets no `overflow`: clip on Content or your chrome
	 * so zoomed media can paint outside the resting box.
	 *
	 * State is exposed as `data-zoom` (zoom > 1) and `data-dragging`. The zoom
	 * engine is a separate chunk, loaded when Zoom first mounts (or on trigger
	 * intent); until it arrives the media renders at rest.
	 */
	export interface LightboxZoomProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		/** Zoomable content; the snippet receives the zoom state. */
		children?: Snippet<[LightboxZoomState]>;
		/** Minimum zoom. @default 1 */
		minZoom?: number;
		/**
		 * Maximum zoom. Omitted: from the first `<img>`'s natural size vs. the
		 * container (at least `minZoom + 1`), else 4.
		 */
		maxZoom?: number;
		/** Multiplier for button/keyboard/double-tap steps. @default 2 */
		zoomStep?: number;
		/** Zoom on bare wheel/trackpad scroll, without Ctrl. @default false */
		scrollToZoom?: boolean;
		/** Wheel/trackpad zoom sensitivity. @default 100 */
		wheelSensitivity?: number;
		/** Keyboard pan distance per press, in content px. @default 50 */
		keyboardPanDistance?: number;
		/** Max gap between clicks/taps for a double (ms). @default 300 */
		doubleClickDelay?: number;
		/** Called when the committed zoom level changes. */
		onZoomChange?: (zoom: number) => void;
		/** Bindable reference to the zoom element. */
		ref?: HTMLDivElement | null;
	}

	const [getZoomContext, setZoomContext, hasZoomContext] = createContext<LightboxZoomContext>();

	/** The enclosing `Lightbox.Zoom`, or `undefined` outside one. */
	export function getLightboxZoomContext(): LightboxZoomContext | undefined {
		return hasZoomContext() ? getZoomContext() : undefined;
	}
</script>

<script lang="ts">
	import { DEV } from 'esm-env';
	import { getLightboxContext } from './lightbox-state.svelte';
	import { getLightboxItemContext } from './LightboxItem.svelte';
	import { getZoomRuntimeSync, loadZoomRuntime } from './lightbox-zoom-loader';
	import type { ZoomEngine, ZoomEngineOptions } from './zoom-engine.svelte';

	let {
		children,
		minZoom = 1,
		maxZoom: maxZoomProp,
		zoomStep = 2,
		scrollToZoom = false,
		wheelSensitivity = 100,
		keyboardPanDistance = 50,
		doubleClickDelay = 300,
		onZoomChange,
		ref = $bindable(null),
		style,
		...rest
	}: LightboxZoomProps = $props();

	const lightbox = getLightboxContext();
	const item = getLightboxItemContext();
	// Outside an Item (a standalone zoom surface), treat it as active.
	const isActive = $derived(item ? item.active : true);

	let wrapper = $state<HTMLDivElement | null>(null);
	let engine = $state.raw<ZoomEngine | null>(null);

	const options = $derived<ZoomEngineOptions>({
		minZoom,
		maxZoom: maxZoomProp,
		zoomStep,
		scrollToZoom,
		wheelSensitivity,
		keyboardPanDistance,
		doubleClickDelay,
		onZoomChange
	});

	// Load the engine and attach it to the nodes rendered below. The engine
	// renders nothing, so it can arrive at any time without remounting the
	// consumer's image (or the placeholder canvas Item painted beside it).
	$effect(() => {
		const container = ref;
		const host = wrapper;
		if (!container || !host) return;
		let instance: ZoomEngine | null = null;
		let cancelled = false;
		const start = (runtime: NonNullable<ReturnType<typeof getZoomRuntimeSync>>) => {
			if (cancelled) return;
			instance = runtime.createZoomEngine({
				container,
				wrapper: host,
				lightbox,
				isActive: () => isActive,
				options: () => options
			});
			engine = instance;
		};
		const runtime = getZoomRuntimeSync();
		if (runtime) start(runtime);
		else
			loadZoomRuntime().then(start, (error: unknown) => {
				// The image still renders and the lightbox still works, just
				// without gestures.
				if (DEV) console.warn('Lightbox.Zoom: the zoom runtime failed to load.', error);
			});
		return () => {
			cancelled = true;
			instance?.destroy();
			if (engine === instance) engine = null;
		};
	});

	const zoom = $derived(engine?.zoom ?? minZoom);
	const maxZoom = $derived(engine?.maxZoom ?? maxZoomProp ?? 4);
	const dragging = $derived(engine?.dragging ?? false);
	const animating = $derived(engine?.animating ?? false);

	const zoomContext: LightboxZoomContext = {
		get zoom() {
			return zoom;
		},
		get maxZoom() {
			return maxZoom;
		},
		get offsetX() {
			return engine?.offsetX ?? 0;
		},
		get offsetY() {
			return engine?.offsetY ?? 0;
		},
		get canZoomIn() {
			return zoom < maxZoom;
		},
		get canZoomOut() {
			return zoom > minZoom;
		},
		get dragging() {
			return dragging;
		},
		zoomIn: () => engine?.zoomIn(),
		zoomOut: () => engine?.zoomOut(),
		zoomTo: (target, opts) => engine?.zoomTo(target, opts),
		reset: (rapid) => engine?.reset(rapid),
		changeOffsets: (...args) => engine?.changeOffsets(...args)
	};
	setZoomContext(zoomContext);

	// Imperative handle, ramka's `LightboxZoomRef`, through `bind:this`. Unlike
	// the context's committed state, `getPose()` is live: mid-gesture and
	// mid-animation.
	export function getPose(): { zoom: number; offsetX: number; offsetY: number } {
		return engine?.getPose() ?? { zoom: minZoom, offsetX: 0, offsetY: 0 };
	}
	export function zoomIn(): void {
		engine?.zoomIn();
	}
	export function zoomOut(): void {
		engine?.zoomOut();
	}
	export function zoomTo(
		target: number,
		options?: { rapid?: boolean; dx?: number; dy?: number }
	): void {
		engine?.zoomTo(target, options);
	}
	export function reset(rapid?: boolean): void {
		engine?.reset(rapid);
	}

	const hostStyle = $derived(
		'position: relative; width: 100%; height: 100%; container-type: size; ' +
			'user-select: none; -webkit-user-select: none; ' +
			`touch-action: ${zoom > minZoom ? 'none' : 'pan-x pan-y'};` +
			(dragging ? ' cursor: grabbing;' : zoom > 1 ? ' cursor: grab;' : '') +
			(style ?? '')
	);
	// Promoted for the whole time the slide is active, not only mid-gesture:
	// promoting/demoting at gesture boundaries shows rasterization seams.
	const wrapperStyle = $derived(
		'width: 100%; height: 100%; display: flex; align-items: center; ' +
			'justify-content: center; transform-origin: center center;' +
			(isActive || zoom > 1 || animating ? ' will-change: transform;' : '')
	);
</script>

<div
	bind:this={ref}
	data-zoom={zoom > 1 ? '' : undefined}
	data-dragging={dragging ? '' : undefined}
	{...rest}
	style={hostStyle}
	data-ramka-zoom=""
>
	<div bind:this={wrapper} style={wrapperStyle}>
		{@render children?.(zoomContext)}
	</div>
</div>
