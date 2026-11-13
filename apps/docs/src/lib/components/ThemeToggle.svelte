<script lang="ts">
	import Moon from '@lucide/svelte/icons/moon';
	import Sun from '@lucide/svelte/icons/sun';

	// The pre-paint script in app.html sets the class; read it after mount so
	// the server render and hydration agree on the icon.
	let dark = $state(false);
	$effect(() => {
		dark = document.documentElement.classList.contains('dark');
	});

	// Plain synchronous flip — no View Transition (iOS Safari's status-bar
	// tint does not re-sample under a full-viewport VT overlay).
	function toggle() {
		const next = dark ? 'light' : 'dark';
		const root = document.documentElement;
		root.classList.remove('light', 'dark');
		root.classList.add(next);
		root.style.colorScheme = next;
		try {
			localStorage.setItem('theme', next);
		} catch {
			// Storage unavailable — the flip still applies for this page.
		}
		dark = !dark;
	}
</script>

<button
	type="button"
	aria-label="Toggle theme"
	onclick={toggle}
	class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
>
	{#if dark}<Sun class="h-4 w-4" />{:else}<Moon class="h-4 w-4" />{/if}
</button>
