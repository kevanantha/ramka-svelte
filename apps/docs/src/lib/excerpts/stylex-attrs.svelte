<!-- @docs-excerpt-title StyleX on every part -->
<script lang="ts">
	import * as stylex from '@stylexjs/stylex';
	import * as Lightbox from 'ramka-svelte/lightbox';

	const styles = stylex.create({
		backdrop: { position: 'fixed', inset: 0, backgroundColor: 'black' },
		content: { position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' },
		slides: { flex: '1 1 0%', minHeight: 0 },
		slide: { flex: '0 0 100%', minWidth: '100%', height: '100%' },
		media: { borderRadius: 12, overflow: 'hidden' }
	});
</script>

<Lightbox.Root>
	<Lightbox.Portal>
		<Lightbox.Backdrop {...stylex.attrs(styles.backdrop)} />
		<Lightbox.Content aria-label="Photo viewer" {...stylex.attrs(styles.content)}>
			<Lightbox.Slides {...stylex.attrs(styles.slides)}>
				<!-- Mixing in a global class: pass both to `class`. -->
				<Lightbox.Slide class={['my-slide', stylex.attrs(styles.slide).class]}>
					<Lightbox.Item index={0}>
						<Lightbox.Zoom>
							<Lightbox.Media width={1600} height={1067} {...stylex.attrs(styles.media)}>
								<img src="/photo.jpg" alt="" />
							</Lightbox.Media>
						</Lightbox.Zoom>
					</Lightbox.Item>
				</Lightbox.Slide>
			</Lightbox.Slides>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
