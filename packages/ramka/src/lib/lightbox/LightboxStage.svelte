<script lang="ts" module>
	import { createContext, type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLAttributes } from 'svelte/elements';

	/**
	 * Values handed to Stage's `children` snippet. Attaching `morph` is how a
	 * consumer designates a **shared** View Transition destination (the 9:16
	 * frame, the slides track, a custom bezel) instead of the active item.
	 */
	export interface LightboxStageRenderState {
		/**
		 * `{@attach morph}` on the element that should morph on open/close. While
		 * attached, it is the capture destination for every item — Item `morph`
		 * / Media still own decode and the placeholder. Unattached, Stage is only
		 * the interaction surface (default).
		 */
		morph: Attachment<HTMLElement>;
	}

	export interface LightboxStageProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		/**
		 * Content; the snippet receives `morph`. Attach it to morph the Stage
		 * surface (or a descendant) instead of the active item.
		 */
		children?: Snippet<[LightboxStageRenderState]>;
		ref?: HTMLDivElement | null;
	}

	const [getStageContext, setStageContext, hasStageContext] =
		createContext<LightboxStageRenderState>();

	/**
	 * The enclosing Stage's render state (`{ morph }`), so a nested wrapper can
	 * attach `morph` without threading the snippet; `undefined` outside a Stage.
	 */
	export function getLightboxStageContext(): LightboxStageRenderState | undefined {
		return hasStageContext() ? getStageContext() : undefined;
	}
</script>

<!--
  Optional media interaction surface inside `Lightbox.Content`. When present,
  Stage hosts:
    - touch and trackpad wheel pull-to-dismiss (events whose target is outside
      Stage are ignored)
    - Zoom pan bounds and wheel / Safari pinch (instead of the whole dialog)
    - Arrow / Home / End navigation and `+` `-` `0` zoom, while focus is inside
      Stage (or on Content itself)
  Content stays the dialog shell (focus trap, Escape). Side panels and other
  app chrome sit beside Stage under Content so they keep native scroll and
  their own keys. Without Stage, Content is the stage.

    <Lightbox.Content aria-label="Post">
      <Lightbox.Stage class="media-pane">
        <Lightbox.Slides>…</Lightbox.Slides>
      </Lightbox.Stage>
      <aside>…thread…</aside>
    </Lightbox.Content>
-->
<script lang="ts">
	import { getLightboxContext } from './lightbox-state.svelte';

	let { ref = $bindable(null), children, ...rest }: LightboxStageProps = $props();

	const lightbox = getLightboxContext();

	const stage: Attachment<HTMLElement> = (node) => {
		lightbox.stageElement = node;
		return () => {
			if (lightbox.stageElement === node) lightbox.stageElement = null;
		};
	};

	const morph: Attachment<HTMLElement> = (node) => {
		lightbox.destinationMorphElement = node;
		return () => {
			if (lightbox.destinationMorphElement === node) lightbox.destinationMorphElement = null;
		};
	};

	const renderState: LightboxStageRenderState = { morph };
	setStageContext(renderState);
</script>

<div bind:this={ref} {...rest} data-ramka-stage="" {@attach stage}>
	{@render children?.(renderState)}
</div>
