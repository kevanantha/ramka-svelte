<!-- Two independent Roots side by side (React's fragment of `makeLightbox` calls). -->
<script lang="ts">
	import MorphLightbox from './MorphLightbox.svelte';
</script>

{#each [{ id: 'a', preset: 'snappy' }, { id: 'b', preset: 'spring' }] as const as { id, preset } (id)}
	<MorphLightbox
		root={{ viewTransition: preset }}
		trigger="image"
		triggerProps={{ 'data-testid': `${id}-trigger` }}
		contentProps={{ 'aria-label': id }}
	/>
{/each}
