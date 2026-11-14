<!--
	The single-item trees of lightbox-placeholder.test.tsx's render-fn suite:
	Trigger(s) at index 0 with a thumbnail, and one Item whose `children`
	snippet attaches `image` (and optionally `morph`) on the destination.

	Trigger kinds:
	- `image`: `<img {@attach image}>` (React: `<img ref={imageRef}>`)
	- `overlay`: the attached `<img>` beside a "+3" overlay
	- `morph`: a `{@attach morph}` wrapper around the attached `<img>`
	- `plain`: an `<img>` with nothing attached (React: plain children)

	Item kinds:
	- `image`: `<img {@attach image}>`
	- `morph`: a `{@attach morph}` wrapper around the attached `<img>`
	- `diy`: a plain wrapper (`data-testid="diy-host"`) around the attached `<img>`
-->
<script lang="ts">
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';

	interface TriggerSpec {
		testid: string;
		src: string;
		alt: string;
		kind?: 'image' | 'overlay' | 'morph' | 'plain';
	}

	let {
		viewTransition,
		triggers = [{ testid: 'trigger', src: '/thumb.jpg', alt: 'thumb' }],
		item = 'image',
		itemClass
	}: {
		viewTransition?: boolean;
		triggers?: TriggerSpec[];
		item?: 'image' | 'morph' | 'diy';
		itemClass?: string;
	} = $props();
</script>

<Lightbox.Root {viewTransition}>
	{#each triggers as trigger (trigger.testid)}
		<Lightbox.Trigger index={0} data-testid={trigger.testid}>
			{#snippet children({ image, morph })}
				{#if trigger.kind === 'plain'}
					<img src={trigger.src} alt={trigger.alt} />
				{:else if trigger.kind === 'overlay'}
					<div class="relative">
						<img {@attach image} src={trigger.src} alt={trigger.alt} />
						<div class="absolute inset-0">+3</div>
					</div>
				{:else if trigger.kind === 'morph'}
					<div {@attach morph} data-testid="trigger-morph">
						<img {@attach image} src={trigger.src} alt={trigger.alt} />
					</div>
				{:else}
					<img {@attach image} src={trigger.src} alt={trigger.alt} />
				{/if}
			{/snippet}
		</Lightbox.Trigger>
	{/each}
	<Lightbox.Portal>
		<Lightbox.Content aria-label="viewer">
			<SlidesHost>
				{#snippet children()}
					<Lightbox.Item index={0}>
						{#snippet children({ image, morph })}
							{#if item === 'morph'}
								<div {@attach morph} data-testid="item-morph">
									<img {@attach image} src="/full.jpg" alt="full" />
								</div>
							{:else if item === 'diy'}
								<div data-testid="diy-host">
									<img {@attach image} src="/full.jpg" alt="full" />
								</div>
							{:else}
								<img {@attach image} src="/full.jpg" alt="full" class={itemClass} />
							{/if}
						{/snippet}
					</Lightbox.Item>
				{/snippet}
			</SlidesHost>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
