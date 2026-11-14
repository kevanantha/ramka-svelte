<!--
  Twitter / X-style thread panel: part of the design-system package (copy
  with Gallery.svelte and lightbox.css).

  Desktop: a white sidebar beside the media pane, always shown. Mobile: a
  full-screen sheet over the viewer while `open`, inert while closed; Escape
  inside it closes the sheet, not the viewer. Place it in `Lightbox.Content`,
  after the `Lightbox.Stage`.
-->
<script lang="ts" module>
	export type ThreadAuthor = {
		name: string;
		handle: string;
		avatar: string;
		verified?: boolean;
	};

	export type ThreadReply = {
		id: string;
		author: ThreadAuthor;
		text: string;
		time: string;
	};

	export type ThreadPost = {
		author: ThreadAuthor;
		text: string;
		time: string;
		stats?: {
			replies?: number;
			reposts?: number;
			likes?: number;
			views?: string;
		};
		replies: ThreadReply[];
	};

	export function formatCount(value: number | undefined): string {
		if (value == null) return '0';
		if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
		if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
		return String(value);
	}

	// Icons are inline: no icon library dependency. Gallery.svelte reuses them.
	export { iconX, iconReply, iconRepost, iconLike, iconShare };
</script>

<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';

	let {
		thread,
		open,
		onClose
	}: {
		thread: ThreadPost;
		/** Mobile sheet visibility. Ignored on desktop (sidebar always shown). */
		open: boolean;
		onClose: () => void;
	} = $props();

	const stats = $derived(thread.stats);
	const mobile = new MediaQuery('(max-width: 767px)', false);
	// Desktop sidebar is always interactive; mobile sheet is inert while closed.
	const sheetActive = $derived(!mobile.current || open);

	let scrollElement = $state.raw<HTMLDivElement | null>(null);

	$effect(() => {
		if (!open || !mobile.current) return;
		scrollElement?.focus({ preventScroll: true });
	});

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !mobile.current || !open) return;
		event.preventDefault();
		event.stopPropagation();
		onClose();
	}
</script>

{#snippet iconX()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true">
		<path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
	</svg>
{/snippet}

{#snippet iconVerified()}
	<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="xlb-verified">
		<path
			d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91-.99-1-2.5-1.27-3.9-.82C14.6 2.9 13.3 2 12 2s-2.6.9-3.06 2.13c-1.4-.45-2.91-.18-3.9.82-1.01 1.01-1.27 2.52-.81 3.91C2.88 9.33 2 10.57 2 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91 1 .99 2.5 1.27 3.9.82.46 1.23 1.76 2.13 3.06 2.13s2.6-.9 3.06-2.13c1.4.45 2.91.18 3.9-.82 1.01-1.01 1.27-2.52.81-3.91 1.31-.67 2.19-1.91 2.19-3.34Zm-6.01-3.77 1.72 1.72-6.01 6.01-3.54-3.54 1.72-1.72 1.82 1.82 4.29-4.29Z"
		/>
	</svg>
{/snippet}

{#snippet iconReply()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
		<path
			d="M19.5 10.5c0 4.142-3.358 7.5-7.5 7.5-1.38 0-2.67-.37-3.78-1.02L3 19.5V15.3c.65-1.11 1.02-2.4 1.02-3.78 0-4.142 3.358-7.5 7.5-7.5s7.5 3.358 7.5 7.5Z"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{/snippet}

{#snippet iconRepost()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
		<path
			d="M4.5 9.5 9 5l4.5 4.5M9 5v11.5M19.5 14.5 15 19l-4.5-4.5M15 19V7.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{/snippet}

{#snippet iconLike()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
		<path
			d="M12 20.25c-.19 0-.38-.07-.53-.2-5.47-4.06-8.97-6.74-8.97-11.1 0-2.98 2.4-5.4 5.36-5.4 1.64 0 3.14.79 4.14 2.02 1-1.23 2.5-2.02 4.14-2.02 2.96 0 5.36 2.42 5.36 5.4 0 4.36-3.5 7.04-8.97 11.1-.15.13-.34.2-.53.2Z"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{/snippet}

{#snippet iconShare()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
		<path
			d="M4 14v4.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V14M12 4v11M8.5 7.5 12 4l3.5 3.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{/snippet}

<aside
	class="xlb-thread-pane"
	aria-label="Post thread"
	data-open={open ? '' : undefined}
	aria-hidden={sheetActive ? undefined : 'true'}
	inert={!sheetActive}
	onkeydown={handleKeyDown}
>
	<div class="xlb-thread-header">
		<button type="button" class="xlb-thread-back" aria-label="Close thread" onclick={onClose}>
			{@render iconX()}
		</button>
		<h2 class="xlb-thread-title">Post</h2>
		<span class="xlb-thread-header-spacer" aria-hidden="true"></span>
	</div>

	<!-- svelte-ignore a11y_no_noninteractive_tabindex: a scrollable region must be focusable for keyboard scrolling -->
	<div
		bind:this={scrollElement}
		class="xlb-thread-scroll"
		tabindex="0"
		role="region"
		aria-label="Thread"
	>
		<div class="xlb-thread-body">
			<div class="xlb-author">
				<img src={thread.author.avatar} alt="" class="xlb-avatar" draggable="false" />
				<div class="xlb-author-meta">
					<div class="xlb-author-line">
						<span class="xlb-author-name">{thread.author.name}</span>
						{#if thread.author.verified}{@render iconVerified()}{/if}
					</div>
					<div class="xlb-author-line">
						<span class="xlb-author-handle">@{thread.author.handle}</span>
					</div>
				</div>
				<button type="button" class="xlb-follow">Follow</button>
			</div>

			<p class="xlb-post-text">{thread.text}</p>

			<p class="xlb-post-meta">
				<span class="xlb-post-time">{thread.time}</span>
				{#if stats?.views}
					{' · '}<strong>{stats.views}</strong> Views
				{/if}
			</p>

			{#if stats}
				<p class="xlb-post-meta">
					<strong>{formatCount(stats.reposts)}</strong> Reposts ·
					<strong>{formatCount(stats.likes)}</strong> Likes
				</p>
			{/if}

			<div class="xlb-actions" aria-label="Post actions">
				<button type="button" class="xlb-action" aria-label="Reply">
					{@render iconReply()}
					{#if stats?.replies != null}{formatCount(stats.replies)}{/if}
				</button>
				<button type="button" class="xlb-action" aria-label="Repost">
					{@render iconRepost()}
					{#if stats?.reposts != null}{formatCount(stats.reposts)}{/if}
				</button>
				<button type="button" class="xlb-action" aria-label="Like">
					{@render iconLike()}
					{#if stats?.likes != null}{formatCount(stats.likes)}{/if}
				</button>
				<button type="button" class="xlb-action" aria-label="Share">
					{@render iconShare()}
				</button>
			</div>
		</div>

		<div class="xlb-reply-box">
			<img
				src={thread.author.avatar}
				alt=""
				class="xlb-avatar xlb-reply-avatar"
				draggable="false"
			/>
			<input
				type="text"
				class="xlb-reply-input"
				placeholder="Post your reply"
				aria-label="Post your reply"
			/>
		</div>

		<ul class="xlb-replies" aria-label="Replies">
			{#each thread.replies as reply (reply.id)}
				<li class="xlb-reply">
					<img
						src={reply.author.avatar}
						alt=""
						class="xlb-avatar xlb-reply-avatar"
						draggable="false"
					/>
					<div class="xlb-author-meta">
						<div class="xlb-author-line">
							<span class="xlb-author-name">{reply.author.name}</span>
							<span class="xlb-author-handle">@{reply.author.handle}</span>
							<span class="xlb-author-handle">· {reply.time}</span>
						</div>
						<p class="xlb-reply-text">{reply.text}</p>
					</div>
				</li>
			{/each}
		</ul>
	</div>
</aside>
