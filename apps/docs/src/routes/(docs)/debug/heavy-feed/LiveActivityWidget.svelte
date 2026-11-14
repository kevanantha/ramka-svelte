<!--
  "Live activity": a viewer count and fake websocket messages updating every
  300ms. Self-contained, so its ticks re-render only this widget — a morph
  still has to run against those DOM updates, which is the point.
-->
<script lang="ts">
	import { NAMES } from './feed';

	const LIVE_MESSAGES = [
		'liked your photo',
		'started following you',
		'reposted your post',
		'replied: "where is this?"',
		'sent you a message',
		'mentioned you in a comment'
	];

	let tick = $state(0);

	$effect(() => {
		const id = window.setInterval(() => tick++, 300);
		return () => window.clearInterval(id);
	});

	const viewers = $derived(1240 + ((tick * 17) % 220) - 110);
	const messages = $derived(
		Array.from({ length: 4 }, (_, i) => {
			const n = tick - i;
			return {
				key: n,
				user: `@${NAMES[Math.abs(n * 31) % NAMES.length]!.split(' ')[0]!.toLowerCase()}${Math.abs(n) % 90}`,
				text: LIVE_MESSAGES[Math.abs(n * 7) % LIVE_MESSAGES.length]!
			};
		})
	);
</script>

<aside
	aria-hidden="true"
	class="fixed right-4 bottom-4 z-20 w-64 rounded-xl border border-neutral-200 bg-white p-3 text-xs shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
>
	<p class="flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100">
		<span class="relative flex size-2">
			<span
				class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"
			></span>
			<span class="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
		</span>
		{viewers.toLocaleString()} viewing now
	</p>
	<ul class="mt-2 space-y-1 text-neutral-600 dark:text-neutral-400">
		{#each messages as m (m.key)}
			<li class="truncate">
				<span class="font-medium text-neutral-800 dark:text-neutral-200">{m.user}</span>
				{m.text}
			</li>
		{/each}
	</ul>
</aside>
