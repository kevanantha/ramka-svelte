<!-- A framed exhibit: gold molding (borrowed from the landing testimonial), dark matte, whatever hangs inside. -->
<script lang="ts" module>
	const MOLDING_PROFILE: Array<[number, string]> = [
		[0, '#fdf6c0'],
		[0.06, '#d9b854'],
		[0.14, '#96741f'],
		[0.2, '#c8a53f'],
		[0.32, '#f2e196'],
		[0.5, '#c09a31'],
		[0.66, '#7a5e18'],
		[0.74, '#a98a2b'],
		[0.8, '#64511b'],
		[0.85, '#ead88b'],
		[0.92, '#bd9c35'],
		[1, '#7c6320']
	];

	const PROFILE_STOPS = MOLDING_PROFILE.map(
		([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`
	).join('');

	const FRAME_SVG = encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">` +
			`<defs>` +
			`<linearGradient id="t" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">${PROFILE_STOPS}</linearGradient>` +
			`<linearGradient id="b" x1="0" y1="240" x2="0" y2="200" gradientUnits="userSpaceOnUse">${PROFILE_STOPS}</linearGradient>` +
			`<linearGradient id="l" x1="0" y1="0" x2="40" y2="0" gradientUnits="userSpaceOnUse">${PROFILE_STOPS}</linearGradient>` +
			`<linearGradient id="r" x1="240" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">${PROFILE_STOPS}</linearGradient>` +
			`</defs>` +
			`<polygon points="0,0 240,0 200,40 40,40" fill="url(#t)"/>` +
			`<polygon points="0,0 240,0 200,40 40,40" fill="#fff" opacity=".14"/>` +
			`<polygon points="0,240 40,200 200,200 240,240" fill="url(#b)"/>` +
			`<polygon points="0,240 40,200 200,200 240,240" fill="#000" opacity=".2"/>` +
			`<polygon points="0,0 40,40 40,200 0,240" fill="url(#l)"/>` +
			`<polygon points="0,0 40,40 40,200 0,240" fill="#000" opacity=".06"/>` +
			`<polygon points="240,0 240,240 200,200 200,40" fill="url(#r)"/>` +
			`<polygon points="240,0 240,240 200,200 200,40" fill="#000" opacity=".12"/>` +
			`</svg>`
	);

	const FRAME_STYLE = `border-image: url("data:image/svg+xml,${FRAME_SVG}") 40;`;
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	let {
		morph,
		class: className = '',
		children
	}: { morph?: Attachment<HTMLElement>; class?: string; children: Snippet } = $props();
</script>

<div
	{@attach morph}
	class="border-16 bg-[#1a1915] shadow-[0_2px_6px_rgba(0,0,0,0.35),0_32px_64px_-16px_rgba(0,0,0,0.55)] md:border-20 {className}"
	style={FRAME_STYLE}
>
	<div
		class="h-full bg-[#1a1915] shadow-[inset_0_2px_6px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.05)]"
	>
		{@render children()}
	</div>
</div>
