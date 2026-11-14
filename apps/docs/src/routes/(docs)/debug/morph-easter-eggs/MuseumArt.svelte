<!-- V3's three exhibits: the FLIP diagram, the rejected scroll emulation, the broken glass. -->
<script lang="ts">
	let { id }: { id: 'flip' | 'emulation' | 'glass' } = $props();

	const CRACKS = [
		'190,84 240,60 292,44',
		'190,84 236,96 296,104',
		'190,84 208,130 224,196',
		'190,84 160,140 148,196',
		'190,84 130,100 42,110',
		'190,84 150,58 84,24',
		'190,84 198,44 204,4',
		'190,84 158,76 120,64 60,52'
	];
</script>

{#if id === 'flip'}
	<svg viewBox="0 0 320 200" class="block h-full w-full" aria-hidden="true">
		<rect width="320" height="200" fill="#f2ecdb" />
		<rect x="28" y="28" width="64" height="48" fill="none" stroke="#4a4438" stroke-width="2" />
		<text x="30" y="94" font-size="10" fill="#6b6354" font-family="monospace">first</text>
		<rect x="208" y="96" width="88" height="66" fill="none" stroke="#4a4438" stroke-width="2" />
		<text x="212" y="178" font-size="10" fill="#6b6354" font-family="monospace">last</text>
		<path
			d="M96 56 C 150 40, 180 70, 204 108"
			fill="none"
			stroke="#8a2f22"
			stroke-width="2"
			stroke-dasharray="6 5"
		/>
		<path d="M196 100 l10 6 -3 -12" fill="#8a2f22" />
		<text
			x="108"
			y="34"
			font-size="10"
			fill="#8a2f22"
			font-family="monospace"
			transform="rotate(-4 108 34)">invert…?</text
		>
		<text x="40" y="140" font-size="10" fill="#4a4438" font-family="monospace"
			>scale = last / first</text
		>
		<line
			x1="38"
			y1="136"
			x2="176"
			y2="136"
			stroke="#8a2f22"
			stroke-width="1.5"
			transform="rotate(-1 38 136)"
		/>
		<text x="40" y="160" font-size="10" fill="#4a4438" font-family="monospace"
			>scale = first / last ??</text
		>
		<text
			x="252"
			y="52"
			font-size="18"
			fill="#8a2f22"
			font-family="serif"
			font-style="italic"
			transform="rotate(6 252 52)">no.</text
		>
	</svg>
{:else if id === 'emulation'}
	<div class="relative flex h-full w-full items-center justify-center bg-[#20242b] px-6">
		<code class="text-[13px] leading-7 text-[#9fb0c3] md:text-sm">
			transform: translateX(<span class="text-[#d6a35c]">-index * 100%</span>);
		</code>
		<span
			aria-hidden="true"
			class="absolute rotate-[-14deg] rounded border-[3px] border-[#b3392b]/80 px-3 py-1 text-xl font-bold tracking-[0.2em] text-[#b3392b]/80"
		>
			REJECTED
		</span>
	</div>
{:else}
	<svg viewBox="0 0 320 200" class="block h-full w-full bg-[#101014]" aria-hidden="true">
		{#each CRACKS as points (points)}
			<polyline {points} fill="none" stroke="rgba(235,240,255,0.5)" stroke-width="1.2" />
		{/each}
		<polyline
			points="212,62 222,74 216,92 198,100"
			fill="none"
			stroke="rgba(235,240,255,0.32)"
			stroke-width="0.8"
		/>
		<circle cx="190" cy="84" r="2.4" fill="rgba(255,255,255,0.75)" />
	</svg>
{/if}
