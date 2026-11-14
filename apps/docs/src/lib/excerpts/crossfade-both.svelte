<!-- @docs-excerpt-title crossfade="both" -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	let { photo, extras }: { photo: string; extras: number } = $props(); // @docs-hide
</script>

<Lightbox.Root morphTo="closest">
	<Lightbox.Trigger index={0} crossfade="both">
		{#snippet children({ image })}
			<div class="relative">
				<img {@attach image} src={photo} alt="" />
				<span>+{extras}</span>
			</div>
		{/snippet}
	</Lightbox.Trigger>
	<Lightbox.Portal>
		<Lightbox.Backdrop />
		<Lightbox.Content>
			<Lightbox.Slides>
				<Lightbox.Slide>
					<Lightbox.Item index={0}>
						{#snippet children({ image })}
							<img {@attach image} src={photo} alt="" sizes="100vw" fetchpriority="high" />
						{/snippet}
					</Lightbox.Item>
				</Lightbox.Slide>
			</Lightbox.Slides>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
