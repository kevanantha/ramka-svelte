/**
 * The zoom engine — behaviour only, in the lazily loaded zoom chunk.
 *
 * `Lightbox.Zoom` owns the host element, the transform wrapper and the
 * children for its whole life and hands the nodes in here. The engine only
 * attaches to them (gestures, pose transform, Content chrome) and exposes its
 * pose as reactive fields, so a chunk that lands mid-open never remounts the
 * consumer's `<img>` or the placeholder canvas `Lightbox.Item` put beside it.
 */
import { untrack } from 'svelte';

import { clampOffsetToViewport, computeMaxZoom, panOffsetRange } from './gesture-math';
import type { ActiveZoomControls, LightboxState } from './lightbox-state.svelte';
import { PoseController, type ZoomPose } from './pose-controller';
import { bindZoomChrome } from './zoom-chrome';
import { createZoomGestures } from './zoom-gestures';
import { createZoomSession, type StageLayout, type ZoomSession } from './zoom-session';

const DEFAULT_MAX_ZOOM_FALLBACK = 4;
const DEFAULT_ANIMATION_DURATION = 300;

/** The controls each lightbox currently publishes as `activeZoom`. */
const publishedZoom = new WeakMap<LightboxState, ActiveZoomControls>();

/** Zoom's behavioural props, resolved (defaults applied) by the component. */
export interface ZoomEngineOptions {
	minZoom: number;
	/** `undefined` → derived from the image's natural size vs. the container. */
	maxZoom: number | undefined;
	zoomStep: number;
	scrollToZoom: boolean;
	wheelSensitivity: number;
	keyboardPanDistance: number;
	doubleClickDelay: number;
	onZoomChange: ((zoom: number) => void) | undefined;
}

export interface ZoomEngineHost {
	/** The Zoom surface (pointer target, size container). */
	container: HTMLElement;
	/** The transform wrapper the pose is written to. */
	wrapper: HTMLElement;
	lightbox: LightboxState;
	/** Whether the owning slide is the active one (live). */
	isActive: () => boolean;
	/** Current options (live). */
	options: () => ZoomEngineOptions;
}

export class ZoomEngine {
	/** Committed pose: what renders and what data attributes reflect. */
	zoom = $state(1);
	offsetX = $state(0);
	offsetY = $state(0);
	/** A pointer is panning. */
	dragging = $state(false);
	/** A settle or discrete zoom animation is running. */
	animating = $state(false);

	#imageSize = $state.raw<{ w: number; h: number } | null>(null);
	#containerSize = $state.raw<{ w: number; h: number } | null>(null);

	/** Resolved maximum zoom (the prop, else from the image's natural size). */
	maxZoom = $derived.by(() => {
		const { maxZoom, minZoom } = this.#host.options();
		if (maxZoom !== undefined) return maxZoom;
		const image = this.#imageSize;
		const box = this.#containerSize;
		if (!image || !box) return DEFAULT_MAX_ZOOM_FALLBACK;
		return computeMaxZoom(image.w, image.h, box.w, box.h, minZoom, DEFAULT_MAX_ZOOM_FALLBACK);
	});

	readonly #host: ZoomEngineHost;
	readonly #controller: PoseController;
	readonly #session: ZoomSession;
	readonly #destroyEffects: () => void;
	readonly #unsubscribeCommit: () => void;
	/** Frame-scoped layout cache (cleared next frame, on resize, on gesture start). */
	#layout: StageLayout | null = null;
	#layoutRaf = 0;

	constructor(host: ZoomEngineHost) {
		this.#host = host;
		const { minZoom } = untrack(host.options);
		const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

		// The controller is the sole writer of the wrapper's `style.transform`.
		this.#controller = new PoseController(
			{ zoom: minZoom, offsetX: 0, offsetY: 0 },
			{ reducedMotion, defaultDiscreteDuration: DEFAULT_ANIMATION_DURATION }
		);
		this.#controller.attach(host.wrapper);
		this.zoom = minZoom;
		this.#unsubscribeCommit = this.#controller.subscribeCommit(this.#syncPose);

		// Read at event time (never inside an effect), so options stay live.
		this.#session = createZoomSession(() => {
			const options = host.options();
			return {
				controller: this.#controller,
				measureStageLayout: this.#measureStageLayout,
				measurePanGeometry: this.#measurePanGeometry,
				clampOffsets: this.#clampOffsets,
				minZoom: options.minZoom,
				maxZoom: this.maxZoom,
				zoomStep: options.zoomStep,
				reducedMotion,
				isDragging: () => this.dragging,
				setDraggingUi: (value) => (this.dragging = value),
				invalidateLayoutCache: this.#invalidateLayout
			};
		});

		this.#destroyEffects = $effect.root(() => this.#connect());
	}

	/** Live pose, including mid-animation. */
	getPose(): ZoomPose {
		return this.#controller.getPose();
	}

	zoomIn = () => this.#session.zoomIn();
	zoomOut = () => this.#session.zoomOut();
	zoomTo = (target: number, options?: { rapid?: boolean; dx?: number; dy?: number }) =>
		this.#session.changeZoom(target, options?.rapid ?? false, options?.dx, options?.dy);
	reset = (rapid?: boolean) => this.#session.reset(rapid);
	changeOffsets = (dx: number, dy: number) => this.#session.changeOffsets(dx, dy);

	destroy(): void {
		this.#destroyEffects();
		this.#unsubscribeCommit();
		this.#session.dispose();
		cancelAnimationFrame(this.#layoutRaf);
		window.removeEventListener('resize', this.#invalidateLayout);
		this.#controller.attach(null);
	}

	#syncPose = () => {
		const snapshot = this.#controller.getSnapshot();
		this.zoom = snapshot.zoom;
		this.offsetX = snapshot.offsetX;
		this.offsetY = snapshot.offsetY;
		this.animating = snapshot.phase !== 'idle';
	};

	#connect() {
		const host = this.#host;
		const { lightbox } = host;
		window.addEventListener('resize', this.#invalidateLayout);

		// A new active slide starts at rest.
		$effect(() => {
			void lightbox.activeIndex;
			const { minZoom } = host.options();
			untrack(() => {
				this.#session.dispose();
				this.#controller.replacePose({ zoom: minZoom, offsetX: 0, offsetY: 0 });
				this.#syncPose();
				this.#imageSize = null;
			});
		});

		// Container size and the image's natural size, for the automatic maxZoom.
		$effect(() => {
			if (host.options().maxZoom !== undefined) return;
			const el = host.container;
			const measure = () => {
				const rect = el.getBoundingClientRect();
				const prev = this.#containerSize;
				if (prev?.w !== rect.width || prev?.h !== rect.height) {
					this.#containerSize = { w: rect.width, h: rect.height };
				}
			};
			measure();
			const observer = new ResizeObserver(measure);
			observer.observe(el);
			return () => observer.disconnect();
		});

		$effect(() => {
			void lightbox.activeIndex;
			if (host.options().maxZoom !== undefined) return;
			const wrapper = host.wrapper;
			const detect = () => {
				const img = wrapper.querySelector('img');
				if (img && img.naturalWidth > 0) {
					const prev = this.#imageSize;
					if (prev?.w !== img.naturalWidth || prev?.h !== img.naturalHeight) {
						this.#imageSize = { w: img.naturalWidth, h: img.naturalHeight };
					}
				}
			};
			untrack(detect);
			// `load` doesn't bubble; capture catches every image inside.
			wrapper.addEventListener('load', detect, true);
			const observer = new MutationObserver(detect);
			observer.observe(wrapper, { childList: true, subtree: true });
			return () => {
				wrapper.removeEventListener('load', detect, true);
				observer.disconnect();
			};
		});

		$effect(() => {
			const zoom = this.zoom;
			untrack(() => host.options().onZoomChange?.(zoom));
		});

		// Content chrome: `data-zoomed` + `--lightbox-zoom-progress`.
		$effect(() => {
			const { minZoom } = host.options();
			return bindZoomChrome({
				controller: this.#controller,
				dialogElement: lightbox.dialogElement,
				wrapperElement: host.wrapper,
				minZoom,
				maxZoom: this.maxZoom,
				isActive: host.isActive()
			});
		});

		// Gestures, on the active slide only. Wheel / Safari pinch attach to
		// Content, so they wait for it to mount.
		$effect(() => {
			if (!host.isActive()) return;
			const content = lightbox.dialogElement;
			const gestures = untrack(() =>
				createZoomGestures({
					container: host.container,
					wrapper: host.wrapper,
					config: () => {
						const options = host.options();
						return {
							minZoom: options.minZoom,
							maxZoom: this.maxZoom,
							zoomStep: options.zoomStep,
							scrollToZoom: options.scrollToZoom,
							wheelSensitivity: options.wheelSensitivity,
							keyboardPanDistance: options.keyboardPanDistance,
							doubleClickDelay: options.doubleClickDelay
						};
					},
					actions: this.#session.actions,
					contentElement: () => content,
					stageElement: () => null,
					isScrolling: () => lightbox.navigationLocked
				})
			);
			$effect(() => gestures.syncWheel(this.zoom));
			return gestures.destroy;
		});

		// Publish to controls above the slides while this slide is active.
		// The ownership check reads the plain `publishedZoom` map: a teardown
		// that reads `activeZoom` sees its value from before this update, so
		// navigating back would let the old slide clear the new one's controls.
		$effect(() => {
			if (!host.isActive()) return;
			const controls = this.#activeControls();
			publishedZoom.set(lightbox, controls);
			lightbox.activeZoom = controls;
			return () => {
				if (publishedZoom.get(lightbox) !== controls) return;
				publishedZoom.delete(lightbox);
				lightbox.activeZoom = null;
			};
		});
	}

	#activeControls(): ActiveZoomControls {
		const engine = this;
		const session = this.#session;
		return {
			get canZoomIn() {
				return engine.zoom < engine.maxZoom;
			},
			get canZoomOut() {
				return engine.zoom > engine.#host.options().minZoom;
			},
			zoomIn: session.zoomIn,
			zoomOut: session.zoomOut,
			reset: (rapid) => session.reset(rapid),
			panBy: (dx, dy) => session.panStep(dx, dy),
			get keyboardPanDistance() {
				return engine.#host.options().keyboardPanDistance;
			},
			getZoom: session.getLiveZoom
		};
	}

	// ── Layout ───────────────────────────────────────────────────────────

	#invalidateLayout = () => {
		this.#layout = null;
	};

	/** Content size: Media's box, else the image's, else the container's. */
	#contentSize(fallback: DOMRect): { w: number; h: number } {
		const wrapper = this.#host.wrapper;
		const media = wrapper.querySelector('[data-ramka-media]');
		if (media instanceof HTMLElement && media.offsetWidth > 0) {
			return { w: media.offsetWidth, h: media.offsetHeight };
		}
		const img = wrapper.querySelector('img');
		if (img && img.offsetWidth > 0) return { w: img.offsetWidth, h: img.offsetHeight };
		return { w: fallback.width, h: fallback.height };
	}

	#measureStageLayout = (): StageLayout | null => {
		if (this.#layout) return this.#layout;
		const stage = this.#host.container.getBoundingClientRect();
		// Panning is bounded by Content (Stage is not ported yet).
		const viewport = this.#host.lightbox.dialogElement?.getBoundingClientRect() ?? stage;
		const { w: contentW, h: contentH } = this.#contentSize(stage);
		this.#layout = { stage, viewport, contentW, contentH };
		if (!this.#layoutRaf) {
			this.#layoutRaf = requestAnimationFrame(() => {
				this.#layoutRaf = 0;
				this.#layout = null;
			});
		}
		return this.#layout;
	};

	#measurePanGeometry = (zoom: number) => {
		const layout = this.#measureStageLayout();
		if (!layout) return null;
		const { stage, viewport, contentW, contentH } = layout;
		const { minZoom } = this.#host.options();
		const cx = stage.left + stage.width / 2;
		const cy = stage.top + stage.height / 2;
		return {
			...layout,
			x: panOffsetRange(contentW, zoom, viewport.left, viewport.right, cx, minZoom),
			y: panOffsetRange(contentH, zoom, viewport.top, viewport.bottom, cy, minZoom)
		};
	};

	#clampOffsets = (x: number, y: number, zoom: number) => {
		const geometry = this.#measurePanGeometry(zoom);
		if (!geometry) return { x: 0, y: 0 };
		return clampOffsetToViewport(
			x,
			y,
			geometry.contentW,
			geometry.contentH,
			zoom,
			geometry.viewport,
			geometry.stage,
			this.#host.options().minZoom
		);
	};
}
