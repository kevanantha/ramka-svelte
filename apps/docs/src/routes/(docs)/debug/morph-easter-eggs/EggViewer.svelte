<!-- Portal + backdrop + content shell shared by every egg. -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import X from '@lucide/svelte/icons/x';
	import type { Snippet } from 'svelte';
	import { chromeButton } from '#lib/components/chrome.js';

	let { ariaLabel, children }: { ariaLabel: string; children: Snippet } = $props();
</script>

<Lightbox.Portal>
	<Lightbox.Backdrop class="lightbox-demo-backdrop fixed inset-0 bg-neutral-950/90" />
	<Lightbox.Content
		aria-label={ariaLabel}
		class="lightbox-demo-content fixed inset-0 flex flex-col overscroll-contain outline-none"
	>
		{@render children()}
		<div class="lightbox-demo-chrome-hide absolute end-4 top-4 z-30">
			<Lightbox.Close class={chromeButton} aria-label="Close">
				<X aria-hidden="true" class="h-[18px] w-[18px]" strokeWidth={2.25} />
			</Lightbox.Close>
		</div>
	</Lightbox.Content>
</Lightbox.Portal>
