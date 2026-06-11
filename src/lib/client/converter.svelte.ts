import type {
  CreatedPlaylist,
  SpotifyMatch,
  YouTubePlaylist,
  YouTubeTrack,
} from "../../types";

export type Phase =
  | "idle"
  | "fetching"
  | "loaded"
  | "matching"
  | "matched"
  | "creating"
  | "done";

export interface TrackRow {
  track: YouTubeTrack;
  status: "pending" | "searching" | "matched" | "unmatched";
  match: SpotifyMatch | null;
  included: boolean;
}

// Survives the full-page redirect through Spotify's login.
const STORAGE_KEY = "converter:last-url";

const CONCURRENCY = 3;

export class Converter {
  authenticated = $state<boolean | null>(null);
  phase = $state<Phase>("idle");
  error = $state<string | null>(null);
  playlist = $state<YouTubePlaylist | null>(null);
  rows = $state<TrackRow[]>([]);
  created = $state<CreatedPlaylist | null>(null);
  lastInput = $state("");

  processed = $derived(
    this.rows.filter((r) => r.status === "matched" || r.status === "unmatched")
      .length,
  );
  matchedRows = $derived(this.rows.filter((r) => r.status === "matched"));
  selectedRows = $derived(this.matchedRows.filter((r) => r.included));

  async init(): Promise<void> {
    const params = new URLSearchParams(location.search);
    if (params.has("connected") || params.has("auth_error")) {
      this.lastInput = sessionStorage.getItem(STORAGE_KEY) ?? "";
      if (params.has("auth_error")) {
        this.error = "Spotify connection didn't complete — try again";
      }
      history.replaceState(null, "", location.pathname);
    }
    sessionStorage.removeItem(STORAGE_KEY);
    const res = await fetch("/api/auth/status");
    this.authenticated = (await res.json()).authenticated;
  }

  login(): void {
    location.assign("/api/auth/login");
  }

  async logout(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST" });
    this.authenticated = false;
  }

  async load(input: string): Promise<void> {
    this.error = null;
    this.phase = "fetching";
    sessionStorage.setItem(STORAGE_KEY, input);
    try {
      const res = await fetch(
        `/api/youtube/playlist?url=${encodeURIComponent(input)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      this.playlist = data as YouTubePlaylist;
      this.rows = this.playlist.tracks.map((track) => ({
        track,
        status: "pending",
        match: null,
        included: true,
      }));
      this.phase = "loaded";
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Could not load playlist";
      this.phase = "idle";
    }
  }

  async convert(): Promise<void> {
    if (!this.authenticated) {
      this.login();
      return;
    }
    this.phase = "matching";
    this.error = null;

    const queue = this.rows.map((_, i) => i);
    let aborted = false;

    const worker = async () => {
      let index: number | undefined;
      while (!aborted && (index = queue.shift()) !== undefined) {
        const row = this.rows[index];
        row.status = "searching";
        try {
          const res = await fetch("/api/spotify/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(row.track),
          });
          if (res.status === 401) {
            aborted = true;
            row.status = "pending";
            this.authenticated = false;
            this.error = "Spotify session expired — connect again";
            return;
          }
          const { match } = (await res.json()) as {
            match: SpotifyMatch | null;
          };
          row.match = match;
          row.status = match ? "matched" : "unmatched";
          row.included = match !== null;
        } catch {
          row.status = "unmatched";
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, this.rows.length) }, worker),
    );
    this.phase = aborted ? "loaded" : "matched";
  }

  async create(name: string): Promise<void> {
    this.phase = "creating";
    this.error = null;
    try {
      const res = await fetch("/api/spotify/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          uris: this.selectedRows.map((r) => r.match!.uri),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      this.created = data as CreatedPlaylist;
      this.phase = "done";
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Could not create playlist";
      this.phase = "matched";
    }
  }

  reset(): void {
    this.phase = "idle";
    this.error = null;
    this.playlist = null;
    this.rows = [];
    this.created = null;
  }
}
