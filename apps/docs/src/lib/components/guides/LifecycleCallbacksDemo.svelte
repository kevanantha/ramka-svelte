<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import LightboxGallery from '#lib/components/LightboxGallery.svelte';
	import { triggerFocusClass } from '#lib/components/chrome.js';
	import TriggerGrid from '#lib/components/demo/TriggerGrid.svelte';
	import TriggerImage from '#lib/components/demo/TriggerImage.svelte';
	import { lightboxImages } from '#lib/photos.js';

	interface LogEntry {
		id: number;
		ts: string;
		callback: string;
		value: string;
	}

	let log = $state<LogEntry[]>([]);
	let counter = 0;

	function push(callback: string, value: string) {
		counter += 1;
		const ts = new Date().toLocaleTimeString(undefined, { hour12: false });
		log = [{ id: counter, ts, callback, value }, ...log].slice(0, 12);
	}
</script>

<div class="space-y-4">
	<Lightbox.Root
		onOpenChange={(open) => push('onOpenChange', String(open))}
		onOpenChangeComplete={(open) => push('onOpenChangeComplete', String(open))}
		onValueChange={(value, { source }) => push('onValueChange', `index=${value} source=${source}`)}
	>
		<TriggerGrid>
			{#each lightboxImages as img, i (img.src)}
				<Lightbox.Trigger index={i} class="block overflow-hidden rounded-2xl {triggerFocusClass}">
					<TriggerImage src={img.thumb} alt={img.alt} />
				</Lightbox.Trigger>
			{/each}
		</TriggerGrid>
		<LightboxGallery items={lightboxImages} ariaLabel="Lifecycle-callbacks photo gallery" />
	</Lightbox.Root>

	<section
		class="w-full max-w-2xl rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900"
	>
		<div class="text-xs font-semibold tracking-widest text-neutral-500 uppercase">Event log</div>
		{#if log.length === 0}
			<p class="mt-2 text-sm text-neutral-500">Open or close the lightbox to see events.</p>
		{:else}
			<ul class="mt-2 space-y-1 font-mono text-xs text-neutral-700 dark:text-neutral-300">
				{#each log as entry (entry.id)}
					<li class="flex gap-3">
						<span class="text-neutral-400">{entry.ts}</span>
						<span class="text-neutral-900 dark:text-neutral-100">{entry.callback}</span>
						<span class="text-neutral-500">→</span>
						<span>{entry.value}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
