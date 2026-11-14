<!--
  bits-ui overlays rendered inside an open lightbox: use this panel to
  exercise focus traps, portal stacking, and pointer events against ramka.
-->
<script lang="ts">
	import { Dialog, DropdownMenu, Tooltip } from 'bits-ui';
	import { getLightboxContext } from 'ramka-svelte';
	import Check from '@lucide/svelte/icons/check';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Info from '@lucide/svelte/icons/info';
	import Settings2 from '@lucide/svelte/icons/settings-2';
	import X from '@lucide/svelte/icons/x';
	import {
		buttonClass,
		dialogContentClass,
		dialogDescriptionClass,
		dialogFooterClass,
		dialogOverlayClass,
		dialogTitleClass,
		menuCheckboxItemClass,
		menuContentClass,
		menuItemClass,
		menuLabelClass,
		menuSeparatorClass,
		menuSubContentClass,
		menuSubTriggerClass,
		panelButtonClass,
		tooltipContentClass
	} from '#lib/components/ui.js';

	const lightbox = getLightboxContext();

	let dialogOpen = $state(false);
	let nestedOpen = $state(false);
	let showGrid = $state(true);
	let lastAction = $state('Idle');

	const slide = $derived(`${lightbox.activeIndex + 1}/${lightbox.itemCount}`);
	const statusLabel = $derived(
		lastAction === 'Idle' ? `Slide ${slide}` : `${lastAction} · slide ${slide}`
	);
</script>

{#snippet dialogClose()}
	<Dialog.Close class="{buttonClass('ghost', 'icon-sm')} absolute top-2 right-2">
		<X />
		<span class="sr-only">Close</span>
	</Dialog.Close>
{/snippet}

<!-- bits-ui adds the arrow to sideOffset (Base UI does not): -1 keeps the
     original 4px offset between trigger and tooltip body. Base UI opens a
     tooltip on keyboard focus only, so a dialog's autofocus on the help icon
     after a click does not pop it. -->
<Tooltip.Provider delayDuration={200} ignoreNonKeyboardFocus>
	<div
		class="pointer-events-auto absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] left-1/2 z-40 flex max-w-[min(100%-1.5rem,42rem)] -translate-x-1/2 flex-col gap-2 rounded-xl border border-white/20 bg-black/45 p-3 text-white shadow-lg backdrop-blur-xl backdrop-saturate-150"
		data-testid="overlay-test-panel"
	>
		<div class="flex flex-wrap items-center justify-between gap-2">
			<p class="text-xs font-medium tracking-wide text-white/80 uppercase">
				bits-ui inside lightbox
			</p>
			<span class="rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
				{statusLabel}
			</span>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<Tooltip.Root>
				<Tooltip.Trigger class={panelButtonClass}>
					<Info data-icon="inline-start" />
					Tooltip
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content side="bottom" sideOffset={-1} class="{tooltipContentClass} text-left">
						Tooltip portaled above the lightbox. Swipe slides and confirm it dismisses.
						<Tooltip.Arrow class="fill-neutral-950 dark:fill-neutral-50" width={10} height={5} />
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger class={panelButtonClass}>
					<Ellipsis data-icon="inline-start" />
					Menu
					<ChevronDown data-icon="inline-end" />
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content align="start" sideOffset={4} class="{menuContentClass} w-52">
						<DropdownMenu.Group>
							<DropdownMenu.GroupHeading class={menuLabelClass}>
								Slide actions
							</DropdownMenu.GroupHeading>
							<DropdownMenu.Item class={menuItemClass} onSelect={() => (lastAction = 'Download')}>
								Download original
							</DropdownMenu.Item>
							<DropdownMenu.Item class={menuItemClass} onSelect={() => (lastAction = 'Share link')}>
								Copy share link
							</DropdownMenu.Item>
						</DropdownMenu.Group>
						<DropdownMenu.Separator class={menuSeparatorClass} />
						<!-- Toggling keeps the menu open, like the original's Base UI checkbox item. -->
						<DropdownMenu.CheckboxItem
							class={menuCheckboxItemClass}
							closeOnSelect={false}
							bind:checked={
								() => showGrid,
								(checked) => {
									showGrid = checked;
									lastAction = checked ? 'Grid on' : 'Grid off';
								}
							}
						>
							{#snippet children({ checked })}
								Show alignment grid
								{#if checked}
									<span
										class="pointer-events-none absolute right-2 flex items-center justify-center"
									>
										<Check />
									</span>
								{/if}
							{/snippet}
						</DropdownMenu.CheckboxItem>
						<DropdownMenu.Sub>
							<DropdownMenu.SubTrigger class={menuSubTriggerClass}>
								More options
								<ChevronRight class="ml-auto" />
							</DropdownMenu.SubTrigger>
							<!-- Portaled like the root menu: nested in it, the root's scroll
							     container would clip the submenu. -->
							<DropdownMenu.Portal>
								<DropdownMenu.SubContent
									side="right"
									align="start"
									alignOffset={-3}
									sideOffset={0}
									class={menuSubContentClass}
								>
									<DropdownMenu.Item
										class={menuItemClass}
										onSelect={() => (lastAction = 'Set cover')}
									>
										Set as cover
									</DropdownMenu.Item>
									<DropdownMenu.Item
										class={menuItemClass}
										onSelect={() => (lastAction = 'Hide slide')}
									>
										Hide from album
									</DropdownMenu.Item>
								</DropdownMenu.SubContent>
							</DropdownMenu.Portal>
						</DropdownMenu.Sub>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>

			<Dialog.Root bind:open={dialogOpen}>
				<Dialog.Trigger class={panelButtonClass}>
					<Settings2 data-icon="inline-start" />
					Dialog
				</Dialog.Trigger>
				<Dialog.Portal>
					<Dialog.Overlay class={dialogOverlayClass} />
					<Dialog.Content class="{dialogContentClass} sm:max-w-md">
						<div class="flex flex-col gap-2">
							<Dialog.Title class={dialogTitleClass}>
								Nested dialog (slide {lightbox.activeIndex + 1})
							</Dialog.Title>
							<Dialog.Description class={dialogDescriptionClass}>
								Modal inside the lightbox modal. Tab should stay trapped here until closed; Escape
								should dismiss this dialog first, then the lightbox.
							</Dialog.Description>
						</div>
						<div class="space-y-3 text-sm">
							<div
								class="flex items-start gap-2 rounded-lg border border-neutral-200/60 bg-neutral-100/40 p-3 dark:border-white/10 dark:bg-neutral-800/40"
							>
								<Tooltip.Root>
									<Tooltip.Trigger
										class="{buttonClass('ghost', 'icon-sm')} mt-0.5 shrink-0"
										aria-label="About dialog tooltips"
									>
										<CircleHelp />
									</Tooltip.Trigger>
									<Tooltip.Portal>
										<Tooltip.Content
											side="right"
											sideOffset={-1}
											class="{tooltipContentClass} text-left"
										>
											Tooltip inside a nested dialog. Escape should dismiss this tooltip before the
											dialog, and the dialog before the lightbox.
											<Tooltip.Arrow
												class="fill-neutral-950 dark:fill-neutral-50"
												width={10}
												height={5}
											/>
										</Tooltip.Content>
									</Tooltip.Portal>
								</Tooltip.Root>
								<p class="text-neutral-500 dark:text-neutral-400">
									Hover the help icon to open a tooltip portaled above this dialog.
								</p>
							</div>
							<p>Open a second dialog to test stacked focus management and backdrop layering.</p>
							<Dialog.Root bind:open={nestedOpen}>
								<Dialog.Trigger class={buttonClass('outline', 'sm')}>
									Open nested dialog
								</Dialog.Trigger>
								<!-- No overlay: Base UI skips a nested dialog's backdrop, so the
								     first dialog stays sharp behind this one. -->
								<Dialog.Portal>
									<Dialog.Content class="{dialogContentClass} sm:max-w-sm">
										<div class="flex flex-col gap-2">
											<Dialog.Title class={dialogTitleClass}>Nested level 2</Dialog.Title>
											<Dialog.Description class={dialogDescriptionClass}>
												Third modal layer — verify z-index and return focus.
											</Dialog.Description>
										</div>
										<div class={dialogFooterClass}>
											<button
												type="button"
												class={buttonClass('default', 'sm')}
												onclick={() => {
													nestedOpen = false;
													lastAction = 'Nested dialog closed';
												}}
											>
												Done
											</button>
											<Dialog.Close class={buttonClass('outline')}>Close</Dialog.Close>
										</div>
										{@render dialogClose()}
									</Dialog.Content>
								</Dialog.Portal>
							</Dialog.Root>
						</div>
						<div class={dialogFooterClass}>
							<button
								type="button"
								class={buttonClass('default', 'sm')}
								onclick={() => {
									dialogOpen = false;
									lastAction = 'Dialog closed';
								}}
							>
								Save metadata
							</button>
							<Dialog.Close class={buttonClass('outline')}>Close</Dialog.Close>
						</div>
						{@render dialogClose()}
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</div>

		{#if showGrid}
			<p class="text-[11px] leading-relaxed text-white/60">
				Checklist: open each overlay, arrow/swipe between slides, pinch-zoom, press Escape
				repeatedly, click backdrop, and tab through controls.
			</p>
		{/if}
	</div>
</Tooltip.Provider>
