<!-- Per-page <title> ("<title> — ramka", the original's template) and description. -->
<script lang="ts">
	let { title, description }: { title: string; description: string } = $props();
</script>

<svelte:head>
	<title>{title} — ramka</title>
	<meta name="description" content={description} />
</svelte:head>
