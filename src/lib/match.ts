import type { YouTubeTrack } from "../types";

const NOISE_PATTERNS: RegExp[] = [
  /[([{][^)\]}]*(official|music)\s*(video|audio|visualizer)[^)\]}]*[)\]}]/gi,
  /[([{][^)\]}]*(lyric(s)?( video)?|visuali[sz]er|audio only|full album|hq|hd|4k|m\/?v)[^)\]}]*[)\]}]/gi,
  /[([{][^)\]}]*(official|explicit|clean|remaster(ed)?( \d{4})?)[^)\]}]*[)\]}]/gi,
  /\|\s*(official|music)\s*(video|audio).*/gi,
  /official\s*(music\s*)?(video|audio)/gi,
  /lyrics?\s*video/gi,
];

export function cleanTitle(title: string): string {
  let cleaned = title;
  for (const pattern of NOISE_PATTERNS) {
    cleaned = cleaned.replace(pattern, " ");
  }
  return cleaned.replace(/\s+/g, " ").trim();
}

export function buildSearchQuery(track: YouTubeTrack): string {
  const title = cleanTitle(track.title);
  // "<Artist> - Topic" channels are YouTube's auto-generated music uploads:
  // the channel carries the artist and the title is just the song name.
  const topicMatch = track.channelTitle.match(/^(.+) - Topic$/);
  if (topicMatch && !title.includes(" - ")) {
    return `${topicMatch[1]} ${title}`;
  }
  return title;
}
