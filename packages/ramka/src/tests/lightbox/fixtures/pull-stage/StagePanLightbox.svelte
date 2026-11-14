<!-- Tree of "reads Stage getBoundingClientRect for pan geometry when Stage is mounted". -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';
	import ZoomCapture, { type ZoomRef } from './ZoomCapture.svelte';

	let { zoomRef }: { zoomRef: ZoomRef } = $props();
</script>

<Lightbox.Root open>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Stage pan test">
			<Lightbox.Stage data-testid="stage">
				<SlidesHost>
					{#snippet children()}
						<Lightbox.Item index={0}>
							<Lightbox.Zoom maxZoom={4}>
								<ZoomCapture {zoomRef} />
								<Lightbox.Media width={400} height={300}>
									<img src="test.jpg" alt="test" width={400} height={300} />
								</Lightbox.Media>
							</Lightbox.Zoom>
						</Lightbox.Item>
					{/snippet}
				</SlidesHost>
			</Lightbox.Stage>
			<aside data-testid="sidebar">Thread</aside>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
