<!-- ramka's `WiredPullLightbox` (touch gate: letterbox / Stage padding). -->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';
</script>

<Lightbox.Root open>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Wired pull test">
			<Lightbox.Stage data-testid="stage">
				<SlidesHost>
					{#snippet children()}
						<Lightbox.Item index={0}>
							{#snippet children({ image })}
								<!-- Empty letterbox beside a contain-fit image — Stage-wide
								     hit target, so this should start a pull. -->
								<div data-testid="letterbox"></div>
								<img {@attach image} data-testid="content-img" src="wired.jpg" alt="wired" />
							{/snippet}
						</Lightbox.Item>
					{/snippet}
				</SlidesHost>
				<div data-testid="no-pull" data-ramka-no-pull="">overlay chrome</div>
			</Lightbox.Stage>
			<aside data-testid="sidebar">Thread</aside>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
