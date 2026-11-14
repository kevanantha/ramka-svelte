<!--
  Demo 2: a working mini lightbox next to a transcript of what a screen
  reader would say for each interaction. The announcements are scripted from
  a table, not captured from a real AT, and the figcaption says so; the point
  is the shape of the difference, which matches what VoiceOver and NVDA do.

  The mock itself always uses real, labeled buttons. The "plain divs" toggle
  changes the simulated transcript, never the actual markup, so the demo
  stays accessible while demonstrating inaccessibility.
-->
<script lang="ts">
	import { ramkaA, ramkaB, ramkaD, ramkaE } from '#lib/photos.js';

	const PHOTOS = [
		{ src: ramkaA.thumb, alt: ramkaA.alt, caption: 'Golden hour in the meadow' },
		{ src: ramkaB.thumb, alt: ramkaB.alt, caption: 'Seashells on the shore' },
		{ src: ramkaD.thumb, alt: ramkaD.alt, caption: 'Above the clouds' },
		{ src: ramkaE.thumb, alt: ramkaE.alt, caption: 'Fog over the hills' }
	];

	type LineInput =
		| { kind: 'announce'; source: string; text: string }
		| { kind: 'silence' }
		| { kind: 'note'; text: string };

	type Line = LineInput & { id: number };

	let ariaOn = $state(true);
	let liveOn = $state(true);
	let open = $state(false);
	let index = $state(0);
	let lines = $state<Line[]>([]);
	let nextId = 0;
	let transcript = $state.raw<HTMLElement>();

	function push(...entries: LineInput[]) {
		lines = [...lines, ...entries.map((entry) => ({ ...entry, id: nextId++ }))].slice(-40);
	}

	// Keep the newest announcement visible, like a real caption feed.
	$effect(() => {
		void lines;
		if (transcript) transcript.scrollTop = transcript.scrollHeight;
	});

	function setMarkup(next: boolean) {
		if (next === ariaOn) return;
		ariaOn = next;
		push({ kind: 'note', text: next ? 'markup: dialog + ARIA' : 'markup: plain divs' });
	}

	function toggleLive() {
		push({
			kind: 'note',
			text: liveOn ? 'Counter and Caption unmounted' : 'Counter and Caption mounted'
		});
		liveOn = !liveOn;
	}

	function openLightbox() {
		open = true;
		index = 0;
		if (ariaOn) push({ kind: 'announce', source: 'dialog', text: 'Photos, dialog' });
		else push({ kind: 'silence' });
	}

	function navigate(delta: 1 | -1) {
		const next = (index + delta + PHOTOS.length) % PHOTOS.length;
		index = next;
		if (ariaOn && liveOn) {
			push(
				{ kind: 'announce', source: 'counter', text: `${next + 1} of ${PHOTOS.length}` },
				{ kind: 'announce', source: 'caption', text: PHOTOS[next]!.caption }
			);
		} else {
			push({ kind: 'silence' });
		}
	}

	function close() {
		open = false;
		if (ariaOn) push({ kind: 'announce', source: 'focus', text: 'View photos, button' });
		else push({ kind: 'silence' });
	}

	const photo = $derived(PHOTOS[index]!);

	const modeButton = (active: boolean) =>
		`h-8 rounded-full px-3.5 text-[13px] font-medium transition ${
			active
				? 'bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900'
				: 'border border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900'
		}`;

	const chromeButton =
		'flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-[15px] text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800';
</script>

<figure class="my-8 rounded-2xl border border-neutral-200 p-4 md:p-5 dark:border-neutral-800">
	<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
		<div class="flex items-center gap-2" role="group" aria-label="Simulated markup">
			<button
				type="button"
				onclick={() => setMarkup(false)}
				aria-pressed={!ariaOn}
				class={modeButton(!ariaOn)}
			>
				Plain divs
			</button>
			<button
				type="button"
				onclick={() => setMarkup(true)}
				aria-pressed={ariaOn}
				class={modeButton(ariaOn)}
			>
				dialog + ARIA
			</button>
		</div>

		<button
			type="button"
			onclick={toggleLive}
			disabled={!ariaOn}
			aria-pressed={liveOn}
			class="h-8 rounded-full border px-3.5 text-[13px] font-medium transition disabled:opacity-40 {liveOn &&
			ariaOn
				? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-400'
				: 'border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900'}"
		>
			Live regions {liveOn ? 'on' : 'off'}
		</button>
	</div>

	<div class="mt-4 grid gap-4 md:grid-cols-2">
		<!-- The mock lightbox -->
		<div
			class="relative flex h-72 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950"
		>
			{#if open}
				<div class="flex h-full w-full flex-col p-3">
					<div class="relative min-h-0 flex-1 overflow-hidden rounded-lg">
						<img
							src={photo.src}
							alt={photo.alt}
							draggable="false"
							class="absolute inset-0 h-full w-full object-cover select-none"
						/>
					</div>
					<div class="mt-2.5 flex items-center justify-between gap-2">
						<div class="flex items-center gap-1.5">
							<button
								type="button"
								onclick={() => navigate(-1)}
								aria-label="Previous"
								class={chromeButton}
							>
								‹
							</button>
							<button
								type="button"
								onclick={() => navigate(1)}
								aria-label="Next"
								class={chromeButton}
							>
								›
							</button>
						</div>
						<div class="min-w-0 text-center">
							<div class="truncate text-[13px] font-medium text-neutral-800 dark:text-neutral-200">
								{photo.caption}
							</div>
							<div class="text-[11px] text-neutral-400 tabular-nums">
								{index + 1} of {PHOTOS.length}
							</div>
						</div>
						<button type="button" onclick={close} aria-label="Close" class={chromeButton}>×</button>
					</div>
				</div>
			{:else}
				<button
					type="button"
					onclick={openLightbox}
					class="h-9 rounded-full bg-neutral-900 px-4 text-[13px] font-medium text-white transition hover:bg-neutral-700 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-300"
				>
					View photos
				</button>
			{/if}
		</div>

		<!-- The transcript -->
		<div
			class="flex h-72 flex-col overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800"
		>
			<div
				class="border-b border-neutral-200 px-3 py-2 text-[11px] font-medium tracking-wide text-neutral-400 uppercase dark:border-neutral-800 dark:text-neutral-500"
			>
				Screen reader output, simulated
			</div>
			<!-- Focusable so keyboard users can scroll it (axe:
			     scrollable-region-focusable). Deliberately not role="log" — a
			     live role would make real screen readers announce the *simulated*
			     transcript, which is exactly the confusion the figcaption
			     disclaims. -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div
				bind:this={transcript}
				tabindex="0"
				role="region"
				aria-label="Simulated screen reader transcript"
				class="flex-1 scrollbar-thin space-y-2 overflow-y-auto p-3"
			>
				{#each lines as line (line.id)}
					{#if line.kind === 'note'}
						<div class="py-0.5 text-center text-[11px] text-neutral-400 dark:text-neutral-500">
							— {line.text} —
						</div>
					{:else if line.kind === 'silence'}
						<div class="text-[13px] text-neutral-400 italic dark:text-neutral-500">
							nothing announced
						</div>
					{:else}
						<div class="flex items-baseline gap-2">
							<span
								class="w-14 shrink-0 text-[10px] tracking-wide text-neutral-400 uppercase dark:text-neutral-500"
							>
								{line.source}
							</span>
							<span
								class="text-[13px] leading-5 font-medium text-neutral-800 dark:text-neutral-200"
							>
								&ldquo;{line.text}&rdquo;
							</span>
						</div>
					{/if}
				{:else}
					<p class="text-[13px] text-neutral-400 italic dark:text-neutral-500">
						Press &ldquo;View photos&rdquo; and browse. Announcements appear here.
					</p>
				{/each}
			</div>
		</div>
	</div>

	<figcaption class="mt-4 text-[13px] leading-6 text-neutral-500 dark:text-neutral-400">
		Browse a few photos, then switch to plain divs and browse again. Note that the visible counter
		never changes: what changes is whether it is also a live region. The transcript is scripted to
		match typical VoiceOver phrasing, not captured from a real screen reader, and the mock stays
		keyboard-accessible in both modes.
	</figcaption>
</figure>
