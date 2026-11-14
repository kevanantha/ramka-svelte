<!--
	use-accessible-name-warning.test.tsx's `Chrome`: an open Root > Portal >
	Content with one control part inside. `text` renders as the part's visible
	content; `label` renders a labelling `<span>` before it. The part's element
	is published through `refBox.current` (React's `ref`).
-->
<script lang="ts">
	import type { Component } from 'svelte';
	import * as Lightbox from '../../../../lib/lightbox';

	let {
		part: Part,
		partProps = {},
		text,
		label,
		refBox
	}: {
		part: Component<Record<string, unknown>>;
		partProps?: Record<string, unknown>;
		text?: string;
		label?: { id: string; text: string };
		refBox?: { current: HTMLElement | null };
	} = $props();

	let ref = $state<HTMLElement | null>(null);
	$effect(() => {
		if (refBox) refBox.current = ref;
	});
</script>

<Lightbox.Root open>
	<Lightbox.Portal>
		<Lightbox.Content aria-label="viewer">
			{#if label}
				<span id={label.id}>{label.text}</span>
			{/if}
			{#if text !== undefined}
				<Part bind:ref {...partProps}>{text}</Part>
			{:else}
				<Part bind:ref {...partProps} />
			{/if}
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
