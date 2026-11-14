<!--
	A menu item declared inside Content but moved to a host on document.body —
	Svelte's portal pattern (a DOM move), standing in for ReactDOM.createPortal.
-->
<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import * as Lightbox from '../../../../lib/lightbox';
	import SlidesHost from '../SlidesHost.svelte';

	const toBodyHost: Attachment<HTMLElement> = (node) => {
		const host = document.createElement('div');
		host.setAttribute('data-testid', 'menu-portal-host');
		document.body.appendChild(host);
		host.appendChild(node);
		return () => host.remove();
	};
</script>

<Lightbox.Root open value={0}>
	<Lightbox.Portal>
		<Lightbox.Content data-testid="content" aria-label="Portal key test">
			<button data-testid="portaled-menu-item" type="button" {@attach toBodyHost}>Download</button>
			<SlidesHost preload={1} count={3}>
				{#snippet children(i)}
					<Lightbox.Item index={i} data-testid="item-{i}">Item {i}</Lightbox.Item>
				{/snippet}
			</SlidesHost>
		</Lightbox.Content>
	</Lightbox.Portal>
</Lightbox.Root>
