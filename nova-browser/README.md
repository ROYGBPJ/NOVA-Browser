# NOVA Browser (Stage 1 foundation)

An iPhone browser built with React Native + Expo, WKWebView (via react-native-webview) and a native Swift media module.
Developed on Windows 11; iOS compiled in the cloud by EAS Build. See docs/FEATURE_STATUS.md for exactly what exists.

## What runs where
| Task | Where |
|---|---|
| Edit code, run unit tests, type-check | Windows (VS Code, PowerShell) |
| Compile the iOS app, sign it | EAS cloud (Apple build machines) |
| Install and test audio, background play, lock screen | A physical iPhone only |

## Requirements
- Node 20+ LTS, Git, an Expo account (free).
- **Apple Developer Program ($99/year)** to install development builds on your iPhone via EAS internal distribution
  (needs device registration and ad-hoc/development profiles). A free Apple ID cannot be used for EAS device installs,
  and free-account signing from a Mac expires after 7 days. TestFlight/App Store also need the paid program.
- iPhone with Developer Mode enabled (Settings > Privacy & Security) on iOS 16+.

## Steps (PowerShell)
```powershell
.\scripts\setup.ps1          # installs deps, EAS CLI, runs typecheck + tests
eas login
.\scripts\register-device.ps1  # once per iPhone
.\scripts\build-ios.ps1 -Profile development
```
Open the build link on your iPhone, install, then `npm start` and connect the dev client.
Change `ios.bundleIdentifier` in app.json to one you own before the first build.

## Tests
`npm test` runs core logic tests with Node's built-in runner (no extra dependencies).

## Known limitations
- Native Swift code is untested/uncompiled; expect first-build fixes. Native-module wiring may need adjustment for your Expo SDK.
- Lock-screen next/previous are disabled: browsers do not expose a site's media-session action handlers to the host app.
- Background audio depends on iOS and on each site's behavior; test every site on device (docs/AUDIO_TEST_CHECKLIST.md).
- DRM-protected streams (e.g., Spotify Web) may not play; NOVA does not and will not bypass DRM.
- Private tabs use WebView non-persistent storage; they do not make you anonymous.
- Alternative browser engines on iOS are only permitted in some regions; NOVA uses WebKit.
