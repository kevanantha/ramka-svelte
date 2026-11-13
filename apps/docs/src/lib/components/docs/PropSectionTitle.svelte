<!-- Section heading like "Trigger crossfade", the part name linking to the API. -->
<script lang="ts">
	import DocsLink from './DocsLink.svelte';

	let {
		partHref,
		part,
		prop,
		sectionId
	}: { partHref: string; part: string; prop: string; sectionId: string } = $props();
</script>

<DocsLink href={partHref}>{part}</DocsLink>
<a href="#{sectionId}" class="hover:underline">{prop}</a>
