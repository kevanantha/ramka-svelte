<!-- Replica of the landing bento card, as a Lightbox.Trigger with a Try-me
     pill. The trigger root is the default morph source. -->
<script lang="ts">
	import * as Lightbox from 'ramka-svelte/lightbox';
	import Sparkles from '@lucide/svelte/icons/sparkles';

	let { crossfade }: { crossfade?: Lightbox.LightboxCrossfade } = $props();
</script>

<Lightbox.Trigger
	index={0}
	{crossfade}
	class="block w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-7 text-left transition hover:border-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700"
>
	<Sparkles
		aria-hidden="true"
		class="size-5 text-neutral-400 dark:text-neutral-500"
		strokeWidth={1.75}
	/>
	<span
		class="mt-4 block text-[15px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
	>
		Morph view transitions
	</span>
	<span class="mt-2 block text-[14px] leading-6 text-pretty text-neutral-500 dark:text-neutral-400">
		Thumbnails morph into the open image with shared-element View Transitions, then morph back to
		the matching thumbnail on close.
	</span>
	<span
		class="mt-5 inline-flex h-8 items-center rounded-full bg-neutral-900 px-3.5 text-xs font-medium text-white dark:bg-neutral-50 dark:text-neutral-900"
	>
		Try me
	</span>
</Lightbox.Trigger>
