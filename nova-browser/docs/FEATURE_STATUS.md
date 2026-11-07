# NOVA Browser feature status (Stage 1)

Legend: Implemented (code written), Tested (automated tests run), Partial, Not implemented.
Nothing has been compiled or run on an iPhone yet. TypeScript type-checking and the Swift module have not been compiled
(no network/Xcode in the authoring environment). Only the pure-TypeScript core tests (13) were executed, and they passed.

| Area | Status |
|---|---|
| URL vs search recognition, unsafe-scheme blocking | Implemented, Tested (unit) |
| Search engines: 6 built-in, add/remove custom | Implemented, Tested (unit); no settings UI yet; DuckDuckGo hard-wired as default in App.tsx |
| Tab manager: open/close/switch/duplicate/pin/reopen/close all, private tabs excluded from persistence | Implemented, Tested (unit); duplicate/pin/groups have no UI yet; tab groups not implemented |
| Session restore with corruption recovery | Implemented, Tested (unit); file persistence in App.tsx untested on device |
| WebViews kept mounted across tab switches | Implemented, Not tested on device |
| Navigation: back/forward/reload, address bar | Implemented, Not tested on device; stop-loading and progress bar not implemented |
| Private tabs (react-native-webview incognito) | Partial; history exclusion is not yet needed because history is not implemented |
| Media session state reducer | Implemented, Tested (unit) |
| Native Swift bridge: AVAudioSession, Now Playing, remote commands, interruptions, route changes | Implemented, Not compiled, Not tested |
| Read-only page media observer (metadata from navigator.mediaSession) | Implemented, Not tested |
| Lock screen / Control Center | Partial (depends on the above) |
| Media panel UI, mute, stop all, per-tab audio indicators beyond a ♪ marker | Not implemented |
| Autoplay settings | Not implemented (currently allows autoplay) |
| Bookmarks, history, downloads, passwords/Keychain/Face ID, find in page, reader mode, translation, permissions manager, settings, content blocking, homepage, accessibility pass | Not implemented |
| Spotify / DRM content | Not supported expected: WKWebView in a third-party app may not play Widevine/FairPlay-protected streams |
