import type { Attachment } from 'svelte/attachments';

/**
 * Muted looping playback for the moodboard's clips: play while `playing`,
 * pause otherwise. Re-created (and so re-applied) whenever `playing` flips.
 */
export function mutedPlayback(playing: boolean): Attachment<HTMLVideoElement> {
	return (el) => {
		el.muted = true;
		el.defaultMuted = true;
		el.volume = 0;
		if (playing) el.play().catch(() => {});
		else el.pause();
	};
}
