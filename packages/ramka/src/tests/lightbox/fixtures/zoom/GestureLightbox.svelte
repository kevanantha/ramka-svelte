<!--
	Tree of the `native gesture prevention` cases: one image slide, no Zoom.
	`chrome` adds the Close button and the scrollable panel of the
	`touch scroll containment (iOS address bar)` cases.
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';

	let {
		label,
		pullToClose,
		chrome = false
	}: { label: string; pullToClose?: boolean; chrome?: boolean } = $props();
</script>

<Lightbox.Root open>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label={label} {pullToClose}>
			{#if chrome}
				<Lightbox.Close data-testid="close">Close</Lightbox.Close>
				<div data-testid="panel" style="overflow-y: auto">
					<p data-testid="panel-text">scrollable chrome</p>
				</div>
			{/if}
			<SlidesHost>
				{#snippet children()}
					<Lightbox.Item index={0}>
						<img src="test.jpg" alt="test" />
					</Lightbox.Item>
				{/snippet}
			</SlidesHost>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
