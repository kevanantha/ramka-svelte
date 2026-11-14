/**
 * Animated slide removal for the dynamic-items debug page (the original's
 * `use-animated-item-removal.ts`). Marks an item as removing so its slide,
 * thumbnail and page trigger dissolve, then drops it from the list after the
 * exit animation and reconciles the active index.
 */
import { SvelteSet } from 'svelte/reactivity';

/** Matches `--dynamic-item-remove-duration` in dynamic-items.css. */
export const DYNAMIC_ITEM_REMOVE_MS = 380;

export interface DynamicItem {
	id: string;
	src: string;
	thumb: string;
	alt: string;
	caption: string;
	width: number;
	height: number;
}

/** The page state the engine reads and writes, as live getters/setters. */
export interface AnimatedItemRemovalHost {
	items: DynamicItem[];
	activeIndex: number;
	readonly autoRecover: boolean;
}

function itemKey(item: DynamicItem): string {
	return String(item.id ?? item.src);
}

function reconcileActiveIndex(
	activeIndex: number,
	removedIndex: number,
	nextLength: number,
	autoRecover: boolean
): number {
	if (nextLength === 0) return 0;
	if (autoRecover && removedIndex === activeIndex) {
		return Math.min(activeIndex, nextLength - 1);
	}
	if (removedIndex < activeIndex) return activeIndex - 1;
	if (activeIndex >= nextLength) return nextLength - 1;
	return activeIndex;
}

export class AnimatedItemRemoval {
	#host: AnimatedItemRemovalHost;
	#removing = new SvelteSet<string>();
	#timers = new Map<string, number>();

	/** Create during component init: pending removals are dropped on unmount. */
	constructor(host: AnimatedItemRemovalHost) {
		this.#host = host;
		$effect(() => () => this.clearPending());
	}

	isRemoving = (item: DynamicItem) => this.#removing.has(itemKey(item));

	clearPending() {
		for (const timer of this.#timers.values()) window.clearTimeout(timer);
		this.#timers.clear();
		this.#removing.clear();
	}

	removeAt(index: number) {
		const item = this.#host.items[index];
		if (!item) return;
		const key = itemKey(item);
		if (this.#timers.has(key)) return;

		const wasActive = index === this.#host.activeIndex;
		this.#removing.add(key);

		const timer = window.setTimeout(() => {
			this.#timers.delete(key);
			this.#removing.delete(key);
			const host = this.#host;
			// Find it again: the list may have grown or shrunk meanwhile.
			const removeIndex = host.items.findIndex((entry) => itemKey(entry) === key);
			if (removeIndex === -1) return;
			const next = host.items.filter((entry) => itemKey(entry) !== key);
			host.items = next;
			host.activeIndex =
				next.length === 0
					? 0
					: host.autoRecover && wasActive
						? Math.min(removeIndex, next.length - 1)
						: reconcileActiveIndex(host.activeIndex, removeIndex, next.length, host.autoRecover);
		}, DYNAMIC_ITEM_REMOVE_MS);

		this.#timers.set(key, timer);
	}
}
