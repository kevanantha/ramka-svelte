/**
 * The chrome builder's code panel, generated from the same booleans that
 * drive the live viewer, so the two cannot drift apart. Svelte markup: the
 * API is the markup.
 */
export type ChromeOptions = {
	sidebar: boolean;
	arrows: boolean;
	thumbs: boolean;
	caption: boolean;
	tooltips: boolean;
};

export function buildSnippet(o: ChromeOptions): string {
	const lines: string[] = [
		'<Lightbox.Portal>',
		'  <Lightbox.Backdrop class="…" />',
		'  <Lightbox.Content aria-label="Photos by Mia" class="…">',
		'    <Lightbox.Stage class="…">'
	];

	if (o.tooltips) {
		lines.push(
			'      <!-- wrapped in your own tooltip component -->',
			'      <Tooltip content="Close (Esc)">',
			'        <Lightbox.Close aria-label="Close"><X /></Lightbox.Close>',
			'      </Tooltip>'
		);
	} else {
		lines.push('      <Lightbox.Close aria-label="Close"><X /></Lightbox.Close>');
	}

	lines.push(
		'',
		'      <Lightbox.Slides class="…">',
		'        {#each items as item, i (item.id)}',
		'          <Lightbox.Slide>',
		'            <Lightbox.Item index={i} caption={item.caption}>',
		'              <img src={item.src} alt={item.alt} />',
		'            </Lightbox.Item>',
		'          </Lightbox.Slide>',
		'        {/each}',
		'      </Lightbox.Slides>'
	);

	if (o.arrows) {
		lines.push('');
		if (o.tooltips) {
			lines.push(
				'      <Tooltip content="Previous (←)">',
				'        <Lightbox.Previous aria-label="Previous"><ChevronLeft /></Lightbox.Previous>',
				'      </Tooltip>',
				'      <Tooltip content="Next (→)">',
				'        <Lightbox.Next aria-label="Next"><ChevronRight /></Lightbox.Next>',
				'      </Tooltip>'
			);
		} else {
			lines.push(
				'      <Lightbox.Previous aria-label="Previous"><ChevronLeft /></Lightbox.Previous>',
				'      <Lightbox.Next aria-label="Next"><ChevronRight /></Lightbox.Next>'
			);
		}
	}

	if (o.caption || o.thumbs) lines.push('');
	if (o.caption) lines.push('      <Lightbox.Caption class="…" />');
	if (o.thumbs) {
		lines.push(
			'      <Lightbox.ThumbnailStrip class="…">',
			'        <Lightbox.ThumbnailStripTrack aria-label="Thumbnails">',
			'          {#each items as item, i (item.id)}',
			'            <Lightbox.Thumbnail index={i}>',
			'              <img src={item.thumb} alt={item.alt} />',
			'            </Lightbox.Thumbnail>',
			'          {/each}',
			'        </Lightbox.ThumbnailStripTrack>',
			'      </Lightbox.ThumbnailStrip>'
		);
	}

	lines.push('    </Lightbox.Stage>');

	if (o.sidebar) {
		lines.push(
			'',
			'    <!-- a real sidebar: your markup, not a plugin -->',
			'    <aside aria-label="Post">',
			'      <PostThread {post} />',
			'    </aside>'
		);
	}

	lines.push('  </Lightbox.Content>', '</Lightbox.Portal>');
	return lines.join('\n');
}

export type Token = { text: string; kind?: 'comment' | 'string' | 'tag' | 'attr' };

const TOKEN = /(<!--.*?-->)|("(?:[^"\\]|\\.)*")|(<\/?)([A-Za-z][\w.]*)|([a-zA-Z][\w-]*)(?==)/g;

/**
 * Tiny markup tokenizer for the live panel. The server-side highlighter is
 * Shiki at prerender, so this client panel colors its own deterministic
 * snippet with the same github-light/dark palette.
 */
export function tokenizeLine(line: string): Token[] {
	const parts: Token[] = [];
	let last = 0;
	for (const m of line.matchAll(TOKEN)) {
		const index = m.index ?? 0;
		if (index > last) parts.push({ text: line.slice(last, index) });
		const [full, comment, dq, tagOpen, tagName, attr] = m;
		if (comment) parts.push({ text: comment, kind: 'comment' });
		else if (dq) parts.push({ text: dq, kind: 'string' });
		else if (tagOpen && tagName) parts.push({ text: tagOpen }, { text: tagName, kind: 'tag' });
		else if (attr) parts.push({ text: attr, kind: 'attr' });
		else parts.push({ text: full });
		last = index + full.length;
	}
	if (last < line.length) parts.push({ text: line.slice(last) });
	return parts;
}
