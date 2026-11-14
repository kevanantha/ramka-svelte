<!--
  Demo 1: a miniature page with a lightbox overlaid, and a simulated focus
  ring stepped by Tab buttons. In "typical" mode the tab order walks straight
  out of the dialog and onto the page behind it; in "trapped" mode it cycles.

  The focus is simulated (a styled ring, not document.activeElement) so the
  demo can never hijack the reader's real keyboard, and so it works on touch.
  The readout is a polite live region, which means the demo narrates itself
  to actual screen reader users.
-->
<script lang="ts">
	import ArrowBigUp from '@lucide/svelte/icons/arrow-big-up';
	import ArrowRightToLine from '@lucide/svelte/icons/arrow-right-to-line';
	import Kbd from '#lib/components/Kbd.svelte';

	type Stop = { id: string; label: string; zone: 'dialog' | 'page' };

	const DIALOG_STOPS: Stop[] = [
		{ id: 'close', label: 'the Close button', zone: 'dialog' },
		{ id: 'prev', label: 'the Previous button', zone: 'dialog' },
		{ id: 'next', label: 'the Next button', zone: 'dialog' }
	];

	const PAGE_STOPS: Stop[] = [
		{ id: 'docs', label: 'the Docs link in the header', zone: 'page' },
		{ id: 'blog', label: 'the Blog link in the header', zone: 'page' },
		{ id: 'cart', label: 'the Add to cart button', zone: 'page' },
		{ id: 'newsletter', label: 'the Newsletter link in the footer', zone: 'page' }
	];

	let trapped = $state(false);
	let index = $state(0);

	const order = $derived(trapped ? DIALOG_STOPS : [...DIALOG_STOPS, ...PAGE_STOPS]);
	const focused = $derived(order[index % order.length] ?? DIALOG_STOPS[0]!);
	const escaped = $derived(focused.zone === 'page');

	function step(dir: 1 | -1) {
		index = (index + dir + order.length) % order.length;
	}

	function setMode(next: boolean) {
		trapped = next;
		index = 0;
	}

	const modeButton = (active: boolean) =>
		`h-8 rounded-full px-3.5 text-[13px] font-medium transition ${
			active
				? 'bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900'
				: 'border border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900'
		}`;

	const tabButton =
		'inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 font-mono text-[12px] font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900';
</script>

<!-- Fake control chip inside the aria-hidden stage. -->
{#snippet chip(id: string, text: string)}
	<span
		class="inline-flex h-7 items-center rounded-full border border-neutral-200 bg-white px-2.5 text-[12px] font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 {focused.id ===
		id
			? escaped
				? 'ring-2 ring-red-500'
				: 'ring-2 ring-blue-500'
			: ''}"
	>
		{text}
	</span>
{/snippet}

<!-- Grey skeleton bar standing in for page text. -->
{#snippet bar(className: string)}
	<div class="rounded-full bg-neutral-200/80 dark:bg-neutral-800 {className}"></div>
{/snippet}

<figure class="my-8 rounded-2xl border border-neutral-200 p-4 md:p-5 dark:border-neutral-800">
	<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
		<div class="flex items-center gap-2" role="group" aria-label="Focus handling">
			<button
				type="button"
				onclick={() => setMode(false)}
				aria-pressed={!trapped}
				class={modeButton(!trapped)}
			>
				Typical lightbox
			</button>
			<button
				type="button"
				onclick={() => setMode(true)}
				aria-pressed={trapped}
				class={modeButton(trapped)}
			>
				Focus trapped
			</button>
		</div>

		<div class="flex items-center gap-2" role="group" aria-label="Simulate keyboard">
			<button type="button" onclick={() => step(-1)} class={tabButton} aria-label="Shift Tab">
				<ArrowBigUp class="size-3.5" aria-hidden="true" />
				Tab
			</button>
			<button type="button" onclick={() => step(1)} class={tabButton} aria-label="Tab">
				Tab
				<ArrowRightToLine class="size-3.5" aria-hidden="true" />
			</button>
		</div>
	</div>

	<!-- The stage is decorative theatre; the live readout below narrates it. -->
	<div
		aria-hidden="true"
		class="relative mt-4 overflow-hidden rounded-xl border border-neutral-200 bg-white select-none dark:border-neutral-800 dark:bg-neutral-950"
	>
		<div class="flex flex-col gap-4 p-4 md:p-5">
			<div class="flex items-center justify-between gap-3">
				<div class="flex items-center gap-2">
					<div class="h-5 w-5 rounded-md bg-neutral-900 dark:bg-neutral-100"></div>
					{@render bar('h-2.5 w-14')}
				</div>
				<div class="flex items-center gap-2">
					{@render chip('docs', 'Docs')}
					{@render chip('blog', 'Blog')}
				</div>
			</div>

			<div class="flex flex-col gap-2">
				{@render bar('h-2.5 w-3/4')}
				{@render bar('h-2.5 w-1/2')}
			</div>

			<div
				class="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
			>
				<div class="flex items-center gap-3">
					<div
						class="h-10 w-10 rounded-md bg-gradient-to-br from-sky-200 to-indigo-400 dark:from-sky-800 dark:to-indigo-600"
					></div>
					<div class="flex flex-col gap-1.5">
						{@render bar('h-2 w-24')}
						{@render bar('h-2 w-16')}
					</div>
				</div>
				{@render chip('cart', 'Add to cart')}
			</div>

			<div class="flex items-center justify-between gap-3">
				{@render bar('h-2 w-20')}
				{@render chip('newsletter', 'Newsletter')}
			</div>
		</div>

		<!-- The lightbox overlay. It backs off when focus escapes so the reader
		     can see exactly where focus went. -->
		<div
			class="absolute inset-0 flex items-center justify-center bg-neutral-950/50 p-4 transition-opacity duration-300 dark:bg-neutral-950/70 {escaped
				? 'opacity-15'
				: 'opacity-100'}"
		>
			<div
				class="relative w-52 rounded-2xl border border-neutral-200 bg-white p-2.5 shadow-xl md:w-60 dark:border-neutral-700 dark:bg-neutral-900"
			>
				<div
					class="h-28 rounded-lg bg-gradient-to-br from-amber-200 via-orange-300 to-rose-400 md:h-32"
				></div>
				<div class="mt-2.5 flex items-center justify-between gap-2">
					<div class="flex items-center gap-1.5">
						{@render chip('prev', '‹')}
						{@render chip('next', '›')}
					</div>
					<span class="text-[11px] text-neutral-400 tabular-nums">2 of 9</span>
				</div>
				<span
					class="absolute -top-2.5 -right-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-[13px] text-neutral-600 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 {focused.id ===
					'close'
						? 'ring-2 ring-blue-500'
						: ''}"
				>
					×
				</span>
			</div>
		</div>
	</div>

	<p aria-live="polite" class="mt-3 text-[13px] leading-6">
		<span class="text-neutral-500 dark:text-neutral-400">Focus is on </span>
		<strong
			class={escaped
				? 'font-semibold text-red-600 dark:text-red-400'
				: 'font-semibold text-neutral-800 dark:text-neutral-200'}
		>
			{focused.label}
		</strong><span
			class={escaped ? 'text-red-600 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400'}
		>
			{escaped ? ', behind the dialog.' : ', inside the dialog.'}
		</span>
	</p>

	<figcaption class="mt-4 text-[13px] leading-6 text-neutral-500 dark:text-neutral-400">
		Press <Kbd>Tab</Kbd> a few times in each mode. The typical lightbox lets focus walk off the last button
		and onto the page behind the overlay, where a keyboard or screen reader user is now operating controls
		they cannot see. The focus ring here is simulated so the demo can never capture your real keyboard.
	</figcaption>
</figure>
