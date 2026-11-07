// Media-session state. The website's own player remains the source of truth;
// this reducer only mirrors events reported by the native bridge.
export type PlaybackState = 'playing' | 'paused' | 'ended' | 'stopped';
export interface MediaSession {
  tabId: string; site: string; state: PlaybackState;
  title?: string; artist?: string; album?: string; artworkUrl?: string;
  position?: number; duration?: number; muted?: boolean;
  canPrev?: boolean; canNext?: boolean; canSeek?: boolean;
}
export type MediaEvent =
  | { type: 'update'; session: MediaSession }
  | { type: 'state'; tabId: string; state: PlaybackState }
  | { type: 'tabClosed'; tabId: string }
  | { type: 'stopAll' };

export type MediaState = Record<string, MediaSession>;

export function mediaReducer(s: MediaState, e: MediaEvent): MediaState {
  switch (e.type) {
    case 'update': return { ...s, [e.session.tabId]: { ...s[e.session.tabId], ...e.session } };
    case 'state': {
      const cur = s[e.tabId];
      if (!cur) return s;
      if (e.state === 'stopped') { const { [e.tabId]: _, ...rest } = s; return rest; }
      return { ...s, [e.tabId]: { ...cur, state: e.state } };
    }
    case 'tabClosed': { const { [e.tabId]: _, ...rest } = s; return rest; }
    case 'stopAll': return {};
  }
}

export const playingTabs = (s: MediaState) =>
  Object.values(s).filter(m => m.state === 'playing').map(m => m.tabId);

// Most recently updated playing session drives Now Playing; falls back to any session.
export function nowPlayingTab(s: MediaState, lastActive?: string): string | null {
  const playing = playingTabs(s);
  if (lastActive && playing.includes(lastActive)) return lastActive;
  return playing[0] ?? Object.keys(s)[0] ?? null;
}
