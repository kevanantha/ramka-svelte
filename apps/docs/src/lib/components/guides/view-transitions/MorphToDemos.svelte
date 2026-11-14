<!-- Live morphTo strategy demos for the View transitions guide. -->
<script lang="ts">
	import Separator from '#lib/components/docs/Separator.svelte';
	import MorphDemo from './MorphDemo.svelte';
</script>

<div class="flex flex-col gap-10">
	<section class="space-y-3">
		<h4 class="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
			morphTo="active"
		</h4>
		<p class="text-sm text-neutral-600 dark:text-neutral-400">
			Default. Close morphs to the trigger matching the active index. All five images have triggers.
		</p>
		<MorphDemo morphTo="active" ariaLabel={'morphTo="active" demo'} />
	</section>

	<Separator />

	<section class="space-y-3">
		<h4 class="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
			morphTo="origin"
		</h4>
		<p class="text-sm text-neutral-600 dark:text-neutral-400">
			Always morph back to the trigger that opened the lightbox (one tile, many items).
		</p>
		<MorphDemo
			morphTo="origin"
			triggerCount={1}
			crossfadeTriggers="all"
			ariaLabel={'morphTo="origin" demo'}
		/>
	</section>

	<Separator />

	<section class="space-y-3">
		<h4 class="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
			morphTo="closest"
		</h4>
		<p class="text-sm text-neutral-600 dark:text-neutral-400">
			Active trigger if registered, otherwise the nearest one — useful for +N grids (only first 3
			have triggers below).
		</p>
		<MorphDemo
			morphTo="closest"
			triggerCount={3}
			crossfadeTriggers="last"
			ariaLabel={'morphTo="closest" demo'}
		/>
	</section>
</div>
